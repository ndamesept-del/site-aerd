import { useEffect, useState } from 'react'
import { POSTES_BUREAU } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

// Redimensionne une photo dans le navigateur : 400 px maximum,
// JPEG qualité 0,8. La photo est ensuite enregistrée dans la base
// comme une petite image (data URI), sans aucun service externe.
function redimensionnerPhoto(fichier) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onerror = () => reject(new Error('Impossible de lire cette photo.'))
    lecteur.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Ce fichier n’est pas une image.'))
      image.onload = () => {
        const max = 400
        let largeur = image.naturalWidth
        let hauteur = image.naturalHeight
        if (largeur > max || hauteur > max) {
          const ratio = Math.min(max / largeur, max / hauteur)
          largeur = Math.round(largeur * ratio)
          hauteur = Math.round(hauteur * ratio)
        }
        const toile = document.createElement('canvas')
        toile.width = largeur
        toile.height = hauteur
        toile.getContext('2d').drawImage(image, 0, 0, largeur, hauteur)
        resolve(toile.toDataURL('image/jpeg', 0.8))
      }
      image.src = lecteur.result
    }
    lecteur.readAsDataURL(fichier)
  })
}

function initiales(prenom, nom) {
  const lettres = (String(prenom || '').trim().charAt(0) + String(nom || '').trim().charAt(0)).toUpperCase()
  return lettres || '?'
}

function FormulaireBureau({ membre, onTermine, onAnnuler }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    prenom: membre ? membre.prenom : '',
    nom: membre ? membre.nom : '',
    poste: membre ? membre.poste : '',
    telephone: membre ? membre.telephone || '' : '',
    ordre: membre ? String(membre.ordre) : '',
    photo: membre ? membre.photo || '' : ''
  })

  const changer = (cle) => (e) => setForm({ ...form, [cle]: e.target.value })

  const choisirPhoto = async (e) => {
    const fichier = e.target.files && e.target.files[0]
    if (!fichier) return
    setErreur('')
    try {
      const dataUri = await redimensionnerPhoto(fichier)
      setForm((ancien) => ({ ...ancien, photo: dataUri }))
    } catch (err) {
      setErreur(err.message || 'Impossible de lire cette photo.')
    }
    e.target.value = ''
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const donnees = {
        prenom: form.prenom,
        nom: form.nom,
        poste: form.poste,
        photo: form.photo,
        telephone: form.telephone,
        ordre: form.ordre === '' ? 0 : Number(form.ordre)
      }
      if (membre) await api.modifierBureau({ id: membre.id, ...donnees })
      else await api.ajouterBureau(donnees)
      onTermine(form.prenom + ' ' + form.nom)
    } catch (err) {
      setErreur(err.message || 'Impossible d’enregistrer ce membre du bureau.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={enregistrer}>
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="champ-photo">
        {form.photo ? (
          <img className="photo-bureau" src={form.photo} alt="Photo choisie" />
        ) : (
          <span className="initiales-bureau" aria-hidden="true">
            {initiales(form.prenom, form.nom)}
          </span>
        )}
        <div>
          <label className="bouton bouton-secondaire bouton-photo" htmlFor="b-photo">
            {form.photo ? 'Changer la photo' : 'Ajouter une photo'}
          </label>
          <input
            id="b-photo"
            type="file"
            accept="image/*"
            onChange={choisirPhoto}
            style={{ display: 'none' }}
          />
          {form.photo && (
            <button
              type="button"
              className="bouton-discret"
              onClick={() => setForm({ ...form, photo: '' })}
            >
              Retirer la photo
            </button>
          )}
          <p className="aide">
            Ta photo est enregistrée dans la base de données et s’affiche sur la page d’accueil.
          </p>
        </div>
      </div>

      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="b-prenom">Prénom</label>
          <input id="b-prenom" value={form.prenom} onChange={changer('prenom')} required />
        </div>
        <div className="champ">
          <label htmlFor="b-nom">Nom</label>
          <input id="b-nom" value={form.nom} onChange={changer('nom')} required />
        </div>
        <div className="champ">
          <label htmlFor="b-poste">Poste</label>
          <input
            id="b-poste"
            value={form.poste}
            onChange={changer('poste')}
            list="postes-bureau"
            placeholder="Ex : Président"
            required
          />
          <datalist id="postes-bureau">
            {POSTES_BUREAU.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <p className="aide">Choisis un poste dans la liste, ou écris-en un autre.</p>
        </div>
        <div className="champ">
          <label htmlFor="b-telephone">Numéro de téléphone</label>
          <input
            id="b-telephone"
            type="tel"
            value={form.telephone}
            onChange={changer('telephone')}
            placeholder="Ex : 77 936 03 11"
          />
          <p className="aide">Pour le président, ce numéro s’affiche sur la page d’accueil (contact du président).</p>
        </div>
        <div className="champ">
          <label htmlFor="b-ordre">Place dans l’organigramme</label>
          <input
            id="b-ordre"
            type="number"
            min="0"
            value={form.ordre}
            onChange={changer('ordre')}
            placeholder="1 pour le président"
          />
          <p className="aide">1 pour le président, puis 2, 3… dans l’ordre où ils s’affichent.</p>
        </div>
      </div>
      <div className="actions">
        <button type="submit" className="bouton bouton-plein" disabled={envoi}>
          {envoi ? 'Enregistrement…' : membre ? 'Enregistrer les changements' : 'Ajouter au bureau'}
        </button>
        <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    </form>
  )
}

export default function BureauOrganigramme() {
  const [membres, setMembres] = useState([])
  const [anciens, setAnciens] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  // null | { type: 'ajout' } | { type: 'modif', membre } | { type: 'supprimer', membre } | { type: 'ancien', membre }
  const [modale, setModale] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const charger = async () => {
    setErreur('')
    try {
      const data = await api.bureauListe()
      setMembres(data.bureau || [])
      setAnciens(data.anciens || [])
    } catch (err) {
      setErreur(err.message || 'Impossible de charger l’organigramme.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const apresEnregistrement = (nomComplet) => {
    setMessage('Organigramme mis à jour : ' + nomComplet + '.')
    setModale(null)
    charger()
  }

  const confirmerSuppression = async () => {
    if (!modale || modale.type !== 'supprimer') return
    setErreur('')
    setEnvoi(true)
    try {
      await api.supprimerBureau(modale.membre.id)
      setMessage(modale.membre.prenom + ' ' + modale.membre.nom + ' a été retiré(e) du bureau.')
      setModale(null)
      charger()
    } catch (err) {
      setErreur(err.message || 'Impossible de retirer ce membre du bureau.')
      setModale(null)
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerAncien = async () => {
    if (!modale || modale.type !== 'ancien') return
    setErreur('')
    setEnvoi(true)
    try {
      await api.passerAncien(modale.membre.id)
      setMessage(
        modale.membre.prenom +
          ' ' +
          modale.membre.nom +
          ' est maintenant dans les anciens membres du bureau. Sa photo a été supprimée pour libérer de l’espace.'
      )
      setModale(null)
      charger()
    } catch (err) {
      setErreur(err.message || 'Impossible de passer ce membre aux anciens.')
      setModale(null)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div>
      <h3>Organigramme du bureau</h3>
      <p>
        Voici les personnes qui dirigent l’amicale. Chacun met sa propre photo ici, elle s’affiche
        ensuite sur la page d’accueil, avec son nom et son poste. Quand le bureau change, passe un
        membre aux anciens : sa photo est supprimée pour libérer de l’espace, mais son nom et son
        poste restent affichés sur la page d’accueil.
      </p>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="actions">
        <button type="button" className="bouton bouton-bleu" onClick={() => setModale({ type: 'ajout' })}>
          Ajouter un membre du bureau
        </button>
      </div>

      {modale && modale.type !== 'supprimer' && (
        <Modale
          titre={modale.type === 'modif' ? 'Modifier un membre du bureau' : 'Nouveau membre du bureau'}
          onFermer={() => setModale(null)}
        >
          <FormulaireBureau
            membre={modale.type === 'modif' ? modale.membre : null}
            onTermine={apresEnregistrement}
            onAnnuler={() => setModale(null)}
          />
        </Modale>
      )}

      {modale && modale.type === 'supprimer' && (
        <Modale titre="Retirer du bureau" onFermer={() => setModale(null)}>
          <p>
            Retirer <strong>{modale.membre.prenom} {modale.membre.nom}</strong> ({modale.membre.poste}) du
            bureau ? Son nom et sa photo ne s’afficheront plus sur la page d’accueil.
          </p>
          <div className="actions">
            <button type="button" className="bouton bouton-plein bouton-danger" disabled={envoi} onClick={confirmerSuppression}>
              {envoi ? 'Suppression…' : 'Oui, retirer'}
            </button>
            <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={() => setModale(null)}>
              Annuler
            </button>
          </div>
        </Modale>
      )}

      {modale && modale.type === 'ancien' && (
        <Modale titre="Passer aux anciens" onFermer={() => setModale(null)}>
          <p>
            Passer <strong>{modale.membre.prenom} {modale.membre.nom}</strong> ({modale.membre.poste}) aux
            anciens membres du bureau ? Sa photo sera supprimée pour libérer de l’espace, mais son nom
            et son poste resteront affichés sur la page d’accueil, dans « Anciens membres du bureau ».
          </p>
          <div className="actions">
            <button type="button" className="bouton bouton-plein" disabled={envoi} onClick={confirmerAncien}>
              {envoi ? 'En cours…' : 'Oui, passer aux anciens'}
            </button>
            <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={() => setModale(null)}>
              Annuler
            </button>
          </div>
        </Modale>
      )}

      <div style={{ marginTop: 20 }}>
        {charge && <p className="chargement">Chargement…</p>}
        {!charge && membres.length === 0 && (
          <p className="vide">
            Personne dans l’organigramme pour le moment. Ajoute le président et les autres membres du bureau.
          </p>
        )}
        {!charge &&
          membres.map((m) => (
            <div className="rangee rangee-bureau" key={m.id}>
              {m.photo ? (
                <img className="photo-bureau" src={m.photo} alt={'Photo de ' + m.prenom + ' ' + m.nom} />
              ) : (
                <span className="initiales-bureau" aria-hidden="true">
                  {initiales(m.prenom, m.nom)}
                </span>
              )}
              <div className="rangee-bureau-texte">
                <div className="nom">
                  {m.prenom} {m.nom}
                </div>
                <div className="details">{m.poste}</div>
              </div>
              <div className="actions-ligne">
                <button
                  type="button"
                  className="bouton-discret"
                  onClick={() => setModale({ type: 'modif', membre: m })}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="bouton-discret"
                  onClick={() => setModale({ type: 'ancien', membre: m })}
                >
                  Passer aux anciens
                </button>
                <button
                  type="button"
                  className="bouton-discret bouton-danger"
                  onClick={() => setModale({ type: 'supprimer', membre: m })}
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        {!charge && membres.length > 0 && (
          <p className="compteurs">
            <span>
              <strong>{membres.length}</strong> membre(s) du bureau
            </span>
          </p>
        )}

        {!charge && anciens.length > 0 && (
          <div className="section-anciens">
            <h3>Anciens membres du bureau</h3>
            <p>
              Leurs noms et leurs postes restent affichés sur la page d’accueil, sans photo. Pour
              effacer définitivement un ancien membre, clique sur « Retirer ».
            </p>
            {anciens.map((m) => (
              <div className="rangee rangee-bureau" key={m.id}>
                <span className="initiales-bureau" aria-hidden="true">
                  {initiales(m.prenom, m.nom)}
                </span>
                <div className="rangee-bureau-texte">
                  <div className="nom">
                    {m.prenom} {m.nom}
                  </div>
                  <div className="details">{m.poste}</div>
                </div>
                <div className="actions-ligne">
                  <button
                    type="button"
                    className="bouton-discret bouton-danger"
                    onClick={() => setModale({ type: 'supprimer', membre: m })}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
            <p className="compteurs">
              <span>
                <strong>{anciens.length}</strong> ancien(s) membre(s) du bureau
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
