// POST /.netlify/functions/budget-login  { password } -> { token }
//
// Connexion à l'onglet « Budget » de l'espace bureau. Le mot de passe
// vient UNIQUEMENT de la variable d'environnement BUDGET_PASSWORD
// (définie dans Netlify, jamais dans le code). Seuls le président et le
// trésorier le connaissent : sans lui, on ne peut ni voir le budget, ni
// ajouter une dépense. Il ne donne accès qu'à cette partie, pas au
// reste de l'espace bureau.
import { motDePasseBudget, creerJetonBudget } from './auth.js'
import { reponse, erreur, lireCorps } from './db.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)
  const { password } = lireCorps(event)
  if (!password || password !== motDePasseBudget()) {
    return erreur('Mot de passe incorrect.', 401)
  }
  return reponse(200, { token: creerJetonBudget() })
}
