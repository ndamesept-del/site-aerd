import { useState } from 'react'
import { api, setToken, estConnecte, setTokenCaravanes, estConnecteCaravanes, setTokenCartes, estConnecteCartes } from '../api.js'
import BureauDashboard from './BureauDashboard.jsx'
import BureauMembres from './BureauMembres.jsx'
import BureauCartes from './BureauCartes.jsx'
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

function PageConnexionCaravanes({ onConnecte }) {
  const [password, setPassword] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const data = await api.caravanesLogin(password)
      setTokenCaravanes(data.token)
      onConnecte()
    } catch {
      setErreur('Mot de passe incorrect. Réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div>
      <h3>Caravanes, accès protégé</h3>
      <p>Seul l’administrateur connaît ce mot de passe. Sans lui, on ne peut ni créer une caravane, ni valider un paiement.</p>
      <form onSubmit={envoyer}>
        {erreur && <p className="message-erreur">{erreur}</p>}
        <div className="champ">
          <label htmlFor="mot-de-passe-caravanes">Mot de passe des caravanes</label>
          <input
            id="mot-de-passe-caravanes"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="bouton bouton-bleu bouton-plein" disabled={envoi}>
          {envoi ? 'Vérification…' : 'Ouvrir l’onglet Caravanes'}
        </button>
      </form>
    </div>
  )
}

function PageConnexionCartes({ onConnecte }) {
  const [password, setPassword] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const data = await api.cartesLogin(password)
      setTokenCartes(data.token)
      onConnecte()
    } catch {
      setErreur('Mot de passe incorrect. Réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div>
      <h3>Cartes de membres, accès protégé</h3>
      <p>Seul le trésorier connaît ce mot de passe. Sans lui, on ne peut ni voir les cartes, ni valider un paiement de carte.</p>
      <form onSubmit={envoyer}>
        {erreur && <p className="message-erreur">{erreur}</p>}
        <div className="champ">
          <label htmlFor="mot-de-passe-cartes">Mot de passe des cartes de membres</label>
          <input
            id="mot-de-passe-cartes"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="bouton bouton-bleu bouton-plein" disabled={envoi}>
          {envoi ? 'Vérification…' : 'Ouvrir l’onglet Cartes de membres'}
        </button>
      </form>
    </div>
  )
}

export default function Bureau({ aller }) {
  const [connecte, setConnecte] = useState(estConnecte())
  const [caravanesConnecte, setCaravanesConnecte] = useState(estConnecteCaravanes())
  const [cartesConnecte, setCartesConnecte] = useState(estConnecteCartes())
  const [onglet, setOnglet] = useState('tableau') // tableau | membres | cartes | chauffeurs | caravanes | bureau | cotisations | dons

  const quitter = () => {
    setToken(null)
    setTokenCaravanes(null)
    setCaravanesConnecte(false)
    setTokenCartes(null)
    setCartesConnecte(false)
    setConnecte(false)
    aller('accueil')
  }

  // Jeton des caravanes périmé (mot de passe changé) : on efface le jeton
  // et on montre de nouveau le formulaire du mot de passe.
  const quitterCaravanes = () => {
    setTokenCaravanes(null)
    setCaravanesConnecte(false)
  }

  // Même chose pour le mot de passe du bureau.
  const quitterBureau = () => {
    setToken(null)
    setConnecte(false)
  }

  // Jeton des cartes périmé (mot de passe changé) : on efface le jeton
  // et on montre de nouveau le formulaire du mot de passe.
  const quitterCartes = () => {
    setTokenCartes(null)
    setCartesConnecte(false)
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
          <button type="button" className={onglet === 'cartes' ? 'actif' : ''} onClick={() => setOnglet('cartes')}>
            Cartes de membres
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

        {onglet === 'tableau' && <BureauDashboard allerOnglet={setOnglet} onDeconnecte={quitterBureau} />}
        {onglet === 'membres' && <BureauMembres />}
        {onglet === 'cartes' &&
          (cartesConnecte ? (
            <BureauCartes onAccesRefuse={quitterCartes} />
          ) : (
            <PageConnexionCartes onConnecte={() => setCartesConnecte(true)} />
          ))}
        {onglet === 'chauffeurs' && <BureauChauffeurs />}
        {onglet === 'caravanes' &&
          (caravanesConnecte ? (
            <BureauCaravanes onAccesRefuse={quitterCaravanes} />
          ) : (
            <PageConnexionCaravanes onConnecte={() => setCaravanesConnecte(true)} />
          ))}
        {onglet === 'bureau' && <BureauOrganigramme />}
        {onglet === 'cotisations' && <BureauCotisations />}
        {onglet === 'dons' && <BureauDons />}
      </section>
    </div>
  )
}
