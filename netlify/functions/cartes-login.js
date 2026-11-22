// POST /.netlify/functions/cartes-login  { password } -> { token }
//
// Connexion à l'onglet « Cartes de membres » de l'espace bureau. Le mot
// de passe vient UNIQUEMENT de la variable d'environnement
// CARTES_PASSWORD (définie dans Netlify, jamais dans le code). Seul le
// trésorier le connaît : sans lui, on ne peut ni voir la liste des
// cartes, ni valider un paiement de carte. Il ne donne accès qu'à
// cette partie, pas au reste de l'espace bureau.
import { motDePasseCartes, creerJetonCartes } from './auth.js'
import { reponse, erreur, lireCorps } from './db.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)
  const { password } = lireCorps(event)
  if (!password || password !== motDePasseCartes()) {
    return erreur('Mot de passe incorrect.', 401)
  }
  return reponse(200, { token: creerJetonCartes() })
}
