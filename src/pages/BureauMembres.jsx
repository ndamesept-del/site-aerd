import { useEffect, useState } from 'react'
import { FILIERES, NIVEAUX, ORIGINES, normaliserTelephone } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

function FormulaireMembre({ membre, onAjoute, onAnnuler }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    prenom: membre ? membre.prenom : '',
    nom: membre ? membre.nom : '',
    telephone: membre ? membre.telephone : '',
    telephone_parent: membre ? membre.telephone_parent || '' : '',
    ufr_departement: membre ? membre.ufr_departement : '',
    niveau: membre ? membre.niveau : '',
    origine: membre ? membre.origine : '',
    // '' = non renseigné, 'oui' = boursier, 'non' = non boursier
    boursier: membre ? (membre.boursier === true ? 'oui' : membre.boursier === false ? 'non' : '') : ''
  })

  const changer = (cle) => (e) => setForm({ ...form, [cle]: e.target.value })

  const enregistrer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const donnees = {
        ...form,
        telephone: normaliserTelephone(form.telephone),
        telephone_parent: normaliserTelephone(form.telephone_parent),
        boursier: form.boursier === 'oui' ? true : form.boursier === 'non' ? false : null
      }
      if (membre) {
        await api.modifierMembre({ ...donnees, id: membre.id })
      } else {
        await api.ajouterMembre(donnees)
      }
      onAjoute(form.prenom + ' ' + form.nom)
    } catch (err) {
      setErreur(err.message || 'Impossible d’enregistrer ce membre.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={enregistrer}>
      {erreur && <p className="message-erreur">{erreur}</p>}
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
        <div className="champ">
          <label htmlFor="m-boursier">Boursier ?</label>
          <select id="m-boursier" value={form.boursier} onChange={changer('boursier')}>
            <option value="">Non renseigné</option>
            <option value="oui">Boursier</option>
            <option value="non">Non boursier</option>
          </select>
          <p className="aide">
            Pour les dons de tickets, les non-boursiers sont prioritaires. Si tu ne sais pas, laisse
            « Non renseigné ».
          </p>
        </div>
      </div>
      <div className="actions">
        <button type="submit" className="bouton bouton-plein" disabled={envoi}>
          {envoi ? 'Enregistrement…' : membre ? 'Enregistrer les modifications' : 'Ajouter ce membre'}
        </button>
        <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    </form>
  )
}

export default function BureauMembres() {
  const [membres, setMembres] = useState([])
  const [recherche, setRecherche] = useState('')
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [modaleOuverte, setModaleOuverte] = useState(false)
  // Membre en cours de modification (null = pas de modification en cours)
  const [membreAModifier, setMembreAModifier] = useState(null)

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

  const apresAjout = (nomComplet) => {
    setMessage('Membre enregistré : ' + nomComplet + '.')
    setModaleOuverte(false)
    setMembreAModifier(null)
    charger(recherche)
  }

  // Carte de membre (1000 FCFA) : le membre paie par Wave ou Orange Money
  // au trésorier, le bureau confirme ici. Le numéro de carte est attribué
  // tout seul (AERD-2026-001, ...).
  const marquerCarte = async (m, payee) => {
    setErreur('')
    setMessage('')
    try {
      await api.marquerCartePayee(m.id, payee)
      setMessage(
        payee
          ? 'Carte de membre payée pour ' + m.prenom + ' ' + m.nom + ' : il peut télécharger sa carte.'
          : 'Paiement de la carte retiré pour ' + m.prenom + ' ' + m.nom + '.'
      )
      charger(recherche)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    }
  }

  return (
    <div>
      <h3>Membres de l’amicale</h3>
      <p>
        Tape les premières lettres d’un nom ou un numéro de téléphone pour retrouver un membre. Pour ajouter un
        membre, utilise le bouton ci-dessous.
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

      <div className="actions">
        <button type="button" className="bouton bouton-bleu" onClick={() => setModaleOuverte(true)}>
          Ajouter un membre
        </button>
      </div>

      {modaleOuverte && (
        <Modale titre="Nouveau membre" onFermer={() => setModaleOuverte(false)}>
          <FormulaireMembre onAjoute={apresAjout} onAnnuler={() => setModaleOuverte(false)} />
        </Modale>
      )}

      {membreAModifier && (
        <Modale
          titre={'Modifier ' + membreAModifier.prenom + ' ' + membreAModifier.nom}
          onFermer={() => setMembreAModifier(null)}
        >
          <FormulaireMembre
            membre={membreAModifier}
            onAjoute={apresAjout}
            onAnnuler={() => setMembreAModifier(null)}
          />
        </Modale>
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
                {m.prenom} {m.nom} {m.exemple && <span className="badge badge-exemple">Exemple</span>}{' '}
                {m.boursier === true ? (
                  <span className="badge badge-inscrit">Boursier</span>
                ) : m.boursier === false ? (
                  <span className="badge badge-prioritaire">Non boursier</span>
                ) : (
                  <span className="badge badge-desiste">Non renseigné</span>
                )}
              </div>
              <div className="details">
                <a href={'tel:' + String(m.telephone).replace(/\s/g, '')}>{m.telephone}</a>
                {' · '}
                {m.ufr_departement} · {m.niveau} · {m.origine}
              </div>
              {m.telephone_parent && <div className="details">Parent (urgence) : {m.telephone_parent}</div>}
              <div className="details">
                Carte de membre : {m.numero_carte || 'pas encore de numéro'} ·{' '}
                {m.carte_payee ? (
                  <span className="badge badge-paye">Payée</span>
                ) : (
                  <span className="badge badge-inscrit">Non payée</span>
                )}
              </div>
              <div className="actions-ligne">
                <button type="button" className="bouton-discret" onClick={() => setMembreAModifier(m)}>
                  Modifier
                </button>
                {m.carte_payee ? (
                  <button
                    type="button"
                    className="bouton-discret bouton-danger"
                    onClick={() => marquerCarte(m, false)}
                  >
                    Retirer le paiement de la carte
                  </button>
                ) : (
                  <button type="button" className="bouton-discret" onClick={() => marquerCarte(m, true)}>
                    Marquer « Carte payée » (1000 FCFA)
                  </button>
                )}
              </div>
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
