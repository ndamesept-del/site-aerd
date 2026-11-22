// Cartes de membres, pour le trésorier (jeton cartes).
//
// GET  /.netlify/functions/cartes?q=...
//   La liste des membres pour valider les cartes : prénom, nom, numéro
//   de téléphone, filière, niveau, origine, numéro de carte, carte
//   payée, paiement déclaré. Rien d'autre : ni le numéro du parent, ni
//   le statut boursier. Le trésorier n'a accès qu'à cette partie.
// POST /.netlify/functions/cartes
//   { action: 'carte-payee', id, payee } : valider ou retirer le
//   paiement de la carte. Le numéro de carte est attribué tout seul
//   (AERD-2026-001, ...) à la validation, s'il n'y en avait pas.
//   La validation consomme la déclaration de paiement.
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonCartesValide, nonAutoriseCartes } from './auth.js'

// Prochain numéro de carte : AERD-2026-001, AERD-2026-002, ...
async function prochainNumeroCarte(pool) {
  const annee = new Date().getFullYear()
  const res = await pool.query(
    `SELECT numero_carte FROM membres WHERE numero_carte LIKE $1 ORDER BY numero_carte DESC LIMIT 1`,
    ['AERD-' + annee + '-%']
  )
  let max = 0
  if (res.rows.length > 0) {
    const m = String(res.rows[0].numero_carte).match(/(\d+)$/)
    if (m) max = Number(m[1])
  }
  return 'AERD-' + annee + '-' + String(max + 1).padStart(3, '0')
}

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()
  if (!jetonCartesValide(event)) return nonAutoriseCartes()

  try {
    if (event.httpMethod === 'GET') {
      const q = nettoyerTexte(event.queryStringParameters?.q).toLowerCase()
      let liste
      if (q) {
        const res = await pool.query(
          `SELECT id, prenom, nom, telephone, ufr_departement, niveau, origine, numero_carte, carte_payee, carte_paiement_declare
           FROM membres
           WHERE LOWER(prenom || ' ' || nom) LIKE $1 OR LOWER(nom || ' ' || prenom) LIKE $1 OR REPLACE(telephone, ' ', '') LIKE $2
           ORDER BY nom ASC, prenom ASC`,
          ['%' + q + '%', '%' + q.replace(/\s/g, '') + '%']
        )
        liste = res.rows
      } else {
        const res = await pool.query(
          `SELECT id, prenom, nom, telephone, ufr_departement, niveau, origine, numero_carte, carte_payee, carte_paiement_declare
           FROM membres ORDER BY nom ASC, prenom ASC`
        )
        liste = res.rows
      }
      return reponse(200, {
        membres: liste.map((m) => ({
          id: m.id,
          prenom: m.prenom,
          nom: m.nom,
          telephone: m.telephone,
          ufr_departement: m.ufr_departement,
          niveau: m.niveau,
          origine: m.origine,
          numero_carte: m.numero_carte,
          carte_payee: !!m.carte_payee,
          carte_paiement_declare: !!m.carte_paiement_declare
        }))
      })
    }

    if (event.httpMethod === 'POST') {
      const corps = lireCorps(event)
      if (corps.action !== 'carte-payee') return erreur('Action inconnue.', 400)
      const id = Number(corps.id)
      const payee = corps.payee === true
      if (!id) return erreur('Membre introuvable.', 400)
      const actuel = await pool.query('SELECT numero_carte FROM membres WHERE id = $1', [id])
      if (actuel.rows.length === 0) return erreur('Membre introuvable.', 404)
      let numero = actuel.rows[0].numero_carte
      if (payee && !numero) numero = await prochainNumeroCarte(pool)
      const res = await pool.query(
        `UPDATE membres SET carte_payee = $2, numero_carte = $3, carte_paiement_declare = FALSE WHERE id = $1
         RETURNING id, prenom, nom, telephone, ufr_departement, niveau, origine, numero_carte, carte_payee, carte_paiement_declare`,
        [id, payee, numero]
      )
      const m = res.rows[0]
      return reponse(200, {
        membre: {
          id: m.id,
          prenom: m.prenom,
          nom: m.nom,
          telephone: m.telephone,
          ufr_departement: m.ufr_departement,
          niveau: m.niveau,
          origine: m.origine,
          numero_carte: m.numero_carte,
          carte_payee: !!m.carte_payee,
          carte_paiement_declare: !!m.carte_paiement_declare
        }
      })
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
