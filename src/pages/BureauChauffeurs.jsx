import { useEffect, useState } from 'react'
import { normaliserTelephone } from '../data.js'
import { api } from '../api.js'

export default function BureauChauffeurs() {
  const [chauffeurs, setChauffeurs] = useState([])
  const [recherche, setRecherche] = useState('')
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '' })

  const charger = async (q = recherche) => {
    setErreur('')
    try {
      const data = await api.chauffeurs(q)
      setChauffeurs(data.chauffeurs || [])
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les chauffeurs.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const delai = setTimeout(() => charger(recherche), 300)
    return () => clearTimeout(delai)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche])

  const changer = (cle) => (e) => setForm({ ...form, [cle]: e.target.value })

  const ajouter = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    setEnvoi(true)
    try {
      await api.ajouterChauffeur({ ...form, telephone: normaliserTelephone(form.telephone) })
      setMessage('Chauffeur ajouté : ' + form.prenom + ' ' + form.nom + '.')
      setForm({ prenom: '', nom: '', telephone: '' })
      setFormulaireOuvert(false)
      charger(recherche)
    } catch (err) {
      setErreur(err.message || 'Impossible d’ajouter ce chauffeur.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div>
      <h3>Annuaire des chauffeurs</h3>
      <p>
        Tous les chauffeurs déjà utilisés par l’amicale. Quand tu crées une nouvelle caravane, tu peux choisir
        un chauffeur ici au lieu de chercher son numéro. Recherche par nom ou par numéro.
      </p>

      <div className="recherche">
        <label htmlFor="recherche-chauffeur" style={{ display: 'none' }}>
          Rechercher un chauffeur par son nom ou son numéro
        </label>
        <input
          id="recherche-chauffeur"
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un chauffeur par son nom ou son numéro…"
        />
      </div>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <button
        type="button"
        className="bouton bouton-bleu"
        onClick={() => setFormulaireOuvert(!formulaireOuvert)}
      >
        {formulaireOuvert ? 'Fermer le formulaire' : 'Ajouter un chauffeur'}
      </button>

      {formulaireOuvert && (
        <form className="formulaire" onSubmit={ajouter}>
          <h3>Nouveau chauffeur</h3>
          <div className="grille-champs">
            <div className="champ">
              <label htmlFor="c-prenom">Prénom</label>
              <input id="c-prenom" value={form.prenom} onChange={changer('prenom')} required />
            </div>
            <div className="champ">
              <label htmlFor="c-nom">Nom</label>
              <input id="c-nom" value={form.nom} onChange={changer('nom')} required />
            </div>
            <div className="champ">
              <label htmlFor="c-tel">Numéro de téléphone</label>
              <input id="c-tel" type="tel" value={form.telephone} onChange={changer('telephone')} required />
            </div>
          </div>
          <button type="submit" className="bouton bouton-plein" disabled={envoi}>
            {envoi ? 'Ajout…' : 'Ajouter ce chauffeur'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 20 }}>
        {charge && <p className="chargement">Chargement…</p>}
        {!charge && chauffeurs.length === 0 && (
          <p className="vide">
            {recherche ? 'Aucun chauffeur trouvé pour cette recherche.' : 'Aucun chauffeur enregistré pour le moment.'}
          </p>
        )}
        {!charge &&
          chauffeurs.map((c) => (
            <div className="rangee" key={c.id}>
              <div className="nom">
                {c.prenom} {c.nom} {c.exemple && <span className="badge badge-exemple">Exemple</span>}
              </div>
              <div className="details">
                <a href={'tel:' + String(c.telephone).replace(/\s/g, '')}>{c.telephone}</a>
              </div>
            </div>
          ))}
        {!charge && chauffeurs.length > 0 && (
          <p className="compteurs">
            <span>
              <strong>{chauffeurs.length}</strong> chauffeur(s) enregistré(s)
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
