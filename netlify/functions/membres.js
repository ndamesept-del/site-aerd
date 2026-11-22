// Membres (bureau seulement).
//
// GET  /.netlify/functions/membres?q=...  -> recherche par premières lettres du nom
// POST /.netlify/functions/membres
//   { prenom, nom, telephone, telephone_parent?, ufr_departement, niveau, origine, boursier? }
//   boursier : true, false, ou null (non renseigné). Le bureau le définit
//   pour chaque membre. La question est dans le formulaire principal
//   d'inscription à l'amicale (Google Forms).
// PUT  /.netlify/functions/membres
//   Modifier un membre : { id, prenom, nom, telephone, telephone_parent?, ufr_departement, niveau, origine, boursier? }
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
          `SELECT id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, exemple
           FROM membres
           WHERE (prenom || ' ' || nom) ILIKE $1 OR (nom || ' ' || prenom) ILIKE $1
              OR REPLACE(telephone, ' ', '') ILIKE $2
           ORDER BY nom ASC, prenom ASC
           LIMIT 200`,
          ['%' + q + '%', '%' + q.replace(/\s/g, '') + '%']
        )
        return reponse(200, { membres: res.rows })
      }
      const res = await pool.query(
        `SELECT id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, exemple
         FROM membres ORDER BY nom ASC, prenom ASC LIMIT 500`
      )
      return reponse(200, { membres: res.rows })
    }

    // Statut boursier : vrai, faux, ou null (non renseigné).
    const corps = lireCorps(event)
    const boursier =
      corps.boursier === true || corps.boursier === 'true'
        ? true
        : corps.boursier === false || corps.boursier === 'false'
          ? false
          : null

    if (event.httpMethod === 'PUT') {
      const id = Number(corps.id)
      const membre = {
        prenom: nettoyerTexte(corps.prenom),
        nom: nettoyerTexte(corps.nom),
        telephone: nettoyerTexte(corps.telephone),
        telephone_parent: nettoyerTexte(corps.telephone_parent),
        ufr_departement: nettoyerTexte(corps.ufr_departement),
        niveau: nettoyerTexte(corps.niveau),
        origine: nettoyerTexte(corps.origine)
      }
      if (!id || !membre.prenom || !membre.nom || !membre.telephone || !membre.ufr_departement || !membre.niveau || !membre.origine) {
        return erreur('Prénom, nom, téléphone, filière, niveau et origine sont obligatoires.', 400)
      }
      if (!['L1', 'L2', 'L3', 'M1', 'M2'].includes(membre.niveau)) {
        return erreur('Niveau invalide.', 400)
      }
      if (!['Diourbel', 'Bambey'].includes(membre.origine)) {
        return erreur('Origine invalide.', 400)
      }
      const res = await pool.query(
        `UPDATE membres SET prenom = $2, nom = $3, telephone = $4, telephone_parent = $5,
           ufr_departement = $6, niveau = $7, origine = $8, boursier = $9
         WHERE id = $1
         RETURNING id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier`,
        [
          id,
          membre.prenom,
          membre.nom,
          membre.telephone,
          membre.telephone_parent || null,
          membre.ufr_departement,
          membre.niveau,
          membre.origine,
          boursier
        ]
      )
      if (res.rows.length === 0) return erreur('Membre introuvable.', 404)
      return reponse(200, { membre: res.rows[0] })
    }

    if (event.httpMethod === 'POST') {
      const membre = {
        prenom: nettoyerTexte(corps.prenom),
        nom: nettoyerTexte(corps.nom),
        telephone: nettoyerTexte(corps.telephone),
        telephone_parent: nettoyerTexte(corps.telephone_parent),
        ufr_departement: nettoyerTexte(corps.ufr_departement),
        niveau: nettoyerTexte(corps.niveau),
        origine: nettoyerTexte(corps.origine)
      }
      if (!membre.prenom || !membre.nom || !membre.telephone || !membre.ufr_departement || !membre.niveau || !membre.origine) {
        return erreur('Prénom, nom, téléphone, filière, niveau et origine sont obligatoires.', 400)
      }
      if (!['L1', 'L2', 'L3', 'M1', 'M2'].includes(membre.niveau)) {
        return erreur('Niveau invalide.', 400)
      }
      if (!['Diourbel', 'Bambey'].includes(membre.origine)) {
        return erreur('Origine invalide.', 400)
      }
      const ins = await pool.query(
        `INSERT INTO membres (prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier`,
        [
          membre.prenom,
          membre.nom,
          membre.telephone,
          membre.telephone_parent || null,
          membre.ufr_departement,
          membre.niveau,
          membre.origine,
          boursier
        ]
      )
      return reponse(201, { membre: ins.rows[0] })
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
