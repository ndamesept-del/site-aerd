import { useEffect, useState } from 'react'
import { formatDate, formatMontant } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

// Budget de l'amicale (président et trésorier seulement, mot de passe
// séparé) : en haut, le solde de la caisse et les entrées calculées
// toutes seules (cotisations payées, cartes payées, places de caravane
// payées). En dessous, les dépenses que le bureau note lui-même : date,
// motif, catégorie, montant. On peut ajouter une dépense ou en supprimer
// une si on s'est trompé.
const CATEGORIES_DEPENSE = ['Carburant', 'Chauffeur', 'Aide sociale', 'Impression', 'Événement', 'Autre']

function dateAujourdhui() {
  return new Date().toISOString().slice(0, 10)
}

export default function BureauBudget({ onAccesRefuse }) {
  const [donnees, setDonnees] = useState(null)
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [date, setDate] = useState(dateAujourdhui())
  const [libelle, setLibelle] = useState('')
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState('Autre')
  const [ajoutEnCours, setAjoutEnCours] = useState(false)
  const [aSupprimer, setASupprimer] = useState(null)

  const charger = async () => {
    setCharge(true)
    setErreur('')
    try {
      const data = await api.budget()
      setDonnees(data)
    } catch (err) {
      if (err.status === 401 && onAccesRefuse) {
        onAccesRefuse()
        return
      }
      setErreur(err.message || 'Impossible de charger le budget.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ajouter = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    const montantNombre = Number(montant)
    if (!libelle.trim()) {
      setErreur('Écris le motif de la dépense, par exemple « Carburant pour la caravane du 29 novembre ».')
      return
    }
    if (!Number.isInteger(montantNombre) || montantNombre <= 0) {
      setErreur('Le montant doit être un nombre entier supérieur à 0.')
      return
    }
    setAjoutEnCours(true)
    try {
      await api.ajouterDepense({ date, libelle: libelle.trim(), montant_fcfa: montantNombre, categorie })
      setMessage('Dépense ajoutée.')
      setLibelle('')
      setMontant('')
      setCategorie('Autre')
      charger()
    } catch (err) {
      if (err.status === 401 && onAccesRefuse) {
        onAccesRefuse()
        return
      }
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setAjoutEnCours(false)
    }
  }

  const confirmerSuppression = async () => {
    if (!aSupprimer) return
    setErreur('')
    setMessage('')
    try {
      await api.supprimerDepense(aSupprimer.id)
      setMessage('Dépense supprimée.')
      setASupprimer(null)
      charger()
    } catch (err) {
      if (err.status === 401 && onAccesRefuse) {
        onAccesRefuse()
        return
      }
      setErreur(err.message || 'Une erreur est survenue.')
      setASupprimer(null)
    }
  }

  const entrees = donnees?.entrees || { cotisations: 0, cartes: 0, caravanes: 0, total: 0 }
  const depenses = donnees?.depenses || []

  return (
    <div>
      <h3>Budget de l’amicale</h3>
      <p>
        Ici, on voit l’argent de l’amicale : ce qui entre et ce qui sort. Les entrées sont calculées toutes
        seules à partir de ce que le site connaît déjà. Les sorties, c’est vous qui les notez, une par une.
      </p>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      {charge && <p className="chargement">Chargement…</p>}
      {!charge && donnees && (
        <>
          <div className="stats">
            <div className="stat">
              <div className="nombre">{formatMontant(entrees.total)}</div>
              <div className="libelle">entrées au total</div>
            </div>
            <div className="stat">
              <div className="nombre">{formatMontant(donnees.total_depenses)}</div>
              <div className="libelle">sorties au total</div>
            </div>
            <div className="stat">
              <div className="nombre">{formatMontant(donnees.solde)}</div>
              <div className="libelle">solde de la caisse</div>
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>Ce qui entre</h3>
          <div className="rangee">
            <div className="nom">Cotisations (500 FCFA par membre payé)</div>
            <div>{formatMontant(entrees.cotisations)}</div>
          </div>
          <div className="rangee">
            <div className="nom">Cartes de membres (1 000 FCFA par carte payée)</div>
            <div>{formatMontant(entrees.cartes)}</div>
          </div>
          <div className="rangee">
            <div className="nom">Caravanes (places payées)</div>
            <div>{formatMontant(entrees.caravanes)}</div>
          </div>
          <p className="aide">
            Les places de caravane sont comptées au prix affiché de la caravane.
          </p>

          <h3 style={{ marginTop: 20 }}>Ajouter une dépense</h3>
          <form className="formulaire" onSubmit={ajouter}>
            <div className="grille-champs">
              <div className="champ">
                <label htmlFor="depense-date">Date</label>
                <input id="depense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="champ">
                <label htmlFor="depense-categorie">Catégorie</label>
                <select id="depense-categorie" value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                  {CATEGORIES_DEPENSE.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="champ">
                <label htmlFor="depense-montant">Montant (FCFA)</label>
                <input
                  id="depense-montant"
                  type="number"
                  min="1"
                  step="1"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex : 15000"
                  required
                />
              </div>
            </div>
            <div className="champ">
              <label htmlFor="depense-libelle">Motif de la dépense</label>
              <input
                id="depense-libelle"
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Ex : Carburant pour la caravane du 29 novembre"
                maxLength={120}
                required
              />
            </div>
            <div className="actions">
              <button type="submit" className="bouton bouton-bleu" disabled={ajoutEnCours}>
                {ajoutEnCours ? 'Ajout…' : 'Ajouter cette dépense'}
              </button>
            </div>
          </form>

          <h3 style={{ marginTop: 20 }}>Dépenses ({depenses.length})</h3>
          {depenses.length === 0 && <p className="vide">Aucune dépense notée pour le moment.</p>}
          {depenses.map((d) => (
            <div className="rangee" key={d.id}>
              <div className="nom">
                {formatDate(d.date)} — {d.libelle}{' '}
                <span className="badge">{d.categorie}</span>
              </div>
              <div>
                {formatMontant(d.montant_fcfa)}{' '}
                <button type="button" className="bouton-discret bouton-danger" onClick={() => setASupprimer(d)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {aSupprimer && (
        <Modale titre="Supprimer cette dépense ?" onFermer={() => setASupprimer(null)}>
          <p>
            <strong>{aSupprimer.libelle}</strong> — {formatMontant(aSupprimer.montant_fcfa)} —{' '}
            {formatDate(aSupprimer.date)}.
          </p>
          <p>La dépense sera retirée du budget, et le solde sera recalculé.</p>
          <div className="actions">
            <button type="button" className="bouton bouton-bleu" onClick={confirmerSuppression}>
              Oui, supprimer
            </button>{' '}
            <button type="button" className="bouton-discret" onClick={() => setASupprimer(null)}>
              Annuler
            </button>
          </div>
        </Modale>
      )}
    </div>
  )
}
