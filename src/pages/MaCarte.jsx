import { useEffect, useRef, useState } from 'react'
import { formatMontant, normaliserTelephone, PRIX_CARTE_FCFA, FORMULAIRE_INSCRIPTION } from '../data.js'
import { api } from '../api.js'
import CarteMembre from '../components/CarteMembre.jsx'

// Ma carte de membre (public).
//
// Le membre tape son numéro de téléphone : le site le retrouve et lui
// montre sa carte. Si la carte n'est pas encore payée (1000 FCFA), la
// page lui dit où payer (Wave ou Orange Money au trésorier) : après la
// confirmation du bureau, il revient ici avec son numéro et télécharge
// sa carte avec QR code.
export default function MaCarte() {
  const [telephone, setTelephone] = useState('')
  const [recherche, setRecherche] = useState(false)
  const [erreur, setErreur] = useState('')
  const [membre, setMembre] = useState(null)
  const [numeroTresorier, setNumeroTresorier] = useState('')
  const resultatRef = useRef(null)

  // Quand la carte apparaît, on remonte en haut de la page : sinon le
  // haut de la carte reste caché sous le menu fixe du site.
  useEffect(() => {
    if (membre && resultatRef.current) {
      resultatRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [membre])

  useEffect(() => {
    api
      .parametresPublics()
      .then((data) => setNumeroTresorier(data.numero_wave_tresorier || ''))
      .catch(() => setNumeroTresorier(''))
  }, [])

  const chercher = async (e) => {
    e.preventDefault()
    setErreur('')
    setMembre(null)
    setRecherche(true)
    try {
      const data = await api.maCarte(normaliserTelephone(telephone))
      setMembre(data.membre)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setRecherche(false)
    }
  }

  const recommencer = () => {
    setMembre(null)
    setTelephone('')
    setErreur('')
  }

  return (
    <div className="conteneur">
      <section className="section">
        <h2>Ma carte de membre</h2>
        <p className="intro">
          Ta carte coûte {formatMontant(PRIX_CARTE_FCFA)}. Paie-la par Wave ou Orange Money, le bureau confirme ton
          paiement, puis reviens ici pour télécharger ta carte avec ton QR code.
        </p>

        {!membre && (
          <form className="formulaire" onSubmit={chercher}>
            {erreur && <p className="message-erreur">{erreur}</p>}
            <div className="champ">
              <label htmlFor="carte-tel">Ton numéro de téléphone</label>
              <input
                id="carte-tel"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                autoComplete="tel"
                placeholder="Ex : 77 000 00 00"
                required
              />
              <p className="aide">C’est le numéro que tu as donné à ton inscription à l’amicale.</p>
            </div>
            <div className="actions">
              <button type="submit" className="bouton bouton-plein" disabled={recherche}>
                {recherche ? 'Recherche…' : 'Voir ma carte'}
              </button>
            </div>
            {erreur && (
              <p className="aide">
                Pas encore membre ?{' '}
                <a href={FORMULAIRE_INSCRIPTION} target="_blank" rel="noreferrer">
                  Remplis le formulaire d’inscription à l’amicale
                </a>{' '}
                : le bureau t’ajoute ensuite à la liste des membres.
              </p>
            )}
          </form>
        )}

        {membre && (
          <div ref={resultatRef} style={{ scrollMarginTop: 110 }}>
            <p className="message-ok">
              Bonjour {membre.prenom} {membre.nom}
              {membre.numero_carte ? ' — ta carte porte le numéro ' + membre.numero_carte + '.' : '.'}
            </p>

            {membre.carte_payee && membre.numero_carte ? (
              <CarteMembre membre={membre} />
            ) : (
              <div>
                <div className="encart-wave">
                  <div>
                    Ta carte coûte {formatMontant(PRIX_CARTE_FCFA)}. Envoie le montant par Wave ou Orange Money au
                    trésorier :
                  </div>
                  {numeroTresorier ? (
                    <div className="numero">
                      <a href={'tel:' + numeroTresorier.replace(/\s/g, '')}>{numeroTresorier}</a>
                    </div>
                  ) : (
                    <div>Demande le numéro du trésorier au bureau.</div>
                  )}
                  <div>
                    Le bureau confirmera ton paiement. Reviens ensuite ici avec ton numéro de téléphone pour
                    télécharger ta carte.
                  </div>
                </div>
                {membre.numero_carte && (
                  <p className="aide">Ton numéro de carte sera le {membre.numero_carte}.</p>
                )}
              </div>
            )}

            <div className="actions" style={{ marginTop: 14 }}>
              <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={recommencer}>
                Chercher un autre numéro
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
