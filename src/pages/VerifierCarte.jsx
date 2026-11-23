import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { api } from '../api.js'

// Vérifier une carte de membre : on scanne son QR code (ou on tape son
// numéro) et le site contrôle le numéro dans la base de l'amicale.
// Une carte inventée (par exemple fabriquée par une IA) porte un numéro
// qui n'existe pas dans la base : la page dit « Carte non reconnue ».
// Une photocopie d'une vraie carte reste authentique : celui qui vérifie
// compare le nom affiché avec le nom écrit sur la carte.
export default function VerifierCarte() {
  const [numero, setNumero] = useState('')
  const [verification, setVerification] = useState(null)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState(false)
  const [scan, setScan] = useState(false)
  const lecteurRef = useRef(null)

  const verifier = async (valeur) => {
    const propre = String(valeur || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '')
    if (!propre) return
    setErreur('')
    setVerification(null)
    setRecherche(true)
    try {
      const data = await api.verifierCarte(propre)
      setVerification(data)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setRecherche(false)
    }
  }

  // Arrivée par le QR de la carte : /verifier-carte?numero=AERD-2026-001
  // La vérification se lance toute seule, sans rien taper.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const n = (params.get('numero') || '').trim()
    if (n) {
      setNumero(n)
      verifier(n)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Numéro tiré d'un QR scanné : lien de vérification, numéro seul, ou
  // autre texte (qui ne correspond à aucune carte de l'amicale).
  const numeroDepuisQR = (texte) => {
    try {
      const url = new URL(texte)
      const n = url.searchParams.get('numero')
      if (n) return n
    } catch {
      // Pas un lien : on regarde si c'est un numéro de carte.
    }
    const brut = String(texte || '').trim()
    if (/^AERD-\d{4}-\d{3}$/i.test(brut)) return brut.toUpperCase()
    return null
  }

  // Scanner avec la caméra du téléphone.
  useEffect(() => {
    if (!scan) return undefined
    const lecteur = new Html5QrcodeScanner('lecteur-qr', { fps: 10, qrbox: 250 }, false)
    lecteurRef.current = lecteur
    lecteur.render(
      (texte) => {
        const n = numeroDepuisQR(texte)
        lecteur.clear().catch(() => {})
        setScan(false)
        if (n) {
          setNumero(n)
          verifier(n)
        } else {
          setErreur('Ce QR ne correspond pas à une carte de l’amicale.')
        }
      },
      () => {}
    )
    return () => {
      lecteur.clear().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan])

  const chercher = (e) => {
    e.preventDefault()
    verifier(numero)
  }

  return (
    <div className="conteneur">
      <section className="section">
        <h2>Vérifier une carte de membre</h2>
        <p>
          Scanne le QR code d’une carte avec ton téléphone, ou tape son numéro. Le site vérifie dans la base de
          l’amicale si la carte existe et si elle est payée.
        </p>

        {!scan && (
          <form className="formulaire" onSubmit={chercher}>
            {erreur && <p className="message-erreur">{erreur}</p>}
            <div className="champ">
              <label htmlFor="verifier-numero">Numéro de la carte</label>
              <input
                id="verifier-numero"
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex : AERD-2026-001"
                autoComplete="off"
              />
            </div>
            <div className="actions">
              <button type="submit" className="bouton bouton-plein" disabled={recherche}>
                {recherche ? 'Vérification…' : 'Vérifier'}
              </button>
              <button
                type="button"
                className="bouton bouton-secondaire bouton-plein"
                onClick={() => {
                  setErreur('')
                  setScan(true)
                }}
              >
                Scanner avec la caméra
              </button>
            </div>
          </form>
        )}

        {scan && (
          <div>
            <div id="lecteur-qr" />
            <div className="actions" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="bouton bouton-secondaire bouton-plein"
                onClick={() => {
                  if (lecteurRef.current) lecteurRef.current.clear().catch(() => {})
                  setScan(false)
                }}
              >
                Arrêter le scan
              </button>
            </div>
          </div>
        )}

        {verification && verification.authentique && (
          <div className="encart-wave" style={{ borderColor: '#1e7d32' }}>
            <div>
              <strong>Carte authentique.</strong>
            </div>
            <div>
              Cette carte appartient à {verification.membre.prenom} {verification.membre.nom}, numéro{' '}
              {verification.numero}.
            </div>
            <div>
              Vérifie que le nom écrit sur la carte est bien celui-ci. Une photocopie d’une vraie carte reste
              authentique.
            </div>
          </div>
        )}

        {verification && !verification.authentique && verification.raison === 'inconnu' && (
          <div className="encart-wave" style={{ borderColor: '#b3261e' }}>
            <div>
              <strong>Carte non reconnue.</strong>
            </div>
            <div>
              Le numéro {verification.numero} n’existe pas dans la base de l’amicale. Cette carte n’a pas été faite
              par le bureau.
            </div>
          </div>
        )}

        {verification && !verification.authentique && verification.raison === 'non-validee' && (
          <div className="encart-wave" style={{ borderColor: '#e3b02e' }}>
            <div>
              <strong>Carte non validée.</strong>
            </div>
            <div>
              La carte de {verification.membre.prenom} {verification.membre.nom} existe, mais le trésorier ne l’a
              pas encore validée.
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
