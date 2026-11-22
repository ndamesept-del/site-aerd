import { useEffect, useState } from 'react'
import { formatMontant, PRIX_CARTE_FCFA, FORMULAIRE_INSCRIPTION } from '../data.js'
import { api } from '../api.js'
import CarteMembre from '../components/CarteMembre.jsx'

// Ma carte de membre (public).
//
// On retrouve le membre par son NOM (prénom + nom), pas par son numéro
// de téléphone : le numéro peut changer (une personne peut avoir deux
// numéros), alors que le nom ne change pas. Si plusieurs membres ont le
// même nom, on les propose tous et la personne choisit le sien.
//
// Parcours en 3 étapes, comme chez Pastef : 1. le membre paie 1 000 FCFA
// par Wave ou Orange Money au trésorier, 2. il déclare son paiement ici
// (« J'ai payé ») et le trésorier le valide au bureau, 3. il revient ici
// et télécharge sa carte avec son QR code.
//
// Plus rapide : le trésorier peut envoyer au membre le lien direct de sa
// carte (bouton « Copier le lien de la carte » dans l'onglet Cartes du
// bureau). Le lien contient déjà son nom, par exemple
// /ma-carte?prenom=Awa&nom=Diallo : en cliquant dessus, le membre voit
// sa carte tout de suite, sans rien taper.
export default function MaCarte() {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [recherche, setRecherche] = useState(false)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [candidats, setCandidats] = useState(null)
  const [membre, setMembre] = useState(null)
  const [numeroTresorier, setNumeroTresorier] = useState('')
  const [declarationEnCours, setDeclarationEnCours] = useState(false)

  useEffect(() => {
    api
      .parametresPublics()
      .then((data) => setNumeroTresorier(data.numero_wave_tresorier || ''))
      .catch(() => setNumeroTresorier(''))
  }, [])

  // Si on arrive avec le nom dans l'adresse (lien envoyé par le
  // trésorier), la recherche se lance toute seule, sans rien taper.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = (params.get('prenom') || '').trim()
    const n = (params.get('nom') || '').trim()
    if (p.length >= 2 && n.length >= 2) {
      setPrenom(p)
      setNom(n)
      rechercher(p, n)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chercher = (e) => {
    e.preventDefault()
    rechercher(prenom, nom)
  }

  const rechercher = async (p, n) => {
    setErreur('')
    setMessage('')
    setCandidats(null)
    setMembre(null)
    setRecherche(true)
    try {
      const data = await api.maCarte({ prenom: p, nom: n })
      const trouves = data.membres || []
      if (trouves.length === 0) {
        setErreur(
          'Aucun membre trouvé avec ce nom. Vérifie l’orthographe de ton prénom et de ton nom, ou inscris-toi d’abord à l’amicale.'
        )
      } else if (trouves.length === 1) {
        setMembre(trouves[0])
      } else {
        setCandidats(trouves)
      }
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setRecherche(false)
    }
  }

  // Déclarer son paiement : le membre apparaît en haut de l'onglet
  // « Cartes de membres » du bureau, pour que le trésorier le valide.
  const declarerPaiement = async () => {
    setErreur('')
    setMessage('')
    setDeclarationEnCours(true)
    try {
      const data = await api.maCarte({ action: 'declarer-paiement', id: membre.id })
      setMembre(data.membre)
      setMessage(
        'Merci ! Ton paiement est déclaré. Le trésorier va le valider. Quand c’est validé, appuie sur « Récupérer ma carte » ci-dessous pour télécharger ta carte.'
      )
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setDeclarationEnCours(false)
    }
  }

  // Vérifier si le trésorier a validé : on recharge le membre sans
  // effacer l'écran. Si la carte est validée, elle s'affiche tout de
  // suite avec le téléchargement ; sinon, on dit d'attendre encore.
  const [verificationEnCours, setVerificationEnCours] = useState(false)
  const verifierValidation = async () => {
    setErreur('')
    setVerificationEnCours(true)
    try {
      const data = await api.maCarte({ prenom, nom })
      const trouves = data.membres || []
      const moi = trouves.find((x) => x.id === membre.id) || trouves[0]
      if (moi) setMembre(moi)
      if (moi && moi.carte_payee) {
        setMessage('Ta carte est validée, tu peux la télécharger.')
      } else {
        setMessage('Pas encore validée. Le trésorier va la valider, reviens dans un moment.')
      }
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setVerificationEnCours(false)
    }
  }

  const recommencer = () => {
    setMembre(null)
    setCandidats(null)
    setPrenom('')
    setNom('')
    setErreur('')
    setMessage('')
  }

  return (
    <div className="conteneur">
      <section className="section">
        <h2>Ma carte de membre</h2>
        <ol className="etapes-carte">
          <li>
            <strong>1. Paie {formatMontant(PRIX_CARTE_FCFA)}</strong> par Wave ou Orange Money au trésorier.
          </li>
          <li>
            <strong>2. Déclare ton paiement ici</strong> : le trésorier le valide au bureau.
          </li>
          <li>
            <strong>3. Reviens ici, mets ton nom et appuie sur « Récupérer ma carte »</strong> pour télécharger ta
            carte avec ton QR code.
          </li>
        </ol>
        <p className="aide">
          Astuce : le trésorier peut aussi t’envoyer directement le lien de ta carte par WhatsApp. En cliquant
          dessus, tu verras ta carte tout de suite, sans rien taper.
        </p>

        {!membre && !candidats && (
          <form className="formulaire" onSubmit={chercher}>
            {erreur && <p className="message-erreur">{erreur}</p>}
            <div className="grille-champs">
              <div className="champ">
                <label htmlFor="carte-prenom">Ton prénom</label>
                <input
                  id="carte-prenom"
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Ex : Abdou Ndame"
                  required
                />
              </div>
              <div className="champ">
                <label htmlFor="carte-nom">Ton nom</label>
                <input
                  id="carte-nom"
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  autoComplete="family-name"
                  placeholder="Ex : Thiam"
                  required
                />
              </div>
            </div>
            <p className="aide">C’est le nom que tu as donné à ton inscription à l’amicale.</p>
            <div className="actions">
              <button type="submit" className="bouton bouton-plein" disabled={recherche}>
                {recherche ? 'Recherche…' : 'Récupérer ma carte'}
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

        {candidats && (
          <div>
            <p className="message-ok">Plusieurs membres ont ce nom. Choisis le tien :</p>
            {candidats.map((c) => (
              <div className="rangee" key={c.id}>
                <div className="nom">
                  {c.prenom} {c.nom}
                </div>
                <div className="details">
                  {c.ufr_departement} · {c.niveau}
                </div>
                <div className="actions-ligne">
                  <button type="button" className="bouton bouton-bleu" onClick={() => setMembre(c)}>
                    C’est moi
                  </button>
                </div>
              </div>
            ))}
            <div className="actions" style={{ marginTop: 14 }}>
              <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={recommencer}>
                Chercher un autre nom
              </button>
            </div>
          </div>
        )}

        {membre && (
          <div>
            <p className="message-ok">
              Bonjour {membre.prenom} {membre.nom}
              {membre.numero_carte ? ' — ta carte porte le numéro ' + membre.numero_carte + '.' : '.'}
            </p>
            {message && <p className="message-ok">{message}</p>}
            {erreur && <p className="message-erreur">{erreur}</p>}

            {membre.carte_payee && membre.numero_carte ? (
              <CarteMembre membre={membre} />
            ) : membre.carte_paiement_declare ? (
              <div>
                <div className="encart-wave">
                  <div>
                    Ton paiement est déclaré. Le trésorier va le valider. Quand c’est validé, appuie sur le bouton
                    ci-dessous pour récupérer ta carte.
                  </div>
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="bouton bouton-bleu bouton-plein"
                    onClick={verifierValidation}
                    disabled={verificationEnCours}
                  >
                    {verificationEnCours ? 'Vérification…' : 'Récupérer ma carte'}
                  </button>
                </div>
              </div>
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
                    Après avoir payé, clique sur « J’ai payé » ci-dessous : le trésorier verra ton paiement en haut
                    de sa liste et le validera. Reviens ensuite ici et appuie sur « Récupérer ma carte » pour
                    télécharger ta carte.
                  </div>
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="bouton bouton-bleu bouton-plein"
                    onClick={declarerPaiement}
                    disabled={declarationEnCours}
                  >
                    {declarationEnCours ? 'Enregistrement…' : 'J’ai payé 1 000 FCFA'}
                  </button>
                </div>
                {membre.numero_carte && (
                  <p className="aide">Ton numéro de carte sera le {membre.numero_carte}.</p>
                )}
              </div>
            )}

            <div className="actions" style={{ marginTop: 14 }}>
              <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={recommencer}>
                Chercher un autre nom
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
