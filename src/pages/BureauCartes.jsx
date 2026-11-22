import { useEffect, useState } from 'react'
import { formatMontant, PRIX_CARTE_FCFA } from '../data.js'
import { api } from '../api.js'

// Cartes de membres (bureau) : c'est ici que le trésorier valide les
// paiements. Le membre paie 1 000 FCFA par Wave ou Orange Money au
// trésorier, puis il déclare son paiement sur la page publique
// « Ma carte de membre » (bouton « J'ai payé »). SEULS ceux qui ont
// fait une demande de carte apparaissent ici, dans « Paiements
// déclarés – à valider », pour que le trésorier les valide
// directement, sans avoir à parcourir tout le monde. Ceux qui n'ont
// pas encore demandé de carte n'apparaissent pas ici : on les retrouve
// dans l'onglet Membres (filtre « Sans carte »). Comme chez Pastef,
// le parcours est en 3 étapes claires : paiement, validation par le
// bureau, téléchargement de la carte.
// L'onglet est protégé par son propre mot de passe (le trésorier
// seulement) : si le mot de passe change, le jeton gardé devient
// périmé et le serveur refuse l'accès (401). Dans ce cas, on revient
// au formulaire du mot de passe au lieu de rester bloqué.
export default function BureauCartes({ onAccesRefuse }) {
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
      const data = await api.cartesMembres(q)
      setMembres(data.membres || [])
    } catch (err) {
      if (err.status === 401 && onAccesRefuse) {
        onAccesRefuse()
        return
      }
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
      const data = await api.cartesValider(m.id, true)
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

  // Lien direct de la carte du membre : le trésorier le copie et le lui
  // envoie par WhatsApp. En cliquant dessus, le membre voit sa carte tout
  // de suite, sans rien taper (son nom est déjà dans le lien).
  const copierLien = async (m) => {
    const lien =
      window.location.origin +
      '/ma-carte?prenom=' +
      encodeURIComponent(m.prenom) +
      '&nom=' +
      encodeURIComponent(m.nom)
    setErreur('')
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(lien)
      } else {
        const zone = document.createElement('textarea')
        zone.value = lien
        document.body.appendChild(zone)
        zone.select()
        document.execCommand('copy')
        document.body.removeChild(zone)
      }
      setMessage('Lien de la carte copié pour ' + m.prenom + ' ' + m.nom + '. Envoie-le lui par WhatsApp.')
    } catch {
      setErreur('Impossible de copier le lien. Copie-le à la main : ' + lien)
    }
  }

  const retirer = async (m) => {
    setErreur('')
    setMessage('')
    try {
      await api.cartesValider(m.id, false)
      setMessage('Paiement de la carte retiré pour ' + m.prenom + ' ' + m.nom + '.')
      charger(recherche)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    }
  }

  // Seulement ceux qui ont fait une demande de carte (ils ont payé et
  // déclaré leur paiement, le trésorier n'a plus qu'à valider), puis
  // les cartes déjà payées. Ceux qui n'ont pas encore demandé de carte
  // n'apparaissent pas ici.
  const declares = membres.filter((m) => !m.carte_payee && m.carte_paiement_declare)
  const payees = membres.filter((m) => m.carte_payee)

  const ligneMembre = (m, { grosBouton }) => (
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
        {grosBouton ? (
          <button
            type="button"
            className="bouton bouton-bleu"
            onClick={() => valider(m)}
            disabled={validationEnCours === m.id}
          >
            {validationEnCours === m.id ? 'Validation…' : 'Valider le paiement (1 000 FCFA)'}
          </button>
        ) : (
          <button type="button" className="bouton-discret" onClick={() => valider(m)}>
            Valider le paiement (1 000 FCFA)
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <h3>Cartes de membres</h3>
      <p>
        La carte coûte {formatMontant(PRIX_CARTE_FCFA)}. Le membre paie par Wave ou Orange Money au trésorier, puis il
        déclare son paiement sur la page « Ma carte de membre ». Ici, on ne voit que ceux qui ont fait une demande de
        carte : valide-les directement, ils pourront ensuite télécharger leur carte avec leur QR code. Pour chaque
        carte payée, tu peux aussi copier le lien de sa carte et le lui envoyer par WhatsApp : il n’aura qu’à cliquer
        dessus pour la télécharger, sans rien taper.
      </p>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="stats">
        <div className="stat">
          <div className="nombre">{declares.length}</div>
          <div className="libelle">demande(s) de carte à valider</div>
        </div>
        <div className="stat">
          <div className="nombre">{payees.length}</div>
          <div className="libelle">carte(s) payée(s)</div>
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
          <h3>Paiements déclarés – à valider ({declares.length})</h3>
          {declares.length === 0 && (
            <p className="vide">
              Aucune demande de carte pour le moment. Quand un membre paie et déclare son paiement sur la page « Ma
              carte de membre », sa demande apparaît ici.
            </p>
          )}
          {declares.map((m) => ligneMembre(m, { grosBouton: true }))}

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
                <button type="button" className="bouton-discret" onClick={() => copierLien(m)}>
                  Copier le lien de la carte
                </button>
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
