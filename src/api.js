// Client API du site AERD/UAM.
//
// Le site parle aux Netlify Functions (/.netlify/functions/...).
// En développement local avec `npm run dev`, les fonctions n'existent pas :
// on bascule alors sur une base locale dans le navigateur (localStorage,
// voir localMock.js). En production (site déployé sur Netlify), il n'y a
// pas de repli local : une erreur s'affiche si la base n'est pas configurée.

import { local } from './localMock.js'

const FN = '/.netlify/functions'

let modeLocal = false

export function estModeLocal() {
  return modeLocal
}

function getToken() {
  return localStorage.getItem('aerd-bureau-token') || ''
}

export function setToken(jeton) {
  if (jeton) localStorage.setItem('aerd-bureau-token', jeton)
  else localStorage.removeItem('aerd-bureau-token')
}

export function estConnecte() {
  return !!getToken()
}

function getTokenCaravanes() {
  return localStorage.getItem('aerd-caravanes-token') || ''
}

export function setTokenCaravanes(jeton) {
  if (jeton) localStorage.setItem('aerd-caravanes-token', jeton)
  else localStorage.removeItem('aerd-caravanes-token')
}

export function estConnecteCaravanes() {
  return !!getTokenCaravanes()
}

async function appelFonction(nom, { methode = 'GET', corps = null, auth = false, params = null, caravanes = false } = {}) {
  let url = FN + '/' + nom
  if (params) {
    const qs = new URLSearchParams(params)
    url += '?' + qs.toString()
  }
  const options = { method: methode, headers: { 'Content-Type': 'application/json' } }
  if (auth && getToken()) options.headers.Authorization = 'Bearer ' + getToken()
  if (caravanes && getTokenCaravanes()) options.headers['X-Jeton-Caravanes'] = getTokenCaravanes()
  if (corps) options.body = JSON.stringify(corps)
  const res = await fetch(url, options)
  const texte = await res.text()
  let data = null
  try {
    data = JSON.parse(texte)
  } catch {
    data = null
  }
  if (!res.ok || !data) {
    // Message avec « JSON » : en développement, une réponse qui n'est pas
    // du JSON (ex : la page HTML renvoyée quand la fonction n'existe pas)
    // déclenche le repli vers le mode local (voir appel() ci-dessous).
    const err = new Error((data && data.error) || 'Réponse non JSON du serveur (' + res.status + ')')
    err.status = res.status
    throw err
  }
  return data
}

async function appel(nom, opts = {}) {
  if (modeLocal) return local.appel(nom, { ...opts, token: getToken(), jetonCaravanes: getTokenCaravanes() })
  if (!import.meta.env.DEV) return appelFonction(nom, opts)
  try {
    return await appelFonction(nom, opts)
  } catch (e) {
    // Fonctions Netlify absentes en `vite dev` : on passe en mode local.
    if (e.status === 404 || e.status === 405 || /fetch|JSON|Unexpected token/i.test(e.message)) {
      modeLocal = true
      window.dispatchEvent(new Event('aerd-mode-local'))
      return local.appel(nom, { ...opts, token: getToken(), jetonCaravanes: getTokenCaravanes() })
    }
    throw e
  }
}

export const api = {
  // Public
  caravanesPubliques: () => appel('caravanes'),
  inscrire: (donnees) => appel('inscriptions', { methode: 'POST', corps: { action: 'inscrire', ...donnees } }),
  desister: (donnees) => appel('inscriptions', { methode: 'POST', corps: { action: 'desister', ...donnees } }),

  // Bureau (connexion)
  login: (password) => appel('login', { methode: 'POST', corps: { password } }),

  // Caravanes (connexion séparée, administrateur seulement)
  caravanesLogin: (password) => appel('caravanes-login', { methode: 'POST', corps: { password } }),

  // Bureau (données)
  stats: () => appel('stats', { auth: true }),
  caravanesBureau: () => appel('caravanes', { auth: true, caravanes: true, params: { details: '1' } }),
  creerCaravane: (donnees) => appel('caravanes', { methode: 'POST', corps: donnees, auth: true, caravanes: true }),
  membres: (q = '') => appel('membres', { auth: true, params: q ? { q } : null }),
  ajouterMembre: (donnees) => appel('membres', { methode: 'POST', corps: donnees, auth: true }),
  modifierMembre: (donnees) => appel('membres', { methode: 'PUT', corps: donnees, auth: true }),
  chauffeurs: (q = '') => appel('chauffeurs', { auth: true, params: q ? { q } : null }),
  ajouterChauffeur: (donnees) => appel('chauffeurs', { methode: 'POST', corps: donnees, auth: true }),
  bureauPublic: () => appel('bureau'),
  bureauListe: () => appel('bureau', { auth: true }),
  ajouterBureau: (donnees) => appel('bureau', { methode: 'POST', corps: donnees, auth: true }),
  modifierBureau: (donnees) => appel('bureau', { methode: 'PUT', corps: donnees, auth: true }),
  supprimerBureau: (id) => appel('bureau', { methode: 'DELETE', corps: { id }, auth: true }),
  passerAncien: (id) => appel('bureau', { methode: 'POST', corps: { action: 'passer-ancien', id }, auth: true }),
  marquerPaye: (inscription_id) =>
    appel('inscriptions', { methode: 'POST', corps: { action: 'marquer-paye', inscription_id }, auth: true, caravanes: true }),
  retirerInscription: (inscription_id) =>
    appel('inscriptions', { methode: 'POST', corps: { action: 'retirer', inscription_id }, auth: true, caravanes: true }),

  // Cotisations et dons de tickets (volet social)
  cotisations: (mois) => appel('cotisations', { auth: true, params: { mois } }),
  marquerCotisation: (membre_id, mois, statut) =>
    appel('cotisations', { methode: 'POST', corps: { membre_id, mois, statut }, auth: true }),
  donsPublics: () => appel('dons'),
  donsBureau: () => appel('dons', { auth: true, params: { details: '1' } }),
  creerDon: (donnees) => appel('dons', { methode: 'POST', corps: donnees, auth: true }),
  changerStatutDon: (id, statut) =>
    appel('dons', { methode: 'PUT', corps: { id, statut }, auth: true }),
  inscrireTicket: (donnees) => appel('inscriptions_tickets', { methode: 'POST', corps: donnees }),
  attribuerTicket: (id) =>
    appel('inscriptions_tickets', { methode: 'POST', corps: { action: 'attribuer', id }, auth: true }),
  refuserTicket: (id) =>
    appel('inscriptions_tickets', { methode: 'POST', corps: { action: 'refuser', id }, auth: true }),
  parametresPublics: () => appel('parametres'),
  definirNumeroTresorier: (numero_wave_tresorier) =>
    appel('parametres', { methode: 'POST', corps: { numero_wave_tresorier }, auth: true }),

}
