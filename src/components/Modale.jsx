import { useEffect } from 'react'

// Fenêtre pop-up (modale) du site AERD/UAM.
//
// Elle se ferme de trois façons :
// - le bouton fermer (×) en haut à droite,
// - un clic sur le fond assombri derrière la fenêtre,
// - la touche Échap du clavier.
// Tant qu'elle est ouverte, la page derrière ne défile plus.
// Sur téléphone, la fenêtre arrive par le bas de l'écran ; sur
// ordinateur, elle est centrée.
export default function Modale({ titre, onFermer, children }) {
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

  return (
    <div className="modale-fond" onClick={onFermer}>
      <div
        className="modale"
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modale-entete">
          <h3>{titre}</h3>
          <button
            type="button"
            className="modale-fermer"
            onClick={onFermer}
            aria-label="Fermer la fenêtre"
          >
            ×
          </button>
        </div>
        <div className="modale-corps">{children}</div>
      </div>
    </div>
  )
}
