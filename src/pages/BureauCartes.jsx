import { useEffect, useState } from 'react'
import { formatMontant, PRIX_CARTE_FCFA } from '../data.js'
import { api } from '../api.js'

// Cartes de membres (bureau) : c'est ici que le trésorier valide les
// paiements. Le membre paie 1 000 FCFA par Wave ou Orange Money au
// trésorier ; quand le paiement est reçu, le trésorier clique sur
// « Valider le paiement » : le membre peut ensuite télécharger sa carte
// avec son QR code sur la page publique « Ma carte de membre ».
// Comme chez Pastef, le parcours est en 3 étapes claires : paiement,
// validation par le bureau, téléchargement de la carte.
export default function BureauCartes() {
  const [membres, setMembres] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [recherche, setRecherche] = useState('')
  const [validationEnCours, setValidationEnCours] = useState(null)

  const charger = async (q = '') => {
    setCharge(true)
    setErreur('')
    try {
      const data = await api.membres(q)
      setMembres(data.membres || [])
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les cartes de membres.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const chercher = (e) => {
    const valeur = e.target.value
    setRecherche(valeur)
    charger(valeur)
  }

  // Valider le paiement de la carte : le numéro de carte est attribué
  // tout seul (AERD-2026-001, ...) si le membre n'en avait pas encore.
  const valider = async (m) => {
    setErreur('')
    setMessage('')
    setValidationEnCours(m.id)
    try {
      const data = await api.marquerCartePayee(m.id, true)
      const numero = data.membre.numero_carte
      setMessage(
        'Paiement validé pour ' +
          m.prenom +
          ' ' +
          m.nom +
          ' (carte ' +
          numero +
          '). Il peut maintenant télécharger sa carte sur la page « Ma carte de membre ».'
      )
      charger(recherche)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setValidationEnCours(null)
    }
  }

  const retirer = async (m) => {
    setErreur('')
    setMessage('')
    try {
      await api.marquerCartePayee(m.id, false)
      setMessage('Paiement de la carte retiré pour ' + m.prenom + ' ' + m.nom + '.')
      charger(recherche)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    }
  }

  const aValider = membres.filter((m) => !m.carte_payee)
  const payees = membres.filter((m) => m.carte_payee)

  return (
    <div>
      <h3>Cartes de membres</h3>
      <p>
        La carte coûte {formatMontant(PRIX_CARTE_FCFA)}. Le membre paie par Wave ou Orange Money au trésorier. Quand
        le paiement est reçu, valide-le ici : le membre pourra ensuite télécharger sa carte avec son QR code sur la
        page publique « Ma carte de membre ».
      </p>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="stats">
        <div className="stat">
          <div className="nombre">{payees.length}</div>
          <div className="libelle">carte(s) payée(s)</div>
        </div>
        <div className="stat">
          <div className="nombre">{aValider.length}</div>
          <div className="libelle">en attente de validation</div>
        </div>
      </div>

      <div className="champ" style={{ marginTop: 16 }}>
        <label htmlFor="cartes-recherche">Rechercher un membre</label>
        <input
          id="cartes-recherche"
          type="search"
          value={recherche}
          onChange={chercher}
          placeholder="Nom ou numéro de téléphone"
        />
      </div>

      {charge && <p className="chargement">Chargement…</p>}

      {!charge && (
        <div style={{ marginTop: 20 }}>
          <h3>À valider ({aValider.length})</h3>
          {aValider.length === 0 && (
            <p className="vide">Aucun paiement en attente. Tous les membres ont leur carte payée.</p>
          )}
          {aValider.map((m) => (
            <div className="rangee" key={m.id}>
              <div className="nom">
                {m.prenom} {m.nom}
              </div>
              <div className="details">
                <a href={'tel:' + String(m.telephone).replace(/\s/g, '')}>{m.telephone}</a>
                {' · '}
                {m.ufr_departement} · {m.niveau} · {m.origine}
              </div>
              <div className="details">
                Carte de membre : {m.numero_carte || 'numéro attribué à la validation'} ·{' '}
                <span className="badge badge-inscrit">Non payée</span>
              </div>
              <div className="actions-ligne">
                <button
                  type="button"
                  className="bouton bouton-bleu"
                  onClick={() => valider(m)}
                  disabled={validationEnCours === m.id}
                >
                  {validationEnCours === m.id ? 'Validation…' : 'Valider le paiement (1 000 FCFA)'}
                </button>
              </div>
            </div>
          ))}

          <h3 style={{ marginTop: 28 }}>Cartes payées ({payees.length})</h3>
          {payees.length === 0 && <p className="vide">Aucune carte payée pour le moment.</p>}
          {payees.map((m) => (
            <div className="rangee" key={m.id}>
              <div className="nom">
                {m.prenom} {m.nom}
              </div>
              <div className="details">
                <a href={'tel:' + String(m.telephone).replace(/\s/g, '')}>{m.telephone}</a>
              </div>
              <div className="details">
                Carte de membre : {m.numero_carte || 'pas encore de numéro'} ·{' '}
                <span className="badge badge-paye">Payée</span>
              </div>
              <div className="actions-ligne">
                <button type="button" className="bouton-discret bouton-danger" onClick={() => retirer(m)}>
                  Retirer le paiement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
