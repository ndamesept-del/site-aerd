// Chauffeurs (bureau seulement).
//
// GET  /.netlify/functions/chauffeurs?q=...  -> recherche par nom ou numéro
// POST /.netlify/functions/chauffeurs  { prenom, nom, telephone }
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

export async function handler(event) {
  if (!jetonValide(event)) return nonAutorise()
  const pool = getPool()
  if (!pool) return pasDeBase()

  try {
    if (event.httpMethod === 'GET') {
      const q = nettoyerTexte(event.queryStringParameters?.q)
      if (q) {
        const res = await pool.query(
          `SELECT id, prenom, nom, telephone, exemple
           FROM chauffeurs
           WHERE (prenom || ' ' || nom) ILIKE $1 OR (nom || ' ' || prenom) ILIKE $1
              OR REPLACE(telephone, ' ', '') ILIKE $2
           ORDER BY nom ASC, prenom ASC
           LIMIT 200`,
          ['%' + q + '%', '%' + q.replace(/\s/g, '') + '%']
        )
        return reponse(200, { chauffeurs: res.rows })
      }
      const res = await pool.query(
        'SELECT id, prenom, nom, telephone, exemple FROM chauffeurs ORDER BY nom ASC, prenom ASC LIMIT 500'
      )
      return reponse(200, { chauffeurs: res.rows })
    }

    if (event.httpMethod === 'POST') {
      const corps = lireCorps(event)
      const prenom = nettoyerTexte(corps.prenom)
      const nom = nettoyerTexte(corps.nom)
      const telephone = nettoyerTexte(corps.telephone)
      if (!prenom || !nom || !telephone) {
        return erreur('Prénom, nom et numéro sont obligatoires.', 400)
      }
      const ins = await pool.query(
        'INSERT INTO chauffeurs (prenom, nom, telephone) VALUES ($1, $2, $3) RETURNING id, prenom, nom, telephone',
        [prenom, nom, telephone]
      )
      return reponse(201, { chauffeur: ins.rows[0] })
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
