import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Fenêtre pop-up (modale) du site AERD/UAM.
//
// Elle se ferme de trois façons :
// - le bouton fermer (×) en haut à droite,
// - un clic sur le fond assombri derrière la fenêtre,
// - la touche Échap du clavier.
// Tant qu'elle est ouverte, la page derrière ne défile plus.
// Sur téléphone, la fenêtre arrive par le bas de l'écran ; sur
// ordinateur, elle est centrée.
//
// La fenêtre est rendue dans un portail vers document.body : sans ça,
// le `position: fixed` serait détourné par le `transform` au survol
// des cartes (`.carte:hover { transform: translateY(-3px) }`), et la
// modale apparaîtrait mal placée et coupée au lieu d'être centrée
// sur tout l'écran.
export default function Modale({ titre, onFermer, className = '', children }) {
  const boutonFermer = useRef(null)

  // À l'ouverture, le focus passe sur le bouton fermer (clavier et lecteurs
  // d'écran) ; à la fermeture, il revient à l'élément qui avait ouvert la fenêtre.
  // Effet séparé, sans dépendance : il ne se rejoue pas quand la page derrière change.
  useEffect(() => {
    const precedent = document.activeElement
    if (boutonFermer.current) boutonFermer.current.focus()
    return () => {
      if (precedent && typeof precedent.focus === 'function') precedent.focus()
    }
  }, [])

  useEffect(() => {
    const touche = (e) => {
      if (e.key === 'Escape') onFermer()
    }
    document.addEventListener('keydown', touche)
    const ancienDebordement = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', touche)
      document.body.style.overflow = ancienDebordement
    }
  }, [onFermer])

  return createPortal(
    <div className="modale-fond" onClick={onFermer}>
      <div
        className={'modale ' + className}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modale-entete">
          <h3>{titre}</h3>
          <button
            type="button"
            ref={boutonFermer}
            className="modale-fermer"
            onClick={onFermer}
            aria-label="Fermer la fenêtre"
          >
            ×
          </button>
        </div>
        <div className="modale-corps">{children}</div>
      </div>
    </div>,
    document.body
  )
}
