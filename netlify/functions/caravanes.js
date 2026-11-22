// Caravanes.
//
// GET  /.netlify/functions/caravanes
//   Public : les caravanes à venir, avec chauffeur, compteurs d'inscrits
//   et de payés, et la liste publique des inscrits (prénom, nom et statut
//   seulement — JAMAIS de numéro de téléphone, les numéros restent privés).
//   Avec ?details=1 et le jeton caravanes : toutes les caravanes, avec la liste des inscriptions.
// POST /.netlify/functions/caravanes  (jeton caravanes)
//   Créer une caravane : { date_depart, destination, lieu_depart?,
//   numero_wave_responsable, montant_fcfa? , chauffeur_id? ,
//   nouveau_chauffeur? { prenom, nom, telephone } }
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonCaravanesValide, nonAutoriseCaravanes } from './auth.js'

// Lieu de départ par défaut, selon la destination (même règle que
// lieuDepartParDefaut dans src/data.js, recopiée ici car les fonctions
// Netlify ne partagent pas le code de src).
function lieuDepartParDefaut(destination) {
  const d = String(destination || '').toLowerCase()
  if (d.includes('dakar') || d.includes('diamniadio')) return 'Gouvernance de Diourbel'
  if (d.includes('diourbel') || d.includes('bambey')) return 'UAM, Diamniadio'
  return ''
}

function avecChauffeur(ligne) {
  return {
    id: ligne.id,
    date_depart: ligne.date_depart,
    heure_depart: ligne.heure_depart,
    destination: ligne.destination,
    lieu_depart: ligne.lieu_depart || null,
    numero_wave_responsable: ligne.numero_wave_responsable,
    montant_fcfa: ligne.montant_fcfa == null ? null : Number(ligne.montant_fcfa),
    exemple: !!ligne.exemple,
    chauffeur: ligne.chauffeur_id
      ? { prenom: ligne.ch_prenom, nom: ligne.ch_nom, telephone: ligne.ch_telephone }
      : null
  }
}

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()

  if (event.httpMethod === 'GET') {
    const details = event.queryStringParameters?.details === '1'
    if (details && !jetonCaravanesValide(event)) return nonAutoriseCaravanes()
    try {
      if (details) {
        const res = await pool.query(
          `SELECT c.*, ch.prenom AS ch_prenom, ch.nom AS ch_nom, ch.telephone AS ch_telephone
           FROM caravanes c LEFT JOIN chauffeurs ch ON ch.id = c.chauffeur_id
           ORDER BY c.date_depart DESC`
        )
        const caravanes = []
        for (const ligne of res.rows) {
          const ins = await pool.query(
            `SELECT id, prenom, nom, telephone, statut, exemple
             FROM inscriptions WHERE caravane_id = $1 ORDER BY created_at ASC`,
            [ligne.id]
          )
          caravanes.push({ ...avecChauffeur(ligne), inscriptions: ins.rows })
        }
        return reponse(200, { caravanes })
      }
      const res = await pool.query(
        `SELECT c.*, ch.prenom AS ch_prenom, ch.nom AS ch_nom, ch.telephone AS ch_telephone,
                COUNT(i.id) FILTER (WHERE i.statut <> 'désisté') AS inscrits,
                COUNT(i.id) FILTER (WHERE i.statut = 'payé') AS payes
         FROM caravanes c
         LEFT JOIN chauffeurs ch ON ch.id = c.chauffeur_id
         LEFT JOIN inscriptions i ON i.caravane_id = c.id
         WHERE c.date_depart >= CURRENT_DATE
         GROUP BY c.id, ch.prenom, ch.nom, ch.telephone
         ORDER BY c.date_depart ASC`
      )
      // Liste publique des inscrits : prénom, nom et statut seulement.
      // Les numéros de téléphone ne sortent jamais de la base ici.
      const listes = await pool.query(
        `SELECT caravane_id, prenom, nom, statut FROM inscriptions
         WHERE caravane_id = ANY($1) AND statut <> 'désisté'
         ORDER BY created_at ASC`,
        [res.rows.map((r) => r.id)]
      )
      const parCaravane = {}
      for (const ligne of listes.rows) {
        if (!parCaravane[ligne.caravane_id]) parCaravane[ligne.caravane_id] = []
        parCaravane[ligne.caravane_id].push({ prenom: ligne.prenom, nom: ligne.nom, statut: ligne.statut })
      }
      return reponse(200, {
        caravanes: res.rows.map((ligne) => ({
          ...avecChauffeur(ligne),
          inscrits: Number(ligne.inscrits),
          payes: Number(ligne.payes),
          inscrits_liste: parCaravane[ligne.id] || []
        }))
      })
    } catch (e) {
      console.error(e)
      return erreur('Impossible de charger les caravanes.')
    }
  }

  if (event.httpMethod === 'POST') {
    if (!jetonCaravanesValide(event)) return nonAutoriseCaravanes()
    const corps = lireCorps(event)
    const date_depart = nettoyerTexte(corps.date_depart)
    const heure_depart = /^\d{2}:\d{2}$/.test(String(corps.heure_depart || '')) ? corps.heure_depart : '08:00'
    const destination = nettoyerTexte(corps.destination)
    const lieu_depart = nettoyerTexte(corps.lieu_depart) || lieuDepartParDefaut(destination)
    const numero_wave = nettoyerTexte(corps.numero_wave_responsable)
    const montant_fcfa =
      corps.montant_fcfa === '' || corps.montant_fcfa == null
        ? null
        : Math.trunc(Number(corps.montant_fcfa))
    if (!date_depart || !destination || !numero_wave) {
      return erreur('Date, destination et numéro Wave sont obligatoires.', 400)
    }
    if (montant_fcfa != null && (!Number.isFinite(montant_fcfa) || montant_fcfa < 0)) {
      return erreur('Le montant doit être un nombre positif, en FCFA.', 400)
    }
    try {
      let chauffeur_id = corps.chauffeur_id ? Number(corps.chauffeur_id) : null
      if (corps.nouveau_chauffeur && nettoyerTexte(corps.nouveau_chauffeur.nom)) {
        const nc = corps.nouveau_chauffeur
        if (!nettoyerTexte(nc.prenom) || !nettoyerTexte(nc.telephone)) {
          return erreur('Prénom et numéro du nouveau chauffeur sont obligatoires.', 400)
        }
        const ins = await pool.query(
          'INSERT INTO chauffeurs (prenom, nom, telephone) VALUES ($1, $2, $3) RETURNING id',
          [nettoyerTexte(nc.prenom), nettoyerTexte(nc.nom), nettoyerTexte(nc.telephone)]
        )
        chauffeur_id = ins.rows[0].id
      }
      const res = await pool.query(
        `INSERT INTO caravanes (date_depart, heure_depart, destination, lieu_depart, chauffeur_id, numero_wave_responsable, montant_fcfa)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [date_depart, heure_depart, destination, lieu_depart || null, chauffeur_id, numero_wave, montant_fcfa]
      )
      return reponse(201, { caravane_id: res.rows[0].id })
    } catch (e) {
      console.error(e)
      return erreur('Impossible de créer cette caravane.')
    }
  }

  return erreur('Méthode non autorisée.', 405)
}
