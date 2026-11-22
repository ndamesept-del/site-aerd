// Outils partagés des Netlify Functions : connexion PostgreSQL,
// réponses JSON, lecture du corps des requêtes.
import pg from 'pg'

const { Pool } = pg

let pool = null

export function getPool() {
  const cs = process.env.DATABASE_URL
  if (!cs) return null
  if (!pool) {
    pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } })
  }
  return pool
}

export const HEADERS = { 'Content-Type': 'application/json' }

export function reponse(statusCode, data) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(data) }
}

export function erreur(message, statusCode = 500) {
  return reponse(statusCode, { error: message })
}

export function pasDeBase() {
  return erreur(
    'Base de données non configurée. Définis DATABASE_URL dans les variables d’environnement Netlify (voir README).',
    500
  )
}

export function lireCorps(event) {
  try {
    return event.body ? JSON.parse(event.body) : {}
  } catch {
    return {}
  }
}

export function nettoyerTexte(v) {
  return String(v || '').trim()
}
