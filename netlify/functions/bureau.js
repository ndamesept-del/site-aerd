// Organigramme du bureau de l'amicale.
//
// GET  /.netlify/functions/bureau
//   Public : les membres actuels ({ bureau }) et les anciens membres
//   ({ anciens }), rangés par ordre puis par nom. Le président est
//   en premier (ordre 1). Les anciens n'ont ni photo ni ordre affiché :
//   seulement leur nom et leur poste.
// POST   /.netlify/functions/bureau  (bureau)
//   Ajouter un membre : { prenom, nom, poste, photo?, ordre? }
//   La photo est une data URI (image redimensionnée dans le navigateur,
//   400 px maximum) ou une chaîne vide.
//   Passer un membre aux anciens : { action: 'passer-ancien', id }
//   Le membre devient ancien et sa photo est supprimée (photo = NULL)
//   pour libérer de l'espace ; son nom et son poste sont gardés.
// PUT    /.netlify/functions/bureau  (bureau)
//   Modifier un membre : { id, prenom, nom, poste, photo?, ordre? }
// DELETE /.netlify/functions/bureau  (bureau)
//   Supprimer un membre : { id }
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

// Une photo fait environ 30 à 60 Ko en data URI (400 px, JPEG).
// On refuse tout ce qui dépasse 500 Ko de texte, pour protéger la base.
const PHOTO_MAX_CARACTERES = 500000

function lignePublique(ligne) {
  return {
    id: ligne.id,
    prenom: ligne.prenom,
    nom: ligne.nom,
    poste: ligne.poste,
    // Un ancien membre n'a plus de photo : on ne la renvoie jamais,
    // même si elle était encore en base.
    photo: ligne.ancien ? '' : ligne.photo || '',
    ordre: ligne.ordre,
    ancien: !!ligne.ancien,
    exemple: !!ligne.exemple
  }
}

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()

  try {
    if (event.httpMethod === 'GET') {
      const res = await pool.query(
        'SELECT id, prenom, nom, poste, photo, ordre, ancien, exemple FROM bureau ORDER BY ordre ASC, nom ASC, prenom ASC'
      )
      const tous = res.rows.map(lignePublique)
      return reponse(200, {
        bureau: tous.filter((m) => !m.ancien),
        anciens: tous.filter((m) => m.ancien)
      })
    }

    // Toutes les écritures sont réservées au bureau.
    if (!jetonValide(event)) return nonAutorise()
    const corps = lireCorps(event)

    if (event.httpMethod === 'POST') {
      // Passer un membre aux anciens : son nom et son poste sont gardés,
      // mais sa photo est supprimée pour libérer de l'espace dans la base.
      if (corps.action === 'passer-ancien') {
        const id = Number(corps.id)
        if (!id) return erreur('Membre du bureau introuvable.', 400)
        const res = await pool.query(
          `UPDATE bureau SET ancien = TRUE, photo = NULL WHERE id = $1
           RETURNING id, prenom, nom, poste, photo, ordre, ancien, exemple`,
          [id]
        )
        if (res.rows.length === 0) return erreur('Membre du bureau introuvable.', 404)
        return reponse(200, { membre: lignePublique(res.rows[0]) })
      }
      const prenom = nettoyerTexte(corps.prenom)
      const nom = nettoyerTexte(corps.nom)
      const poste = nettoyerTexte(corps.poste)
      const photo = String(corps.photo || '')
      const ordre = Number.isFinite(Number(corps.ordre)) ? Math.trunc(Number(corps.ordre)) : 0
      if (!prenom || !nom || !poste) {
        return erreur('Prénom, nom et poste sont obligatoires.', 400)
      }
      if (photo && !photo.startsWith('data:image/')) {
        return erreur('La photo doit être une image.', 400)
      }
      if (photo.length > PHOTO_MAX_CARACTERES) {
        return erreur('La photo est trop lourde. Choisis une photo plus petite.', 400)
      }
      const ins = await pool.query(
        'INSERT INTO bureau (prenom, nom, poste, photo, ordre) VALUES ($1, $2, $3, $4, $5) RETURNING id, prenom, nom, poste, photo, ordre, ancien, exemple',
        [prenom, nom, poste, photo || null, ordre]
      )
      return reponse(201, { membre: lignePublique(ins.rows[0]) })
    }

    if (event.httpMethod === 'PUT') {
      const id = Number(corps.id)
      const prenom = nettoyerTexte(corps.prenom)
      const nom = nettoyerTexte(corps.nom)
      const poste = nettoyerTexte(corps.poste)
      const photo = String(corps.photo || '')
      const ordre = Number.isFinite(Number(corps.ordre)) ? Math.trunc(Number(corps.ordre)) : 0
      if (!id || !prenom || !nom || !poste) {
        return erreur('Prénom, nom et poste sont obligatoires.', 400)
      }
      if (photo && !photo.startsWith('data:image/')) {
        return erreur('La photo doit être une image.', 400)
      }
      if (photo.length > PHOTO_MAX_CARACTERES) {
        return erreur('La photo est trop lourde. Choisis une photo plus petite.', 400)
      }
      const res = await pool.query(
        `UPDATE bureau SET prenom = $2, nom = $3, poste = $4, photo = $5, ordre = $6
         WHERE id = $1 RETURNING id, prenom, nom, poste, photo, ordre, ancien, exemple`,
        [id, prenom, nom, poste, photo || null, ordre]
      )
      if (res.rows.length === 0) return erreur('Membre du bureau introuvable.', 404)
      return reponse(200, { membre: lignePublique(res.rows[0]) })
    }

    if (event.httpMethod === 'DELETE') {
      const id = Number(corps.id)
      if (!id) return erreur('Membre du bureau introuvable.', 400)
      await pool.query('DELETE FROM bureau WHERE id = $1', [id])
      return reponse(200, { ok: true })
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
