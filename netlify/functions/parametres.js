// Petits réglages du site, stockés dans la table `parametres`.
//
// GET  /.netlify/functions/parametres
//   Public, sans jeton : seulement le numéro Wave / Orange Money du
//   trésorier, pour payer les cotisations (clé « numero_wave_tresorier »).
// POST /.netlify/functions/parametres  (bureau)
//   Définir le numéro du trésorier : { numero_wave_tresorier }
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

const CLE_TRESORIER = 'numero_wave_tresorier'

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()

  try {
    if (event.httpMethod === 'GET') {
      const res = await pool.query('SELECT valeur FROM parametres WHERE cle = $1', [CLE_TRESORIER])
      return reponse(200, { numero_wave_tresorier: res.rows.length > 0 ? res.rows[0].valeur : '' })
    }

    if (!jetonValide(event)) return nonAutorise()
    if (event.httpMethod === 'POST') {
      const corps = lireCorps(event)
      const numero = nettoyerTexte(corps.numero_wave_tresorier)
      if (numero && numero.replace(/\D/g, '').length < 9) {
        return erreur('Le numéro de téléphone semble incomplet.', 400)
      }
      await pool.query(
        `INSERT INTO parametres (cle, valeur) VALUES ($1, $2)
         ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur`,
        [CLE_TRESORIER, numero]
      )
      return reponse(200, { numero_wave_tresorier: numero })
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
