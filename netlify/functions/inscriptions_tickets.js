// Inscriptions aux dons de tickets.
//
// POST /.netlify/functions/inscriptions_tickets
//   Public, sans jeton :
//     { don_id, prenom, nom, telephone }
//     La campagne doit être ouverte et il doit rester des tickets.
//     Un même numéro ne peut pas s'inscrire deux fois à la même campagne.
//   Bureau, avec jeton :
//     { action: 'attribuer', id }  (donner un ticket à cette personne)
//     { action: 'refuser', id }    (refuser la demande)
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

// Anti-spam simple (en mémoire de la fonction, première ligne de
// défense) : une même personne ne peut pas s'inscrire deux fois
// en moins de 60 secondes, et pas plus de 20 inscriptions par
// minute au total. Les fonctions Netlify sont éphémères, donc
// cette limite ne remplace pas la vérification du doublon en base.
const dernieresParTelephone = new Map()
const dernieresInscriptions = []

function tropRapide(telephone) {
  const maintenant = Date.now()
  const derniere = dernieresParTelephone.get(telephone)
  if (derniere && maintenant - derniere < 60 * 1000) return true
  while (dernieresInscriptions.length > 0 && maintenant - dernieresInscriptions[0] > 60 * 1000) {
    dernieresInscriptions.shift()
  }
  if (dernieresInscriptions.length >= 20) return true
  dernieresParTelephone.set(telephone, maintenant)
  dernieresInscriptions.push(maintenant)
  return false
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)
  const pool = getPool()
  if (!pool) return pasDeBase()
  const corps = lireCorps(event)

  try {
    if (corps.action === 'attribuer' || corps.action === 'refuser') {
      if (!jetonValide(event)) return nonAutorise()
      const id = Number(corps.id)
      if (!id) return erreur('Inscription introuvable.', 400)
      if (corps.action === 'attribuer') {
        const ligne = await pool.query(
          'SELECT id, don_id, statut FROM inscriptions_tickets WHERE id = $1',
          [id]
        )
        if (ligne.rows.length === 0) return erreur('Inscription introuvable.', 404)
        if (ligne.rows[0].statut !== 'inscrit') {
          return erreur('Cette demande a déjà été traitée.', 400)
        }
        const don = await pool.query(
          'SELECT nombre_tickets FROM dons_tickets WHERE id = $1',
          [ligne.rows[0].don_id]
        )
        if (don.rows.length === 0) return erreur('Campagne introuvable.', 404)
        const attribues = await pool.query(
          "SELECT COUNT(*)::int AS n FROM inscriptions_tickets WHERE don_id = $1 AND statut = 'attribue'",
          [ligne.rows[0].don_id]
        )
        if (attribues.rows[0].n >= Number(don.rows[0].nombre_tickets)) {
          return erreur('Il n’y a plus de tickets pour cette campagne.', 400)
        }
        const maj = await pool.query(
          `UPDATE inscriptions_tickets SET statut = 'attribue' WHERE id = $1
           RETURNING id, don_id, prenom, nom, telephone, statut`,
          [id]
        )
        return reponse(200, { inscription: maj.rows[0] })
      }
      const maj = await pool.query(
        `UPDATE inscriptions_tickets SET statut = 'refuse' WHERE id = $1 AND statut = 'inscrit'
         RETURNING id, don_id, prenom, nom, telephone, statut`,
        [id]
      )
      if (maj.rows.length === 0) return erreur('Inscription introuvable ou déjà traitée.', 404)
      return reponse(200, { inscription: maj.rows[0] })
    }

    // Inscription publique à une campagne de dons.
    // Champ piège anti-spam (honeypot) : le formulaire public
    // contient un champ invisible pour une vraie personne.
    // Si un robot le remplit, on refuse l'inscription.
    if (nettoyerTexte(corps.site_web)) {
      return erreur('Une erreur est survenue.', 400)
    }
    const don_id = Number(corps.don_id)
    const prenom = nettoyerTexte(corps.prenom)
    const nom = nettoyerTexte(corps.nom)
    const telephone = nettoyerTexte(corps.telephone)
    if (!don_id || !prenom || !nom || !telephone) {
      return erreur('Prénom, nom et numéro de téléphone sont obligatoires.', 400)
    }
    if (telephone.replace(/\D/g, '').length < 9) {
      return erreur('Le numéro de téléphone semble incomplet.', 400)
    }
    if (tropRapide(telephone)) {
      return erreur('Trop de tentatives rapprochées. Attends une minute avant de réessayer.', 429)
    }
    const don = await pool.query(
      'SELECT id, nombre_tickets, statut FROM dons_tickets WHERE id = $1',
      [don_id]
    )
    if (don.rows.length === 0) return erreur('Campagne introuvable.', 404)
    if (don.rows[0].statut !== 'ouvert') {
      return erreur('Cette campagne de dons est fermée.', 400)
    }
    const attribues = await pool.query(
      "SELECT COUNT(*)::int AS n FROM inscriptions_tickets WHERE don_id = $1 AND statut = 'attribue'",
      [don_id]
    )
    if (attribues.rows[0].n >= Number(don.rows[0].nombre_tickets)) {
      return erreur('Il n’y a plus de tickets pour cette campagne.', 400)
    }
    // Statut boursier : rempli TOUT SEUL par le site. On cherche le numéro
    // de téléphone dans la table des membres et on copie son statut
    // (vrai, faux, ou NULL si la personne n'est pas membre ou si son
    // statut n'est pas renseigné). On ne demande JAMAIS « Es-tu
    // boursier ? » dans ce formulaire : la question est dans le formulaire
    // principal d'inscription à l'amicale.
    const membre = await pool.query(
      "SELECT boursier FROM membres WHERE REPLACE(telephone, ' ', '') = REPLACE($1, ' ', '') LIMIT 1",
      [telephone]
    )
    const boursier = membre.rows.length > 0 ? membre.rows[0].boursier : null
    const existante = await pool.query(
      `SELECT id, statut FROM inscriptions_tickets
       WHERE don_id = $1 AND telephone = $2 AND statut <> 'refuse'`,
      [don_id, telephone]
    )
    if (existante.rows.length > 0) {
      return erreur('Ce numéro est déjà inscrit pour cette campagne de dons.', 400)
    }
    const ancienne = await pool.query(
      `SELECT id FROM inscriptions_tickets
       WHERE don_id = $1 AND telephone = $2 AND statut = 'refuse'`,
      [don_id, telephone]
    )
    if (ancienne.rows.length > 0) {
      const maj = await pool.query(
        `UPDATE inscriptions_tickets SET prenom = $1, nom = $2, boursier = $4, statut = 'inscrit'
         WHERE id = $3 RETURNING id, don_id, prenom, nom, telephone, boursier, statut`,
        [prenom, nom, ancienne.rows[0].id, boursier]
      )
      return reponse(200, { inscription: maj.rows[0] })
    }
    const ins = await pool.query(
      `INSERT INTO inscriptions_tickets (don_id, prenom, nom, telephone, boursier, statut)
       VALUES ($1, $2, $3, $4, $5, 'inscrit') RETURNING id, don_id, prenom, nom, telephone, boursier, statut`,
      [don_id, prenom, nom, telephone, boursier]
    )
    return reponse(201, { inscription: ins.rows[0] })
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
