// Ma carte de membre (public, sans jeton).
//
// POST /.netlify/functions/ma-carte  { telephone }
//   Retrouve un membre par son numéro de téléphone et renvoie ce qu'il
//   faut pour sa carte : prénom, nom, numéro de carte (AERD-2026-001...)
//   et si la carte est payée. Rien d'autre ne sort (ni le numéro du
//   parent, ni le statut boursier) : le numéro de téléphone est la clé
//   que seul le membre connaît.
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)

  try {
    const corps = lireCorps(event)
    const telephone = nettoyerTexte(corps.telephone).replace(/\s/g, '')
    if (telephone.replace(/\D/g, '').length < 9) {
      return erreur('Le numéro de téléphone semble incomplet.', 400)
    }
    const res = await pool.query(
      `SELECT id, prenom, nom, numero_carte, carte_payee
       FROM membres WHERE REPLACE(telephone, ' ', '') = $1 LIMIT 1`,
      [telephone]
    )
    if (res.rows.length === 0) {
      return erreur(
        'Numéro introuvable. Vérifie ton numéro, ou inscris-toi d’abord à l’amicale : le bureau t’ajoute ensuite à la liste des membres.',
        404
      )
    }
    const m = res.rows[0]
    return reponse(200, {
      membre: {
        id: m.id,
        prenom: m.prenom,
        nom: m.nom,
        numero_carte: m.numero_carte,
        carte_payee: !!m.carte_payee
      }
    })
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
