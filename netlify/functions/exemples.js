// Données d'exemple, pour tester le site seulement (bureau).
//
// POST /.netlify/functions/exemples  { action: 'charger' | 'supprimer' }
//   'charger'   : ajoute 3 membres, 1 chauffeur, 1 caravane et 3 inscriptions,
//                 tous marqués exemple = true. Noms et numéros fictifs.
//   'supprimer' : supprime toutes les lignes marquées exemple = true.
//
// Ne jamais mettre de vraies données personnelles ici.
import { getPool, reponse, erreur, pasDeBase, lireCorps } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)
  if (!jetonValide(event)) return nonAutorise()
  const pool = getPool()
  if (!pool) return pasDeBase()
  const corps = lireCorps(event)

  try {
    if (corps.action === 'supprimer') {
      await pool.query("DELETE FROM inscriptions WHERE exemple = TRUE")
      await pool.query("DELETE FROM caravanes WHERE exemple = TRUE")
      await pool.query("DELETE FROM chauffeurs WHERE exemple = TRUE")
      await pool.query("DELETE FROM membres WHERE exemple = TRUE")
      return reponse(200, { ok: true })
    }

    if (corps.action === 'charger') {
      const ch = await pool.query(
        "INSERT INTO chauffeurs (prenom, nom, telephone, exemple) VALUES ('Mamadou', 'Exemple', '70 000 00 09', TRUE) RETURNING id"
      )
      const chauffeur_id = ch.rows[0].id
      const date7 = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
      const ca = await pool.query(
        `INSERT INTO caravanes (date_depart, heure_depart, destination, chauffeur_id, numero_wave_responsable, exemple)
         VALUES ($1, '08:00', 'Diourbel', $2, '70 000 00 00', TRUE) RETURNING id`,
        [date7, chauffeur_id]
      )
      const caravane_id = ca.rows[0].id
      const exemples = [
        { prenom: 'Aminata', nom: 'Exemple', telephone: '70 000 00 01', statut: 'payé' },
        { prenom: 'Moussa', nom: 'Exemple', telephone: '70 000 00 02', statut: 'inscrit' },
        { prenom: 'Fatou', nom: 'Exemple', telephone: '70 000 00 03', statut: 'inscrit' }
      ]
      for (const e of exemples) {
        await pool.query(
          `INSERT INTO membres (prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, exemple)
           VALUES ($1, $2, $3, '70 000 00 04', 'UFR SEG', 'L2', 'Diourbel', TRUE)`,
          [e.prenom, e.nom, e.telephone]
        )
        await pool.query(
          `INSERT INTO inscriptions (caravane_id, prenom, nom, telephone, statut, exemple)
           VALUES ($1, $2, $3, $4, $5, TRUE)`,
          [caravane_id, e.prenom, e.nom, e.telephone, e.statut]
        )
      }
      return reponse(200, { ok: true })
    }

    return erreur('Action inconnue.', 400)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
