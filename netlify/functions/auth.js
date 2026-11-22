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

// Mot de passe des caravanes, séparé du mot de passe du bureau.
// Seul l'administrateur le connaît. Il vient UNIQUEMENT de la variable
// d'environnement CARAVANES_PASSWORD (définie dans Netlify).
// Valeur par défaut : développement local seulement. À CHANGER.
export const MOT_DE_PASSE_CARAVANES_DEFAUT = 'change-moi-caravanes'

export function motDePasseCaravanes() {
  return process.env.CARAVANES_PASSWORD || MOT_DE_PASSE_CARAVANES_DEFAUT
}

// Jeton caravanes : signature du mot de passe des caravanes.
// Il voyage dans l'en-tête X-Jeton-Caravanes (l'en-tête Authorization
// est déjà prise par le jeton du bureau).
export function creerJetonCaravanes() {
  return crypto.createHmac('sha256', motDePasseCaravanes()).update('caravanes-aerd').digest('hex')
}

export function jetonCaravanesValide(event) {
  const jeton = (event.headers?.['x-jeton-caravanes'] || event.headers?.['X-Jeton-Caravanes'] || '').trim()
  if (!jeton) return false
  const attendu = creerJetonCaravanes()
  const a = Buffer.from(jeton)
  const b = Buffer.from(attendu)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function nonAutoriseCaravanes() {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Accès refusé. Entre le mot de passe des caravanes.' })
  }
}

// Mot de passe des cartes de membres, séparé du mot de passe du bureau.
// Seul le trésorier le connaît : il donne accès seulement à l'onglet
// « Cartes de membres », pas au reste de l'espace bureau. Il vient
// UNIQUEMENT de la variable d'environnement CARTES_PASSWORD (définie
// dans Netlify). Valeur par défaut : développement local seulement.
// À CHANGER.
export const MOT_DE_PASSE_CARTES_DEFAUT = 'change-moi-cartes'

export function motDePasseCartes() {
  return process.env.CARTES_PASSWORD || MOT_DE_PASSE_CARTES_DEFAUT
}

// Jeton cartes : signature du mot de passe des cartes de membres.
// Il voyage dans l'en-tête X-Jeton-Cartes.
export function creerJetonCartes() {
  return crypto.createHmac('sha256', motDePasseCartes()).update('cartes-aerd').digest('hex')
}

export function jetonCartesValide(event) {
  const jeton = (event.headers?.['x-jeton-cartes'] || event.headers?.['X-Jeton-Cartes'] || '').trim()
  if (!jeton) return false
  const attendu = creerJetonCartes()
  const a = Buffer.from(jeton)
  const b = Buffer.from(attendu)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function nonAutoriseCartes() {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Accès refusé. Entre le mot de passe des cartes de membres.' })
  }
}
