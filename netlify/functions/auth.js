// Authentification de l'espace bureau.
//
// Le mot de passe vient UNIQUEMENT de la variable d'environnement
// BUREAU_PASSWORD (définie dans Netlify, jamais dans le code).
// La valeur par défaut ci-dessous sert seulement au développement local.
// À CHANGER avant la mise en ligne : définis BUREAU_PASSWORD dans Netlify.
import crypto from 'node:crypto'

// Mot de passe par défaut, développement local seulement. À CHANGER.
export const MOT_DE_PASSE_DEFAUT = 'change-moi'

export function motDePasseBureau() {
  return process.env.BUREAU_PASSWORD || MOT_DE_PASSE_DEFAUT
}

// Jeton de session : signature du mot de passe, sans état côté serveur.
// Le jeton est gardé dans le navigateur (localStorage).
export function creerJeton() {
  return crypto.createHmac('sha256', motDePasseBureau()).update('bureau-aerd').digest('hex')
}

export function jetonValide(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const jeton = auth.replace(/^Bearer\s+/i, '').trim()
  if (!jeton) return false
  const attendu = creerJeton()
  const a = Buffer.from(jeton)
  const b = Buffer.from(attendu)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function nonAutorise() {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Accès refusé. Connecte-toi à l’espace bureau.' })
  }
}
