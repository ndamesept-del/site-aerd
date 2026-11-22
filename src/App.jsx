import { useEffect, useState } from 'react'
import Accueil from './pages/Accueil.jsx'
import CaravanesPubliques from './pages/CaravanesPubliques.jsx'
import Bureau from './pages/Bureau.jsx'
import Confidentialite from './pages/Confidentialite.jsx'
import Conditions from './pages/Conditions.jsx'
import Introuvable from './pages/Introuvable.jsx'
import { estModeLocal } from './api.js'

// Adresse du navigateur -> page du site. Toute autre adresse
// affiche la page « introuvable » (404 de l'application).
const CHEMINS = {
  '/': 'accueil',
  '/index.html': 'accueil',
  '/caravanes': 'caravanes',
  '/bureau': 'bureau',
  '/confidentialite': 'confidentialite',
  '/conditions': 'conditions'
}

const ADRESSES = {
  accueil: '/',
  caravanes: '/caravanes',
  bureau: '/bureau',
  confidentialite: '/confidentialite',
  conditions: '/conditions'
}

function pagePourAdresse() {
  return CHEMINS[window.location.pathname] || 'introuvable'
}

export default function App() {
  const [page, setPage] = useState(() => pagePourAdresse()) // accueil | caravanes | bureau | confidentialite | conditions | introuvable
  const [modeLocal, setModeLocal] = useState(estModeLocal())

  useEffect(() => {
    const maj = () => setModeLocal(estModeLocal())
    window.addEventListener('aerd-mode-local', maj)
    const retour = () => setPage(pagePourAdresse())
    window.addEventListener('popstate', retour)
    return () => {
      window.removeEventListener('aerd-mode-local', maj)
      window.removeEventListener('popstate', retour)
    }
  }, [])

  const aller = (nouvellePage) => {
    setPage(nouvellePage)
    const adresse = ADRESSES[nouvellePage]
    if (adresse && window.location.pathname !== adresse) {
      window.history.pushState(null, '', adresse)
    }
    window.scrollTo(0, 0)
  }

  return (
    <div>
      <header className="entete">
        <div className="conteneur entete-contenu">
          <a
            className="marque"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              aller('accueil')
            }}
          >
            <img src="/Logo_AERD_UAM.png" alt="Logo de l'AERD/UAM" />
            <span>
              <span className="nom">AERD / UAM</span>
              <span className="sous-titre">Amicale des Étudiants Ressortissants de Diourbel</span>
            </span>
          </a>
          <nav aria-label="Navigation principale">
            <button type="button" className={page === 'accueil' ? 'actif' : ''} onClick={() => aller('accueil')}>
              Accueil
            </button>
            <button type="button" className={page === 'caravanes' ? 'actif' : ''} onClick={() => aller('caravanes')}>
              Caravanes
            </button>
            <button type="button" className={page === 'bureau' ? 'actif' : ''} onClick={() => aller('bureau')}>
              Espace bureau
            </button>
          </nav>
        </div>
      </header>

      {modeLocal && (
        <div className="bandeau-local">
          <div className="conteneur">
            Mode local : les données sont gardées dans ce navigateur seulement. Pour la vraie base de données,
            déploie le site sur Netlify (voir le README).
          </div>
        </div>
      )}

      <main>
        {page === 'accueil' && <Accueil aller={aller} />}
        {page === 'caravanes' && <CaravanesPubliques />}
        {page === 'bureau' && <Bureau aller={aller} />}
        {page === 'confidentialite' && <Confidentialite aller={aller} />}
        {page === 'conditions' && <Conditions aller={aller} />}
        {page === 'introuvable' && <Introuvable aller={aller} />}
      </main>

      <footer className="pied">
        <div className="conteneur">
          <p className="nom">AERD / UAM</p>
          <p>
            Amicale des Étudiants Ressortissants de Diourbel, à l’Université Amadou Mahtar Mbow de Diamniadio.
            Les étudiants de Diourbel et de Bambey, de la L1 au master.
          </p>
          <p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                aller('bureau')
              }}
            >
              Espace bureau
            </a>{' '}
            — réservé aux membres du bureau de l’amicale.
          </p>
          <p className="pied-liens">
            <a
              href="/confidentialite"
              onClick={(e) => {
                e.preventDefault()
                aller('confidentialite')
              }}
            >
              Confidentialité
            </a>
            <a
              href="/conditions"
              onClick={(e) => {
                e.preventDefault()
                aller('conditions')
              }}
            >
              Conditions d’utilisation
            </a>
          </p>
          <p className="pied-cookies">Ce site ne dépose aucun cookie de suivi.</p>
        </div>
      </footer>
    </div>
  )
}
