// POST /.netlify/functions/login  { password } -> { token }
import { motDePasseBureau, creerJeton } from './auth.js'
import { reponse, erreur, lireCorps } from './db.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)
  const { password } = lireCorps(event)
  if (!password || password !== motDePasseBureau()) {
    return erreur('Mot de passe incorrect.', 401)
  }
  return reponse(200, { token: creerJeton() })
}
