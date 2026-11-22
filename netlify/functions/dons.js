// Dons de tickets (volet social) : campagnes de dons créées par le bureau.
//
// GET  /.netlify/functions/dons
//   Public, sans jeton : les campagnes ouvertes, avec le nombre de
//   tickets restants. Les inscrits ne sont JAMAIS renvoyés ici :
//   ce sont des gens dans le besoin, la liste reste au bureau.
//   Bureau, avec jeton (paramètre details=1) : toutes les campagnes
//   (ouvertes et fermées) avec leurs inscrits. La liste des inscrits
//   arrive DÉJÀ TRIÉE par le serveur : les non-boursiers d'abord, puis
//   les non renseignés (boursier NULL), puis les boursiers. Le bureau
//   n'a rien à trier à la main. Le statut boursier a été copié tout seul
//   au moment de l'inscription, depuis la table des membres.
// POST /.netlify/functions/dons  (bureau)
//   Créer une campagne : { titre, description?, nombre_tickets, lieu_retrait }
// PUT  /.netlify/functions/dons  (bureau)
//   Fermer ou rouvrir une campagne : { id, statut } ('ouvert' ou 'ferme')
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

function lignePublique(don, attribues) {
  const total = Number(don.nombre_tickets || 0)
  const restants = Math.max(0, total - Number(attribues || 0))
  return {
    id: don.id,
    titre: don.titre,
    description: don.description || '',
    nombre_tickets: total,
    tickets_restants: restants,
    lieu_retrait: don.lieu_retrait,
    statut: don.statut,
    exemple: !!don.exemple
  }
}

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()

  try {
    if (event.httpMethod === 'GET') {
      const bureau = jetonValide(event) && event.queryStringParameters?.details === '1'
      if (bureau) {
        const dons = await pool.query(
          'SELECT id, titre, description, nombre_tickets, lieu_retrait, statut, exemple FROM dons_tickets ORDER BY created_at DESC, id DESC'
        )
        const inscrits = await pool.query(
          `SELECT id, don_id, prenom, nom, telephone, boursier, statut
           FROM inscriptions_tickets
           ORDER BY
             CASE WHEN boursier = FALSE THEN 0 WHEN boursier IS NULL THEN 1 ELSE 2 END,
             created_at ASC, id ASC`
        )
        const liste = dons.rows.map((d) => {
          const sesInscrits = inscrits.rows.filter((i) => i.don_id === d.id)
          const attribues = sesInscrits.filter((i) => i.statut === 'attribue').length
          return { ...lignePublique(d, attribues), inscrits: sesInscrits }
        })
        return reponse(200, { dons: liste })
      }
      // Public : seulement les campagnes ouvertes, sans les inscrits.
      const dons = await pool.query(
        `SELECT id, titre, description, nombre_tickets, lieu_retrait, statut, exemple
         FROM dons_tickets WHERE statut = 'ouvert' ORDER BY created_at DESC, id DESC`
      )
      const attribues = await pool.query(
        `SELECT don_id, COUNT(*)::int AS n FROM inscriptions_tickets
         WHERE statut = 'attribue' GROUP BY don_id`
      )
      const parDon = {}
      for (const ligne of attribues.rows) parDon[ligne.don_id] = ligne.n
      return reponse(200, { dons: dons.rows.map((d) => lignePublique(d, parDon[d.id] || 0)) })
    }

    // Toutes les écritures sont réservées au bureau.
    if (!jetonValide(event)) return nonAutorise()
    const corps = lireCorps(event)

    if (event.httpMethod === 'POST') {
      const titre = nettoyerTexte(corps.titre)
      const description = nettoyerTexte(corps.description)
      const nombre_tickets = Math.trunc(Number(corps.nombre_tickets))
      const lieu_retrait = nettoyerTexte(corps.lieu_retrait)
      if (!titre || !lieu_retrait) {
        return erreur('Le titre et le lieu de retrait sont obligatoires.', 400)
      }
      if (!Number.isFinite(nombre_tickets) || nombre_tickets < 1) {
        return erreur('Le nombre de tickets doit être au moins 1.', 400)
      }
      const ins = await pool.query(
        `INSERT INTO dons_tickets (titre, description, nombre_tickets, lieu_retrait)
         VALUES ($1, $2, $3, $4)
         RETURNING id, titre, description, nombre_tickets, lieu_retrait, statut, exemple`,
        [titre, description || null, nombre_tickets, lieu_retrait]
      )
      return reponse(201, { don: lignePublique(ins.rows[0], 0) })
    }

    if (event.httpMethod === 'PUT') {
      const id = Number(corps.id)
      const statut = nettoyerTexte(corps.statut)
      if (!id) return erreur('Campagne introuvable.', 400)
      if (statut !== 'ouvert' && statut !== 'ferme') {
        return erreur('Statut invalide.', 400)
      }
      const res = await pool.query(
        `UPDATE dons_tickets SET statut = $2 WHERE id = $1
         RETURNING id, titre, description, nombre_tickets, lieu_retrait, statut, exemple`,
        [id, statut]
      )
      if (res.rows.length === 0) return erreur('Campagne introuvable.', 404)
      const attribues = await pool.query(
        "SELECT COUNT(*)::int AS n FROM inscriptions_tickets WHERE don_id = $1 AND statut = 'attribue'",
        [id]
      )
      return reponse(200, { don: lignePublique(res.rows[0], attribues.rows[0].n) })
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
