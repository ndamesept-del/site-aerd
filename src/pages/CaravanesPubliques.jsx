import { useEffect, useState } from 'react'
import { formatDate, formatHeure, desistementOuvert, normaliserTelephone } from '../data.js'
import { api } from '../api.js'

function FormulaireInscription({ caravane, onTermine, onAnnuler }) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await api.inscrire({
        caravane_id: caravane.id,
        prenom,
        nom,
        telephone: normaliserTelephone(telephone)
      })
      onTermine({ prenom, nom })
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue. Réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={envoyer}>
      <h3>S’inscrire à la caravane de {caravane.destination}</h3>
      {erreur && <p className="message-erreur">{erreur}</p>}
      <div className="champ">
        <label htmlFor={'prenom-' + caravane.id}>Prénom</label>
        <input
          id={'prenom-' + caravane.id}
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          autoComplete="given-name"
          required
        />
      </div>
      <div className="champ">
        <label htmlFor={'nom-' + caravane.id}>Nom</label>
        <input
          id={'nom-' + caravane.id}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          autoComplete="family-name"
          required
        />
      </div>
      <div className="champ">
        <label htmlFor={'tel-' + caravane.id}>Numéro de téléphone</label>
        <input
          id={'tel-' + caravane.id}
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          autoComplete="tel"
          placeholder="Ex : 77 000 00 00"
          required
        />
        <p className="aide">Ton numéro sert à te retrouver dans la liste des inscrits.</p>
      </div>
      <div className="actions">
        <button type="submit" className="bouton bouton-plein" disabled={envoi}>
          {envoi ? 'Enregistrement…' : 'Confirmer mon inscription'}
        </button>
        <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    </form>
  )
}

function FormulaireDesistement({ caravane, onTermine, onAnnuler }) {
  const [telephone, setTelephone] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await api.desister({ caravane_id: caravane.id, telephone: normaliserTelephone(telephone) })
      onTermine()
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue. Réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={envoyer}>
      <h3>Se désister de la caravane de {caravane.destination}</h3>
      <p>Si tu ne peux plus venir, annule ton inscription ici. Ta place se libère pour quelqu’un d’autre.</p>
      {erreur && <p className="message-erreur">{erreur}</p>}
      <div className="champ">
        <label htmlFor={'tel-des-' + caravane.id}>Ton numéro de téléphone</label>
        <input
          id={'tel-des-' + caravane.id}
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          autoComplete="tel"
          placeholder="Le numéro utilisé pour t’inscrire"
          required
        />
      </div>
      <div className="actions">
        <button type="submit" className="bouton bouton-plein" disabled={envoi}>
          {envoi ? 'Annulation…' : 'Annuler mon inscription'}
        </button>
        <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={onAnnuler}>
          Garder mon inscription
        </button>
      </div>
    </form>
  )
}

function CarteCaravane({ caravane, recharger }) {
  const [mode, setMode] = useState(null) // null | 'inscrire' | 'desister'
  const [confirmation, setConfirmation] = useState(null) // { type, texte }

  // Règle : plus de désistement quand il reste moins de 24 h avant le départ.
  const desistementPossible = desistementOuvert(caravane)

  const apresInscription = ({ prenom }) => {
    setMode(null)
    setConfirmation({
      type: 'inscription',
      texte:
        'Merci ' +
        prenom +
        ', ton inscription est bien enregistrée pour la caravane de ' +
        caravane.destination +
        '.'
    })
    recharger()
  }

  const apresDesistement = () => {
    setMode(null)
    setConfirmation({ type: 'desistement', texte: 'Ton inscription est annulée. Ta place est libérée.' })
    recharger()
  }

  return (
    <article className="carte carte-caravane">
      <h3>{caravane.destination}</h3>
      <p className="date">
        {formatDate(caravane.date_depart)} à {formatHeure(caravane.heure_depart)}
      </p>

      {caravane.chauffeur ? (
        <p className="ligne">
          <span className="etiquette">Chauffeur :</span> {caravane.chauffeur.prenom} {caravane.chauffeur.nom} —{' '}
          <a href={'tel:' + caravane.chauffeur.telephone.replace(/\s/g, '')}>{caravane.chauffeur.telephone}</a>
        </p>
      ) : (
        <p className="ligne">
          <span className="etiquette">Chauffeur :</span> pas encore désigné
        </p>
      )}

      <p className="compteurs">
        <span>
          <strong>{caravane.inscrits}</strong> inscrit(s)
        </span>
        <span>
          <strong>{caravane.payes}</strong> payé(s)
        </span>
      </p>

      <div className="encart-wave">
        <div>Pour payer ta place, envoie le montant par Wave au responsable :</div>
        <div className="numero">
          <a href={'tel:' + caravane.numero_wave_responsable.replace(/\s/g, '')}>
            {caravane.numero_wave_responsable}
          </a>
        </div>
        <div>Le bureau confirmera ton paiement après vérification.</div>
      </div>

      {confirmation && <p className="message-ok">{confirmation.texte}</p>}

      {mode === null && (
        <div className="actions">
          <button type="button" className="bouton bouton-plein" onClick={() => setMode('inscrire')}>
            S’inscrire à cette caravane
          </button>
          {desistementPossible ? (
            <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={() => setMode('desister')}>
              Se désister
            </button>
          ) : (
            <p className="aide">
              Les désistements sont fermés : la caravane part dans moins de 24 heures. Contacte le bureau si tu as
              un problème.
            </p>
          )}
        </div>
      )}

      {mode === 'inscrire' && (
        <FormulaireInscription caravane={caravane} onTermine={apresInscription} onAnnuler={() => setMode(null)} />
      )}
      {mode === 'desister' && (
        <FormulaireDesistement caravane={caravane} onTermine={apresDesistement} onAnnuler={() => setMode(null)} />
      )}
    </article>
  )
}

export default function CaravanesPubliques() {
  const [caravanes, setCaravanes] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = async () => {
    setErreur('')
    try {
      const data = await api.caravanesPubliques()
      setCaravanes(data.caravanes || [])
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les caravanes.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  return (
    <div className="conteneur">
      <section className="section">
        <h2>Les caravanes de l’amicale</h2>
        <p className="intro">
          Le bureau crée la caravane, et tu t’inscris toi-même ici. Tu paies par Wave au numéro du responsable,
          et le bureau confirme ton paiement. Si tu ne peux plus venir, désiste-toi pour libérer ta place.
          <br />
          Règle : on ne peut plus se désister quand il reste moins de 24 heures avant le départ, pour ne pas
          retarder la caravane.
        </p>

        {charge && <p className="chargement">Chargement des caravanes…</p>}
        {erreur && <p className="message-erreur">{erreur}</p>}

        {!charge && !erreur && caravanes.length === 0 && (
          <p className="vide">
            Aucune caravane n’est programmée pour le moment.
            <br />
            Les prochaines dates seront annoncées ici par le bureau de l’amicale.
          </p>
        )}

        {!charge &&
          caravanes.map((c) => <CarteCaravane key={c.id} caravane={c} recharger={charger} />)}
      </section>
    </div>
  )
}
