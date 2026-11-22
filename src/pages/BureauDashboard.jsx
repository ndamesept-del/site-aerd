import { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function BureauDashboard({ allerOnglet }) {
  const [stats, setStats] = useState(null)
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [travail, setTravail] = useState(false)

  const charger = async () => {
    try {
      const data = await api.stats()
      setStats(data)
    } catch (err) {
      setErreur(err.message || 'Impossible de charger le tableau de bord.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const gererExemples = async (action) => {
    setMessage('')
    setTravail(true)
    try {
      await api.exemples(action)
      setMessage(
        action === 'charger'
          ? 'Données d’exemple ajoutées (3 membres, 1 chauffeur, 1 caravane). Elles sont marquées « Exemple » et tu peux les supprimer ensuite.'
          : 'Données d’exemple supprimées.'
      )
      charger()
    } catch (err) {
      setMessage('')
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setTravail(false)
    }
  }

  if (charge) return <p className="chargement">Chargement…</p>
  if (erreur) return <p className="message-erreur">{erreur}</p>
  if (!stats) return null

  return (
    <div>
      <h3>Bienvenue, bureau AERD</h3>
      <p>Voici la situation de l’amicale en un coup d’œil.</p>

      <div className="stats">
        <div className="stat">
          <div className="nombre">{stats.membres}</div>
          <div className="libelle">membre(s) enregistré(s)</div>
        </div>
        <div className="stat">
          <div className="nombre">{stats.chauffeurs}</div>
          <div className="libelle">chauffeur(s) dans l’annuaire</div>
        </div>
        <div className="stat">
          <div className="nombre">{stats.caravanes}</div>
          <div className="libelle">caravane(s) créée(s)</div>
        </div>
        <div className="stat">
          <div className="nombre">{stats.paiements_en_attente}</div>
          <div className="libelle">paiement(s) en attente</div>
        </div>
      </div>

      {message && <p className="message-ok">{message}</p>}

      <h3>Pour commencer</h3>
      <ul className="liste-simple">
        <li>
          <strong>Ajoute les membres</strong> dans l’onglet « Membres », ou laisse-les s’inscrire par le formulaire
          en ligne, puis ajoute-les ici.
        </li>
        <li>
          <strong>Crée une caravane</strong> dans l’onglet « Caravanes » : date, destination, chauffeur et numéro
          Wave du responsable. Les membres s’inscrivent ensuite tout seuls sur le site.
        </li>
        <li>
          <strong>Vérifie les paiements</strong> : quand un membre a payé par Wave, coche « Payé » sur son
          inscription. Si quelqu’un se désiste, retire-le de la liste.
        </li>
      </ul>

      <div className="actions">
        <button type="button" className="bouton bouton-bleu" onClick={() => allerOnglet('caravanes')}>
          Créer une caravane
        </button>
        <button type="button" className="bouton bouton-secondaire" onClick={() => allerOnglet('membres')}>
          Ajouter un membre
        </button>
      </div>

      <div className="carte" style={{ marginTop: 24 }}>
        <h3>Données d’exemple (pour tester seulement)</h3>
        <p>
          Pour essayer le site sans mettre de vraies données, tu peux charger des exemples fictifs : 3 membres,
          1 chauffeur et 1 caravane vers Diourbel. Ils sont marqués « Exemple » partout, et tu peux les supprimer
          d’un clic quand tu as fini de tester.
        </p>
        <div className="actions">
          <button type="button" className="bouton-discret" disabled={travail} onClick={() => gererExemples('charger')}>
            Charger des exemples
          </button>
          <button
            type="button"
            className="bouton-discret bouton-danger"
            disabled={travail}
            onClick={() => gererExemples('supprimer')}
          >
            Supprimer les exemples
          </button>
        </div>
      </div>
    </div>
  )
}
