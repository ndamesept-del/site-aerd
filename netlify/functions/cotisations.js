// Cotisations mensuelles du volet social (500 FCFA par mois et par membre).
//
// GET  /.netlify/functions/cotisations?mois=AAAA-MM  (bureau)
//   Liste de tous les membres avec leur statut pour le mois demandé,
//   plus les compteurs : combien ont payé, total collecté en FCFA.
// POST /.netlify/functions/cotisations  (bureau)
//   Marquer payé ou remettre en attente :
//     { membre_id, mois, statut }  (statut : 'paye' ou 'en_attente')
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

function moisValide(mois) {
  return /^\d{4}-\d{2}$/.test(String(mois || ''))
}

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()

  // Toutes les cotisations sont réservées au bureau.
  if (!jetonValide(event)) return nonAutorise()

  try {
    if (event.httpMethod === 'GET') {
      const mois = nettoyerTexte(event.queryStringParameters?.mois)
      if (!moisValide(mois)) return erreur('Mois invalide. Utilise le format AAAA-MM, ex : 2026-11.', 400)
      const membres = await pool.query(
        `SELECT m.id, m.prenom, m.nom, m.telephone,
                COALESCE(c.statut, 'en_attente') AS statut,
                COALESCE(c.montant_fcfa, 500) AS montant_fcfa
         FROM membres m
         LEFT JOIN cotisations c ON c.membre_id = m.id AND c.mois = $1
         ORDER BY m.nom ASC, m.prenom ASC`,
        [mois]
      )
      const payes = membres.rows.filter((m) => m.statut === 'paye')
      const totalCollecte = payes.reduce((s, m) => s + Number(m.montant_fcfa || 0), 0)
      return reponse(200, {
        mois,
        membres: membres.rows,
        total_membres: membres.rows.length,
        payes: payes.length,
        total_collecte: totalCollecte
      })
    }

    if (event.httpMethod === 'POST') {
      const corps = lireCorps(event)
      const membre_id = Number(corps.membre_id)
      const mois = nettoyerTexte(corps.mois)
      const statut = nettoyerTexte(corps.statut)
      if (!membre_id || !moisValide(mois)) {
        return erreur('Membre et mois (AAAA-MM) sont obligatoires.', 400)
      }
      if (statut !== 'paye' && statut !== 'en_attente') {
        return erreur('Statut invalide.', 400)
      }
      const membre = await pool.query('SELECT id FROM membres WHERE id = $1', [membre_id])
      if (membre.rows.length === 0) return erreur('Membre introuvable.', 404)
      const res = await pool.query(
        `INSERT INTO cotisations (membre_id, mois, montant_fcfa, statut)
         VALUES ($1, $2, 500, $3)
         ON CONFLICT (membre_id, mois)
         DO UPDATE SET statut = EXCLUDED.statut
         RETURNING membre_id, mois, montant_fcfa, statut`,
        [membre_id, mois, statut]
      )
      return reponse(200, { cotisation: res.rows[0] })
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
