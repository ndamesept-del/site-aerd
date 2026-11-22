// Base locale de développement, dans le navigateur (localStorage).
// Utilisée seulement quand on lance le site avec `npm run dev` sans
// Netlify Functions. Les données restent dans ce navigateur.
// Base vide au départ. Aucune donnée réelle, jamais.
//
// Le mot de passe du mode local est la valeur par défaut de développement
// ("change-moi"). Sur le vrai site, le mot de passe vient de la variable
// d'environnement BUREAU_PASSWORD (voir README).

import { desistementOuvert } from './data.js'

const CLE = 'aerd-local-v1'
const MOT_DE_PASSE_DEV = 'change-moi'

function etatVide() {
  return {
    membres: [],
    chauffeurs: [],
    caravanes: [],
    inscriptions: [],
    bureau: [],
    cotisations: [],
    dons_tickets: [],
    inscriptions_tickets: [],
    parametres: {},
    seq: { membre: 1, chauffeur: 1, caravane: 1, inscription: 1, bureau: 1, cotisation: 1, don: 1, inscription_ticket: 1 }
  }
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE)
    if (brut) return JSON.parse(brut)
  } catch {
    // données illisibles : on repart d'une base vide
  }
  return etatVide()
}

function sauver(etat) {
  localStorage.setItem(CLE, JSON.stringify(etat))
}

function nettoyerTexte(v) {
  return String(v || '').trim()
}

function erreur(message) {
  const e = new Error(message)
  e.status = 400
  throw e
}

function exigerAuth(opts) {
  if (!opts.token || opts.token !== jetonLocal()) {
    const e = new Error('Accès refusé. Connecte-toi à l’espace bureau.')
    e.status = 401
    throw e
  }
}

// Jeton du mode local : simple signature du mot de passe (développement seulement).
function hachageSimple(texte) {
  let h = 0
  for (let i = 0; i < texte.length; i++) {
    h = (h * 31 + texte.charCodeAt(i)) >>> 0
  }
  return 'local-' + h.toString(16)
}

function jetonLocal() {
  return hachageSimple(MOT_DE_PASSE_DEV + ':bureau')
}

function avecChauffeur(etat, c) {
  const ch = c.chauffeur_id ? etat.chauffeurs.find((x) => x.id === c.chauffeur_id) : null
  return {
    id: c.id,
    date_depart: c.date_depart,
    heure_depart: c.heure_depart || '08:00',
    destination: c.destination,
    numero_wave_responsable: c.numero_wave_responsable,
    montant_fcfa: c.montant_fcfa == null ? null : Number(c.montant_fcfa),
    exemple: !!c.exemple,
    chauffeur: ch ? { prenom: ch.prenom, nom: ch.nom, telephone: ch.telephone } : null
  }
}

function compter(etat, caravane_id) {
  const liste = etat.inscriptions.filter((i) => i.caravane_id === caravane_id && i.statut !== 'désisté')
  return {
    inscrits: liste.length,
    payes: liste.filter((i) => i.statut === 'payé').length
  }
}

export const local = {
  async appel(nom, opts = {}) {
    const etat = charger()
    const corps = opts.corps || {}
    const params = opts.params || {}

    if (nom === 'login') {
      if (corps.password !== MOT_DE_PASSE_DEV) erreur('Mot de passe incorrect.')
      return { token: jetonLocal() }
    }

    if (nom === 'caravanes') {
      if ((opts.methode || 'GET') === 'GET') {
        const liste = [...etat.caravanes].sort((a, b) => (a.date_depart < b.date_depart ? -1 : 1))
        if (params.details === '1') {
          exigerAuth(opts)
          return {
            caravanes: liste.map((c) => ({
              ...avecChauffeur(etat, c),
              inscriptions: etat.inscriptions
                .filter((i) => i.caravane_id === c.id)
                .map((i) => ({ id: i.id, prenom: i.prenom, nom: i.nom, telephone: i.telephone, statut: i.statut, exemple: !!i.exemple }))
            }))
          }
        }
        const aujourdhui = new Date().toISOString().slice(0, 10)
        return {
          caravanes: liste
            .filter((c) => c.date_depart >= aujourdhui)
            .map((c) => ({
              ...avecChauffeur(etat, c),
              ...compter(etat, c.id),
              // Liste publique : prénom, nom et statut seulement,
              // jamais de numéro de téléphone.
              inscrits_liste: etat.inscriptions
                .filter((i) => i.caravane_id === c.id && i.statut !== 'désisté')
                .map((i) => ({ prenom: i.prenom, nom: i.nom, statut: i.statut }))
            }))
        }
      }
      // POST : créer une caravane (bureau)
      exigerAuth(opts)
      const date_depart = nettoyerTexte(corps.date_depart)
      const heure_depart = /^\d{2}:\d{2}$/.test(String(corps.heure_depart || '')) ? corps.heure_depart : '08:00'
      const destination = nettoyerTexte(corps.destination)
      const numero_wave = nettoyerTexte(corps.numero_wave_responsable)
      const montant_fcfa =
        corps.montant_fcfa === '' || corps.montant_fcfa == null ? null : Math.trunc(Number(corps.montant_fcfa))
      if (!date_depart || !destination || !numero_wave) erreur('Date, destination et numéro Wave sont obligatoires.')
      if (montant_fcfa != null && (!Number.isFinite(montant_fcfa) || montant_fcfa < 0)) {
        erreur('Le montant doit être un nombre positif, en FCFA.')
      }
      let chauffeur_id = corps.chauffeur_id ? Number(corps.chauffeur_id) : null
      if (corps.nouveau_chauffeur && nettoyerTexte(corps.nouveau_chauffeur.nom)) {
        const nc = corps.nouveau_chauffeur
        if (!nettoyerTexte(nc.prenom) || !nettoyerTexte(nc.telephone)) erreur('Prénom et numéro du nouveau chauffeur sont obligatoires.')
        chauffeur_id = etat.seq.chauffeur++
        etat.chauffeurs.push({
          id: chauffeur_id,
          prenom: nettoyerTexte(nc.prenom),
          nom: nettoyerTexte(nc.nom),
          telephone: nettoyerTexte(nc.telephone),
          exemple: false
        })
      }
      const id = etat.seq.caravane++
      etat.caravanes.push({ id, date_depart, heure_depart, destination, chauffeur_id, numero_wave_responsable: numero_wave, montant_fcfa, exemple: false })
      sauver(etat)
      return { caravane: avecChauffeur(etat, etat.caravanes.find((c) => c.id === id)) }
    }

    if (nom === 'inscriptions') {
      if (corps.action === 'inscrire') {
        // Champ piège anti-spam (honeypot), comme côté serveur.
        if (nettoyerTexte(corps.site_web)) erreur('Une erreur est survenue.')
        const caravane_id = Number(corps.caravane_id)
        const prenom = nettoyerTexte(corps.prenom)
        const nom = nettoyerTexte(corps.nom)
        const telephone = nettoyerTexte(corps.telephone)
        if (!caravane_id || !prenom || !nom || !telephone) erreur('Prénom, nom et numéro de téléphone sont obligatoires.')
        if (telephone.replace(/\D/g, '').length < 9) erreur('Le numéro de téléphone semble incomplet.')
        const caravane = etat.caravanes.find((c) => c.id === caravane_id)
        if (!caravane) erreur('Caravane introuvable.')
        const existante = etat.inscriptions.find(
          (i) => i.caravane_id === caravane_id && i.telephone === telephone && i.statut !== 'désisté'
        )
        if (existante) erreur('Ce numéro est déjà inscrit à cette caravane.')
        const ancienne = etat.inscriptions.find(
          (i) => i.caravane_id === caravane_id && i.telephone === telephone && i.statut === 'désisté'
        )
        if (ancienne) {
          ancienne.statut = 'inscrit'
          ancienne.prenom = prenom
          ancienne.nom = nom
          sauver(etat)
          return { inscription: ancienne }
        }
        const id = etat.seq.inscription++
        const inscription = { id, caravane_id, prenom, nom, telephone, statut: 'inscrit', exemple: false }
        etat.inscriptions.push(inscription)
        sauver(etat)
        return { inscription }
      }
      if (corps.action === 'desister') {
        const caravane_id = Number(corps.caravane_id)
        const telephone = nettoyerTexte(corps.telephone)
        const caravane = etat.caravanes.find((c) => c.id === caravane_id)
        if (!caravane) erreur('Caravane introuvable.')
        // Règle des désistements : fermés quand il reste moins de 24 heures
        // avant le départ, pour ne pas porter préjudice à la caravane.
        if (!desistementOuvert(caravane)) {
          erreur('Les désistements sont fermés : la caravane part dans moins de 24 heures. Contacte le bureau.')
        }
        const inscription = etat.inscriptions.find(
          (i) => i.caravane_id === caravane_id && i.telephone === telephone && i.statut !== 'désisté'
        )
        if (!inscription) erreur('Aucune inscription trouvée avec ce numéro pour cette caravane.')
        inscription.statut = 'désisté'
        sauver(etat)
        return { ok: true }
      }
      if (corps.action === 'marquer-paye' || corps.action === 'retirer') {
        exigerAuth(opts)
        const inscription = etat.inscriptions.find((i) => i.id === Number(corps.inscription_id))
        if (!inscription) erreur('Inscription introuvable.')
        inscription.statut = corps.action === 'marquer-paye' ? 'payé' : 'désisté'
        sauver(etat)
        return { inscription }
      }
      erreur('Action inconnue.')
    }

    if (nom === 'membres') {
      exigerAuth(opts)
      if ((opts.methode || 'GET') === 'GET') {
        const q = nettoyerTexte(params.q).toLowerCase()
        let liste = [...etat.membres].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
        if (q) {
          liste = liste.filter(
            (m) =>
              (m.nom + ' ' + m.prenom).toLowerCase().includes(q) ||
              (m.prenom + ' ' + m.nom).toLowerCase().includes(q) ||
              m.telephone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
          )
        }
        return { membres: liste }
      }
      // Statut boursier : vrai, faux, ou null (non renseigné). Le bureau
      // le définit pour chaque membre, dans le formulaire d'ajout et
      // de modification.
      const boursier =
        corps.boursier === true || corps.boursier === 'true'
          ? true
          : corps.boursier === false || corps.boursier === 'false'
            ? false
            : null
      if ((opts.methode || 'GET') === 'PUT') {
        const membre = etat.membres.find((m) => m.id === Number(corps.id))
        if (!membre) erreur('Membre introuvable.')
        const prenom = nettoyerTexte(corps.prenom)
        const nom = nettoyerTexte(corps.nom)
        const telephone = nettoyerTexte(corps.telephone)
        const ufr_departement = nettoyerTexte(corps.ufr_departement)
        const niveau = nettoyerTexte(corps.niveau)
        const origine = nettoyerTexte(corps.origine)
        if (!prenom || !nom || !telephone || !ufr_departement || !niveau || !origine) {
          erreur('Prénom, nom, téléphone, filière, niveau et origine sont obligatoires.')
        }
        membre.prenom = prenom
        membre.nom = nom
        membre.telephone = telephone
        membre.telephone_parent = nettoyerTexte(corps.telephone_parent)
        membre.ufr_departement = ufr_departement
        membre.niveau = niveau
        membre.origine = origine
        membre.boursier = boursier
        sauver(etat)
        return { membre }
      }
      const membre = {
        id: etat.seq.membre++,
        prenom: nettoyerTexte(corps.prenom),
        nom: nettoyerTexte(corps.nom),
        telephone: nettoyerTexte(corps.telephone),
        telephone_parent: nettoyerTexte(corps.telephone_parent),
        ufr_departement: nettoyerTexte(corps.ufr_departement),
        niveau: nettoyerTexte(corps.niveau),
        origine: nettoyerTexte(corps.origine),
        boursier,
        exemple: false
      }
      if (!membre.prenom || !membre.nom || !membre.telephone || !membre.ufr_departement || !membre.niveau || !membre.origine) {
        erreur('Prénom, nom, téléphone, filière, niveau et origine sont obligatoires.')
      }
      etat.membres.push(membre)
      sauver(etat)
      return { membre }
    }

    if (nom === 'chauffeurs') {
      exigerAuth(opts)
      if ((opts.methode || 'GET') === 'GET') {
        const q = nettoyerTexte(params.q).toLowerCase()
        let liste = [...etat.chauffeurs].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
        if (q) {
          liste = liste.filter(
            (c) =>
              (c.nom + ' ' + c.prenom).toLowerCase().includes(q) ||
              (c.prenom + ' ' + c.nom).toLowerCase().includes(q) ||
              c.telephone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
          )
        }
        return { chauffeurs: liste }
      }
      const chauffeur = {
        id: etat.seq.chauffeur++,
        prenom: nettoyerTexte(corps.prenom),
        nom: nettoyerTexte(corps.nom),
        telephone: nettoyerTexte(corps.telephone),
        exemple: false
      }
      if (!chauffeur.prenom || !chauffeur.nom || !chauffeur.telephone) erreur('Prénom, nom et numéro sont obligatoires.')
      etat.chauffeurs.push(chauffeur)
      sauver(etat)
      return { chauffeur }
    }

    if (nom === 'bureau') {
      // GET : public, tout le monde peut voir l'organigramme.
      // Les anciens sont renvoyés séparément, sans photo.
      if ((opts.methode || 'GET') === 'GET') {
        const liste = [...etat.bureau].sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, 'fr'))
        const actuel = (m) => ({ ...m, ancien: !!m.ancien })
        const anciens = liste.filter((m) => m.ancien).map((m) => ({ ...actuel(m), photo: '' }))
        return { bureau: liste.filter((m) => !m.ancien).map(actuel), anciens }
      }
      exigerAuth(opts)
      if ((opts.methode || 'GET') === 'POST') {
        // Passer un membre aux anciens : son nom et son poste sont gardés,
        // mais sa photo est supprimée pour libérer de l'espace.
        if (corps.action === 'passer-ancien') {
          const membre = etat.bureau.find((b) => b.id === Number(corps.id))
          if (!membre) erreur('Membre du bureau introuvable.')
          membre.ancien = true
          membre.photo = ''
          sauver(etat)
          return { membre: { ...membre } }
        }
        const membre = {
          id: etat.seq.bureau++,
          prenom: nettoyerTexte(corps.prenom),
          nom: nettoyerTexte(corps.nom),
          poste: nettoyerTexte(corps.poste),
          photo: String(corps.photo || ''),
          ordre: Number.isFinite(Number(corps.ordre)) ? Math.trunc(Number(corps.ordre)) : 0,
          ancien: false,
          exemple: false
        }
        if (!membre.prenom || !membre.nom || !membre.poste) erreur('Prénom, nom et poste sont obligatoires.')
        if (membre.photo && !membre.photo.startsWith('data:image/')) erreur('La photo doit être une image.')
        etat.bureau.push(membre)
        sauver(etat)
        return { membre }
      }
      if (opts.methode === 'PUT') {
        const membre = etat.bureau.find((b) => b.id === Number(corps.id))
        if (!membre) erreur('Membre du bureau introuvable.')
        const prenom = nettoyerTexte(corps.prenom)
        const nom = nettoyerTexte(corps.nom)
        const poste = nettoyerTexte(corps.poste)
        if (!prenom || !nom || !poste) erreur('Prénom, nom et poste sont obligatoires.')
        const photo = String(corps.photo || '')
        if (photo && !photo.startsWith('data:image/')) erreur('La photo doit être une image.')
        membre.prenom = prenom
        membre.nom = nom
        membre.poste = poste
        membre.photo = photo
        membre.ordre = Number.isFinite(Number(corps.ordre)) ? Math.trunc(Number(corps.ordre)) : 0
        sauver(etat)
        return { membre }
      }
      if (opts.methode === 'DELETE') {
        etat.bureau = etat.bureau.filter((b) => b.id !== Number(corps.id))
        sauver(etat)
        return { ok: true }
      }
      erreur('Méthode inconnue.')
    }

    if (nom === 'cotisations') {
      exigerAuth(opts)
      const mois = nettoyerTexte(params.mois)
      if ((opts.methode || 'GET') === 'GET') {
        if (!/^\d{4}-\d{2}$/.test(mois)) erreur('Mois invalide. Utilise le format AAAA-MM, ex : 2026-11.')
        const membres = [...etat.membres]
          .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
          .map((m) => {
            const cot = etat.cotisations.find((c) => c.membre_id === m.id && c.mois === mois)
            return { id: m.id, prenom: m.prenom, nom: m.nom, telephone: m.telephone, statut: cot ? cot.statut : 'en_attente', montant_fcfa: 500 }
          })
        const payes = membres.filter((m) => m.statut === 'paye')
        return {
          mois,
          membres,
          total_membres: membres.length,
          payes: payes.length,
          total_collecte: payes.length * 500
        }
      }
      // POST : marquer payé ou remettre en attente.
      const membre_id = Number(corps.membre_id)
      const statut = nettoyerTexte(corps.statut)
      if (!membre_id || !/^\d{4}-\d{2}$/.test(nettoyerTexte(corps.mois))) {
        erreur('Membre et mois (AAAA-MM) sont obligatoires.')
      }
      if (statut !== 'paye' && statut !== 'en_attente') erreur('Statut invalide.')
      if (!etat.membres.find((m) => m.id === membre_id)) erreur('Membre introuvable.')
      let cot = etat.cotisations.find((c) => c.membre_id === membre_id && c.mois === nettoyerTexte(corps.mois))
      if (cot) {
        cot.statut = statut
      } else {
        cot = { id: etat.seq.cotisation++, membre_id, mois: nettoyerTexte(corps.mois), montant_fcfa: 500, statut }
        etat.cotisations.push(cot)
      }
      sauver(etat)
      return { cotisation: { membre_id: cot.membre_id, mois: cot.mois, montant_fcfa: cot.montant_fcfa, statut: cot.statut } }
    }

    if (nom === 'dons') {
      if ((opts.methode || 'GET') === 'GET') {
        const restants = (don) => {
          const attribues = etat.inscriptions_tickets.filter((i) => i.don_id === don.id && i.statut === 'attribue').length
          return Math.max(0, Number(don.nombre_tickets || 0) - attribues)
        }
        const ligne = (don) => ({
          id: don.id,
          titre: don.titre,
          description: don.description || '',
          nombre_tickets: Number(don.nombre_tickets || 0),
          tickets_restants: restants(don),
          lieu_retrait: don.lieu_retrait,
          statut: don.statut,
          exemple: !!don.exemple
        })
        const liste = [...etat.dons_tickets].sort((a, b) => b.id - a.id)
        if (params.details === '1') {
          exigerAuth(opts)
          // Tri automatique côté serveur : les non-boursiers d'abord,
          // puis les non renseignés (NULL), puis les boursiers.
          const rang = (i) => (i.boursier === false ? 0 : i.boursier == null ? 1 : 2)
          const trier = (a, b) => rang(a) - rang(b) || a.id - b.id
          return {
            dons: liste.map((d) => ({
              ...ligne(d),
              inscrits: etat.inscriptions_tickets.filter((i) => i.don_id === d.id).sort(trier)
            }))
          }
        }
        return { dons: liste.filter((d) => d.statut === 'ouvert').map(ligne) }
      }
      exigerAuth(opts)
      if ((opts.methode || 'GET') === 'POST') {
        const titre = nettoyerTexte(corps.titre)
        const description = nettoyerTexte(corps.description)
        const nombre_tickets = Math.trunc(Number(corps.nombre_tickets))
        const lieu_retrait = nettoyerTexte(corps.lieu_retrait)
        if (!titre || !lieu_retrait) erreur('Le titre et le lieu de retrait sont obligatoires.')
        if (!Number.isFinite(nombre_tickets) || nombre_tickets < 1) erreur('Le nombre de tickets doit être au moins 1.')
        const don = { id: etat.seq.don++, titre, description, nombre_tickets, lieu_retrait, statut: 'ouvert', exemple: false }
        etat.dons_tickets.push(don)
        sauver(etat)
        return { don: { ...don, tickets_restants: nombre_tickets } }
      }
      if (opts.methode === 'PUT') {
        const don = etat.dons_tickets.find((d) => d.id === Number(corps.id))
        if (!don) erreur('Campagne introuvable.')
        const statut = nettoyerTexte(corps.statut)
        if (statut !== 'ouvert' && statut !== 'ferme') erreur('Statut invalide.')
        don.statut = statut
        sauver(etat)
        const attribues = etat.inscriptions_tickets.filter((i) => i.don_id === don.id && i.statut === 'attribue').length
        return { don: { ...don, tickets_restants: Math.max(0, Number(don.nombre_tickets || 0) - attribues) } }
      }
      erreur('Méthode inconnue.')
    }

    if (nom === 'inscriptions_tickets') {
      if (corps.action === 'attribuer' || corps.action === 'refuser') {
        exigerAuth(opts)
        const inscription = etat.inscriptions_tickets.find((i) => i.id === Number(corps.id))
        if (!inscription) erreur('Inscription introuvable.')
        if (corps.action === 'attribuer') {
          if (inscription.statut !== 'inscrit') erreur('Cette demande a déjà été traitée.')
          const don = etat.dons_tickets.find((d) => d.id === inscription.don_id)
          if (!don) erreur('Campagne introuvable.')
          const attribues = etat.inscriptions_tickets.filter((i) => i.don_id === don.id && i.statut === 'attribue').length
          if (attribues >= Number(don.nombre_tickets)) erreur('Il n’y a plus de tickets pour cette campagne.')
          inscription.statut = 'attribue'
          sauver(etat)
          return { inscription }
        }
        if (inscription.statut !== 'inscrit') erreur('Inscription introuvable ou déjà traitée.')
        inscription.statut = 'refuse'
        sauver(etat)
        return { inscription }
      }
      // Inscription publique à une campagne de dons.
      if (nettoyerTexte(corps.site_web)) erreur('Une erreur est survenue.')
      const don_id = Number(corps.don_id)
      const prenom = nettoyerTexte(corps.prenom)
      const nom = nettoyerTexte(corps.nom)
      const telephone = nettoyerTexte(corps.telephone)
      if (!don_id || !prenom || !nom || !telephone) erreur('Prénom, nom et numéro de téléphone sont obligatoires.')
      if (telephone.replace(/\D/g, '').length < 9) erreur('Le numéro de téléphone semble incomplet.')
      const don = etat.dons_tickets.find((d) => d.id === don_id)
      if (!don) erreur('Campagne introuvable.')
      if (don.statut !== 'ouvert') erreur('Cette campagne de dons est fermée.')
      const attribues = etat.inscriptions_tickets.filter((i) => i.don_id === don_id && i.statut === 'attribue').length
      if (attribues >= Number(don.nombre_tickets)) erreur('Il n’y a plus de tickets pour cette campagne.')
      // Statut boursier : rempli TOUT SEUL par le site. On cherche le numéro
      // de téléphone dans la liste des membres et on copie son statut
      // (vrai, faux, ou NULL si la personne n'est pas membre ou si son
      // statut n'est pas renseigné). On ne demande JAMAIS « Es-tu
      // boursier ? » dans ce formulaire.
      const telPropre = telephone.replace(/\s/g, '')
      const membreTrouve = etat.membres.find((m) => String(m.telephone).replace(/\s/g, '') === telPropre)
      const boursier = membreTrouve ? (membreTrouve.boursier == null ? null : !!membreTrouve.boursier) : null
      const existante = etat.inscriptions_tickets.find(
        (i) => i.don_id === don_id && i.telephone === telephone && i.statut !== 'refuse'
      )
      if (existante) erreur('Ce numéro est déjà inscrit pour cette campagne de dons.')
      const ancienne = etat.inscriptions_tickets.find(
        (i) => i.don_id === don_id && i.telephone === telephone && i.statut === 'refuse'
      )
      if (ancienne) {
        ancienne.prenom = prenom
        ancienne.nom = nom
        ancienne.boursier = boursier
        ancienne.statut = 'inscrit'
        sauver(etat)
        return { inscription: ancienne }
      }
      const inscription = { id: etat.seq.inscription_ticket++, don_id, prenom, nom, telephone, boursier, statut: 'inscrit' }
      etat.inscriptions_tickets.push(inscription)
      sauver(etat)
      return { inscription }
    }

    if (nom === 'parametres') {
      if ((opts.methode || 'GET') === 'GET') {
        return { numero_wave_tresorier: etat.parametres.numero_wave_tresorier || '' }
      }
      exigerAuth(opts)
      const numero = nettoyerTexte(corps.numero_wave_tresorier)
      if (numero && numero.replace(/\D/g, '').length < 9) erreur('Le numéro de téléphone semble incomplet.')
      etat.parametres.numero_wave_tresorier = numero
      sauver(etat)
      return { numero_wave_tresorier: numero }
    }

    if (nom === 'stats') {
      exigerAuth(opts)
      return {
        membres: etat.membres.length,
        chauffeurs: etat.chauffeurs.length,
        caravanes: etat.caravanes.length,
        paiements_en_attente: etat.inscriptions.filter((i) => i.statut === 'inscrit').length
      }
    }

    if (nom === 'exemples') {
      exigerAuth(opts)
      if (corps.action === 'supprimer') {
        const garde = (x) => !x.exemple
        etat.membres = etat.membres.filter(garde)
        etat.chauffeurs = etat.chauffeurs.filter(garde)
        etat.caravanes = etat.caravanes.filter(garde)
        etat.inscriptions = etat.inscriptions.filter(garde)
        etat.bureau = etat.bureau.filter(garde)
        sauver(etat)
        return { ok: true }
      }
      if (corps.action === 'charger') {
        const dans7jours = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
        const idChauffeur = etat.seq.chauffeur++
        etat.chauffeurs.push({ id: idChauffeur, prenom: 'Mamadou', nom: 'Exemple', telephone: '70 000 00 09', exemple: true })
        const idCaravane = etat.seq.caravane++
        etat.caravanes.push({
          id: idCaravane,
          date_depart: dans7jours,
          heure_depart: '08:00',
          destination: 'Diourbel',
          chauffeur_id: idChauffeur,
          numero_wave_responsable: '70 000 00 00',
          exemple: true
        })
        const exemples = [
          { prenom: 'Aminata', nom: 'Exemple', telephone: '70 000 00 01', statut: 'payé' },
          { prenom: 'Moussa', nom: 'Exemple', telephone: '70 000 00 02', statut: 'inscrit' },
          { prenom: 'Fatou', nom: 'Exemple', telephone: '70 000 00 03', statut: 'inscrit' }
        ]
        for (const e of exemples) {
          etat.inscriptions.push({
            id: etat.seq.inscription++,
            caravane_id: idCaravane,
            prenom: e.prenom,
            nom: e.nom,
            telephone: e.telephone,
            statut: e.statut,
            exemple: true
          })
          etat.membres.push({
            id: etat.seq.membre++,
            prenom: e.prenom,
            nom: e.nom,
            telephone: e.telephone,
            telephone_parent: '70 000 00 04',
            ufr_departement: 'UFR SEG',
            niveau: 'L2',
            origine: 'Diourbel',
            boursier: null,
            exemple: true
          })
        }
        sauver(etat)
        return { ok: true }
      }
      erreur('Action inconnue.')
    }

    erreur('Fonction inconnue : ' + nom)
  }
}
