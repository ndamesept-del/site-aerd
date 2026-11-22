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
// POST /.netlify/functions/membres  { action: 'carte-payee', id, payee }
//   Marquer la carte de membre payée (ou remettre en attente). Quand la
//   carte est marquée payée et que le membre n'a pas encore de numéro, un
//   numéro lui est attribué (AERD-2026-001, ...).
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

// Prochain numéro de carte de membre : AERD-2026-001, AERD-2026-002, ...
// L'année est celle en cours, le numéro est séquentiel dans l'année.
async function prochainNumeroCarte(pool) {
  const annee = new Date().getFullYear()
  const prefixe = 'AERD-' + annee + '-'
  const res = await pool.query(
    'SELECT numero_carte FROM membres WHERE numero_carte LIKE $1 ORDER BY numero_carte DESC LIMIT 1',
    [prefixe + '%']
  )
  let n = 0
  if (res.rows.length > 0) {
    const m = /^AERD-\d{4}-(\d+)$/.exec(res.rows[0].numero_carte || '')
    if (m) n = parseInt(m[1], 10)
  }
  return prefixe + String(n + 1).padStart(3, '0')
}

export async function handler(event) {
  if (!jetonValide(event)) return nonAutorise()
  const pool = getPool()
  if (!pool) return pasDeBase()

  try {
    if (event.httpMethod === 'GET') {
      const q = nettoyerTexte(event.queryStringParameters?.q)
      if (q) {
        const res = await pool.query(
          `SELECT id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, numero_carte, carte_payee, carte_paiement_declare, exemple
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
        `SELECT id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, numero_carte, carte_payee, carte_paiement_declare, exemple
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
         RETURNING id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, numero_carte, carte_payee, carte_paiement_declare`,
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
      // Marquer la carte de membre payée (ou remettre en attente).
      if (corps.action === 'carte-payee') {
        const id = Number(corps.id)
        const payee = corps.payee === true || corps.payee === 'true'
        if (!id) return erreur('Membre introuvable.', 400)
        const actuel = await pool.query('SELECT numero_carte FROM membres WHERE id = $1', [id])
        if (actuel.rows.length === 0) return erreur('Membre introuvable.', 404)
        let numero = actuel.rows[0].numero_carte
        if (payee && !numero) numero = await prochainNumeroCarte(pool)
        const res = await pool.query(
          `UPDATE membres SET carte_payee = $2, numero_carte = $3, carte_paiement_declare = FALSE WHERE id = $1
           RETURNING id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, numero_carte, carte_payee, carte_paiement_declare`,
          [id, payee, numero]
        )
        return reponse(200, { membre: res.rows[0] })
      }
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
      const numero_carte = await prochainNumeroCarte(pool)
      const ins = await pool.query(
        `INSERT INTO membres (prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, numero_carte, carte_payee, carte_paiement_declare)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, FALSE)
         RETURNING id, prenom, nom, telephone, telephone_parent, ufr_departement, niveau, origine, boursier, numero_carte, carte_payee, carte_paiement_declare`,
        [
          membre.prenom,
          membre.nom,
          membre.telephone,
          membre.telephone_parent || null,
          membre.ufr_departement,
          membre.niveau,
          membre.origine,
          boursier,
          numero_carte
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
