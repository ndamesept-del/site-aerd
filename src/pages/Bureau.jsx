import { useState } from 'react'
import { api, setToken, estConnecte } from '../api.js'
import BureauDashboard from './BureauDashboard.jsx'
import BureauMembres from './BureauMembres.jsx'
import BureauChauffeurs from './BureauChauffeurs.jsx'
import BureauCaravanes from './BureauCaravanes.jsx'
import BureauOrganigramme from './BureauOrganigramme.jsx'
import BureauCotisations from './BureauCotisations.jsx'
import BureauDons from './BureauDons.jsx'

function PageConnexion({ onConnecte }) {
  const [password, setPassword] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const data = await api.login(password)
      setToken(data.token)
      onConnecte()
    } catch {
      setErreur('Mot de passe incorrect. Réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="conteneur">
      <div className="carte carte-connexion">
        <h2>Espace bureau</h2>
        <p>Accès réservé aux membres du bureau de l’AERD/UAM.</p>
        <form onSubmit={envoyer}>
          {erreur && <p className="message-erreur">{erreur}</p>}
          <div className="champ">
            <label htmlFor="mot-de-passe">Mot de passe du bureau</label>
            <input
              id="mot-de-passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="bouton bouton-bleu bouton-plein" disabled={envoi}>
            {envoi ? 'Vérification…' : 'Entrer dans l’espace bureau'}
          </button>
        </form>
        <p className="message-info">Le mot de passe est partagé par le bureau.</p>
      </div>
    </div>
  )
}

export default function Bureau({ aller }) {
  const [connecte, setConnecte] = useState(estConnecte())
  const [onglet, setOnglet] = useState('tableau') // tableau | membres | chauffeurs | caravanes | bureau | cotisations | dons

  const quitter = () => {
    setToken(null)
    setConnecte(false)
    aller('accueil')
  }

  if (!connecte) {
    return <PageConnexion onConnecte={() => setConnecte(true)} />
  }

  return (
    <div className="conteneur">
      <section className="section">
        <div className="barre-bureau">
          <h2>Espace bureau</h2>
          <div>
            <button type="button" className="bouton-discret" onClick={() => aller('caravanes')}>
              Voir le site public
            </button>{' '}
            <button type="button" className="bouton-discret" onClick={quitter}>
              Quitter
            </button>
          </div>
        </div>

        <div className="onglets-bureau" role="tablist" aria-label="Sections du bureau">
          <button type="button" className={onglet === 'tableau' ? 'actif' : ''} onClick={() => setOnglet('tableau')}>
            Tableau de bord
          </button>
          <button type="button" className={onglet === 'membres' ? 'actif' : ''} onClick={() => setOnglet('membres')}>
            Membres
          </button>
          <button
            type="button"
            className={onglet === 'chauffeurs' ? 'actif' : ''}
            onClick={() => setOnglet('chauffeurs')}
          >
            Chauffeurs
          </button>
          <button
            type="button"
            className={onglet === 'caravanes' ? 'actif' : ''}
            onClick={() => setOnglet('caravanes')}
          >
            Caravanes
          </button>
          <button
            type="button"
            className={onglet === 'bureau' ? 'actif' : ''}
            onClick={() => setOnglet('bureau')}
          >
            Organigramme
          </button>
          <button
            type="button"
            className={onglet === 'cotisations' ? 'actif' : ''}
            onClick={() => setOnglet('cotisations')}
          >
            Cotisations
          </button>
          <button
            type="button"
            className={onglet === 'dons' ? 'actif' : ''}
            onClick={() => setOnglet('dons')}
          >
            Dons de tickets
          </button>
        </div>

        {onglet === 'tableau' && <BureauDashboard allerOnglet={setOnglet} />}
        {onglet === 'membres' && <BureauMembres />}
        {onglet === 'chauffeurs' && <BureauChauffeurs />}
        {onglet === 'caravanes' && <BureauCaravanes />}
        {onglet === 'bureau' && <BureauOrganigramme />}
        {onglet === 'cotisations' && <BureauCotisations />}
        {onglet === 'dons' && <BureauDons />}
      </section>
    </div>
  )
}
