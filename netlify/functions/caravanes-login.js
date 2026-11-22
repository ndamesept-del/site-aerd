// POST /.netlify/functions/caravanes-login  { password } -> { token }
//
// Connexion à l'onglet Caravanes de l'espace bureau. Le mot de passe
// vient UNIQUEMENT de la variable d'environnement CARAVANES_PASSWORD
// (définie dans Netlify, jamais dans le code). Seul l'administrateur
// le connaît : sans lui, personne ne peut ouvrir l'onglet Caravanes,
// ni créer une caravane, ni valider un paiement.
import { motDePasseCaravanes, creerJetonCaravanes } from './auth.js'
import { reponse, erreur, lireCorps } from './db.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)
  const { password } = lireCorps(event)
  if (!password || password !== motDePasseCaravanes()) {
    return erreur('Mot de passe incorrect.', 401)
  }
  return reponse(200, { token: creerJetonCaravanes() })
}
