// Tableau de bord du bureau : compteurs.
//
// GET /.netlify/functions/stats  (bureau)
//   { membres, chauffeurs, caravanes, paiements_en_attente }
import { getPool, reponse, erreur, pasDeBase } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return erreur('Méthode non autorisée.', 405)
  if (!jetonValide(event)) return nonAutorise()
  const pool = getPool()
  if (!pool) return pasDeBase()
  try {
    const [m, c, ca, p] = await Promise.all([
      pool.query('SELECT COUNT(*) AS n FROM membres'),
      pool.query('SELECT COUNT(*) AS n FROM chauffeurs'),
      pool.query('SELECT COUNT(*) AS n FROM caravanes'),
      pool.query("SELECT COUNT(*) AS n FROM inscriptions WHERE statut = 'inscrit'")
    ])
    return reponse(200, {
      membres: Number(m.rows[0].n),
      chauffeurs: Number(c.rows[0].n),
      caravanes: Number(ca.rows[0].n),
      paiements_en_attente: Number(p.rows[0].n)
    })
  } catch (e) {
    console.error(e)
    return erreur('Impossible de charger le tableau de bord.')
  }
}
