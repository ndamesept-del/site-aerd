import { useEffect, useState } from 'react'
import { FILIERES, NIVEAUX, ORIGINES, normaliserTelephone } from '../data.js'
import { api } from '../api.js'

export default function BureauMembres() {
  const [membres, setMembres] = useState([])
  const [recherche, setRecherche] = useState('')
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    telephone_parent: '',
    ufr_departement: '',
    niveau: '',
    origine: ''
  })

  const charger = async (q = recherche) => {
    setErreur('')
    try {
      const data = await api.membres(q)
      setMembres(data.membres || [])
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les membres.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recherche à chaque frappe (premières lettres du nom)
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
      await api.ajouterMembre({
        ...form,
        telephone: normaliserTelephone(form.telephone),
        telephone_parent: normaliserTelephone(form.telephone_parent)
      })
      setMessage('Membre ajouté : ' + form.prenom + ' ' + form.nom + '.')
      setForm({ prenom: '', nom: '', telephone: '', telephone_parent: '', ufr_departement: '', niveau: '', origine: '' })
      setFormulaireOuvert(false)
      charger(recherche)
    } catch (err) {
      setErreur(err.message || 'Impossible d’ajouter ce membre.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div>
      <h3>Membres de l’amicale</h3>
      <p>
        Tape les premières lettres d’un nom ou un numéro de téléphone pour retrouver un membre. Pour ajouter un
        membre, utilise le formulaire ci-dessous.
      </p>

      <div className="recherche">
        <label htmlFor="recherche-membre" style={{ display: 'none' }}>
          Rechercher un membre par son nom ou son numéro
        </label>
        <input
          id="recherche-membre"
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un membre par son nom ou son numéro…"
        />
      </div>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <button
        type="button"
        className="bouton bouton-bleu"
        onClick={() => setFormulaireOuvert(!formulaireOuvert)}
      >
        {formulaireOuvert ? 'Fermer le formulaire' : 'Ajouter un membre'}
      </button>

      {formulaireOuvert && (
        <form className="formulaire" onSubmit={ajouter}>
          <h3>Nouveau membre</h3>
          <div className="grille-champs">
            <div className="champ">
              <label htmlFor="m-prenom">Prénom</label>
              <input id="m-prenom" value={form.prenom} onChange={changer('prenom')} required />
            </div>
            <div className="champ">
              <label htmlFor="m-nom">Nom</label>
              <input id="m-nom" value={form.nom} onChange={changer('nom')} required />
            </div>
            <div className="champ">
              <label htmlFor="m-tel">Numéro de téléphone</label>
              <input id="m-tel" type="tel" value={form.telephone} onChange={changer('telephone')} required />
            </div>
            <div className="champ">
              <label htmlFor="m-tel-parent">Numéro de téléphone d’un parent (en cas d’urgence)</label>
              <input id="m-tel-parent" type="tel" value={form.telephone_parent} onChange={changer('telephone_parent')} />
              <p className="aide">Pour la commission sociale, si quelque chose arrive à l’étudiant.</p>
            </div>
            <div className="champ">
              <label htmlFor="m-filiere">UFR ou département</label>
              <select id="m-filiere" value={form.ufr_departement} onChange={changer('ufr_departement')} required>
                <option value="">Choisir…</option>
                {FILIERES.map((f) => (
                  <option key={f.court} value={f.court}>
                    {f.court} — {f.long}
                  </option>
                ))}
              </select>
            </div>
            <div className="champ">
              <label htmlFor="m-niveau">Niveau</label>
              <select id="m-niveau" value={form.niveau} onChange={changer('niveau')} required>
                <option value="">Choisir…</option>
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="champ">
              <label htmlFor="m-origine">Origine</label>
              <select id="m-origine" value={form.origine} onChange={changer('origine')} required>
                <option value="">Choisir…</option>
                {ORIGINES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="bouton bouton-plein" disabled={envoi}>
            {envoi ? 'Ajout…' : 'Ajouter ce membre'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 20 }}>
        {charge && <p className="chargement">Chargement…</p>}
        {!charge && membres.length === 0 && (
          <p className="vide">
            {recherche ? 'Aucun membre trouvé pour cette recherche.' : 'Aucun membre enregistré pour le moment.'}
          </p>
        )}
        {!charge &&
          membres.map((m) => (
            <div className="rangee" key={m.id}>
              <div className="nom">
                {m.prenom} {m.nom} {m.exemple && <span className="badge badge-exemple">Exemple</span>}
              </div>
              <div className="details">
                <a href={'tel:' + String(m.telephone).replace(/\s/g, '')}>{m.telephone}</a>
                {' · '}
                {m.ufr_departement} · {m.niveau} · {m.origine}
              </div>
              {m.telephone_parent && <div className="details">Parent (urgence) : {m.telephone_parent}</div>}
            </div>
          ))}
        {!charge && membres.length > 0 && (
          <p className="compteurs">
            <span>
              <strong>{membres.length}</strong> membre(s) affiché(s)
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
