// Inscriptions aux caravanes.
//
// POST /.netlify/functions/inscriptions
//   Public, sans jeton :
//     { action: 'inscrire', caravane_id, prenom, nom, telephone }
//     { action: 'desister', caravane_id, telephone }
//   Bureau, avec jeton :
//     { action: 'marquer-paye', inscription_id }
//     { action: 'retirer', inscription_id }
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)
  const pool = getPool()
  if (!pool) return pasDeBase()
  const corps = lireCorps(event)

  try {
    if (corps.action === 'inscrire') {
      const caravane_id = Number(corps.caravane_id)
      const prenom = nettoyerTexte(corps.prenom)
      const nom = nettoyerTexte(corps.nom)
      const telephone = nettoyerTexte(corps.telephone)
      if (!caravane_id || !prenom || !nom || !telephone) {
        return erreur('Prénom, nom et numéro de téléphone sont obligatoires.', 400)
      }
      if (telephone.replace(/\D/g, '').length < 9) {
        return erreur('Le numéro de téléphone semble incomplet.', 400)
      }
      const car = await pool.query('SELECT id FROM caravanes WHERE id = $1', [caravane_id])
      if (car.rows.length === 0) return erreur('Caravane introuvable.', 404)
      const existante = await pool.query(
        `SELECT id, statut FROM inscriptions
         WHERE caravane_id = $1 AND telephone = $2 AND statut <> 'désisté'`,
        [caravane_id, telephone]
      )
      if (existante.rows.length > 0) {
        return erreur('Ce numéro est déjà inscrit à cette caravane.', 400)
      }
      const ancienne = await pool.query(
        `SELECT id FROM inscriptions
         WHERE caravane_id = $1 AND telephone = $2 AND statut = 'désisté'`,
        [caravane_id, telephone]
      )
      if (ancienne.rows.length > 0) {
        const maj = await pool.query(
          `UPDATE inscriptions SET prenom = $1, nom = $2, statut = 'inscrit'
           WHERE id = $3 RETURNING id, prenom, nom, telephone, statut`,
          [prenom, nom, ancienne.rows[0].id]
        )
        return reponse(200, { inscription: maj.rows[0] })
      }
      const ins = await pool.query(
        `INSERT INTO inscriptions (caravane_id, prenom, nom, telephone, statut)
         VALUES ($1, $2, $3, $4, 'inscrit') RETURNING id, prenom, nom, telephone, statut`,
        [caravane_id, prenom, nom, telephone]
      )
      return reponse(201, { inscription: ins.rows[0] })
    }

    if (corps.action === 'desister') {
      const caravane_id = Number(corps.caravane_id)
      const telephone = nettoyerTexte(corps.telephone)
      if (!caravane_id || !telephone) return erreur('Numéro de téléphone obligatoire.', 400)
      // Règle des désistements : fermés quand il reste moins de 24 heures
      // avant le départ, pour ne pas porter préjudice à la caravane.
      const car = await pool.query('SELECT date_depart, heure_depart FROM caravanes WHERE id = $1', [caravane_id])
      if (car.rows.length === 0) return erreur('Caravane introuvable.', 404)
      const ligne = car.rows[0]
      const dateStr = ligne.date_depart instanceof Date
        ? ligne.date_depart.toISOString().slice(0, 10)
        : String(ligne.date_depart).slice(0, 10)
      const heureStr = String(ligne.heure_depart || '08:00').slice(0, 5)
      const depart = new Date(dateStr + 'T' + heureStr + ':00Z')
      if (depart.getTime() - Date.now() < 24 * 3600 * 1000) {
        return erreur('Les désistements sont fermés : la caravane part dans moins de 24 heures. Contacte le bureau.', 400)
      }
      const maj = await pool.query(
        `UPDATE inscriptions SET statut = 'désisté'
         WHERE caravane_id = $1 AND telephone = $2 AND statut <> 'désisté'
         RETURNING id`,
        [caravane_id, telephone]
      )
      if (maj.rows.length === 0) {
        return erreur('Aucune inscription trouvée avec ce numéro pour cette caravane.', 404)
      }
      return reponse(200, { ok: true })
    }

    if (corps.action === 'marquer-paye' || corps.action === 'retirer') {
      if (!jetonValide(event)) return nonAutorise()
      const inscription_id = Number(corps.inscription_id)
      if (!inscription_id) return erreur('Inscription introuvable.', 400)
      const statut = corps.action === 'marquer-paye' ? 'payé' : 'désisté'
      const maj = await pool.query(
        `UPDATE inscriptions SET statut = $1 WHERE id = $2
         RETURNING id, prenom, nom, telephone, statut`,
        [statut, inscription_id]
      )
      if (maj.rows.length === 0) return erreur('Inscription introuvable.', 404)
      return reponse(200, { inscription: maj.rows[0] })
    }

    return erreur('Action inconnue.', 400)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
