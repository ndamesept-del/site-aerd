import { useEffect, useState } from 'react'
import { MONTANT_COTISATION, formatMontant, normaliserTelephone } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

function FormulaireTicket({ don, onTermine, onAnnuler }) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  // Champ piège anti-spam (honeypot) : invisible pour une vraie
  // personne. Si un robot le remplit, le serveur refuse l'inscription.
  const [siteWeb, setSiteWeb] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const envoyer = async (e) => {
    e.preventDefault()
    setErreur('')
    const telPropre = normaliserTelephone(telephone)
    if (telPropre.replace(/\D/g, '').length < 9) {
      setErreur('Le numéro de téléphone semble incomplet. Vérifie-le et réessaie.')
      return
    }
    setEnvoi(true)
    try {
      await api.inscrireTicket({
        don_id: don.id,
        prenom,
        nom,
        telephone: telPropre,
        site_web: siteWeb
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
      {erreur && <p className="message-erreur">{erreur}</p>}
      <div className="champ">
        <label htmlFor={'ticket-prenom-' + don.id}>Prénom</label>
        <input
          id={'ticket-prenom-' + don.id}
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          autoComplete="given-name"
          required
        />
      </div>
      <div className="champ">
        <label htmlFor={'ticket-nom-' + don.id}>Nom</label>
        <input
          id={'ticket-nom-' + don.id}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          autoComplete="family-name"
          required
        />
      </div>
      <div className="champ">
        <label htmlFor={'ticket-tel-' + don.id}>Numéro de téléphone</label>
        <input
          id={'ticket-tel-' + don.id}
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          autoComplete="tel"
          placeholder="Ex : 77 000 00 00"
          required
        />
        <p className="aide">Ton numéro sert au bureau pour te retrouver et te dire où récupérer ton ticket.</p>
      </div>
      <div className="champ-piege" aria-hidden="true">
        <label htmlFor={'ticket-site-' + don.id}>Site web (laisse ce champ vide)</label>
        <input
          id={'ticket-site-' + don.id}
          value={siteWeb}
          onChange={(e) => setSiteWeb(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
        />
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

function CarteDon({ don, recharger }) {
  // null | 'inscrire' | 'inscription-ok'
  const [modale, setModale] = useState(null)
  const [prenomInscrit, setPrenomInscrit] = useState('')

  const apresInscription = ({ prenom }) => {
    setPrenomInscrit(prenom)
    setModale('inscription-ok')
    recharger()
  }

  const fermerModale = () => setModale(null)
  const plusDeTickets = don.tickets_restants <= 0

  return (
    <article className="carte carte-caravane">
      <h3>{don.titre}</h3>
      {don.description && <p className="details">{don.description}</p>}
      <p className="compteurs">
        <span>
          <strong>{don.nombre_tickets}</strong> ticket(s) au total
        </span>
        <span>
          <strong>{don.tickets_restants}</strong> restant(s)
        </span>
      </p>
      <p className="ligne">
        <span className="etiquette">Lieu de retrait :</span> {don.lieu_retrait}
      </p>

      <div className="actions">
        {plusDeTickets ? (
          <p className="banniere-ferme">
            <strong>Plus de tickets pour cette campagne.</strong> Le bureau annoncera les prochains dons
            sur WhatsApp.
          </p>
        ) : (
          <button type="button" className="bouton bouton-plein" onClick={() => setModale('inscrire')}>
            S’inscrire pour recevoir un ticket
          </button>
        )}
      </div>

      {modale === 'inscrire' && (
        <Modale titre={'S’inscrire pour un ticket — ' + don.titre} onFermer={fermerModale}>
          <FormulaireTicket don={don} onTermine={apresInscription} onAnnuler={fermerModale} />
        </Modale>
      )}

      {modale === 'inscription-ok' && (
        <Modale titre="Inscription confirmée" onFermer={fermerModale}>
          <p className="message-ok">
            Merci {prenomInscrit}, ta demande est bien enregistrée pour « {don.titre} ».
          </p>
          <p>
            Le bureau va regarder les demandes et choisir qui reçoit un ticket. Les non-boursiers sont
            prioritaires. Si tu reçois un ticket, le bureau te dira où le récupérer :{' '}
            <strong>{don.lieu_retrait}</strong>.
          </p>
          <div className="actions">
            <button type="button" className="bouton bouton-plein" onClick={fermerModale}>
              Fermer
            </button>
          </div>
        </Modale>
      )}
    </article>
  )
}

export default function CotisationsDons() {
  const [dons, setDons] = useState([])
  const [numeroTresorier, setNumeroTresorier] = useState('')
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = async () => {
    setErreur('')
    try {
      const [dataDons, dataParametres] = await Promise.all([api.donsPublics(), api.parametresPublics()])
      setDons(dataDons.dons || [])
      setNumeroTresorier(dataParametres.numero_wave_tresorier || '')
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les dons de tickets.')
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
        <h2>Cotisations et dons de tickets</h2>
        <p className="intro">
          Chaque mois, chaque membre de l’amicale cotise {formatMontant(MONTANT_COTISATION)} pour le volet
          social. Avec cet argent, le bureau donne des tickets aux étudiants qui en ont besoin.
        </p>

        <h3>La cotisation mensuelle</h3>
        <p>
          La cotisation est de <strong>{formatMontant(MONTANT_COTISATION)} par mois</strong> et par membre.
          Envoie ta cotisation par Wave ou Orange Money au numéro du trésorier, et le bureau confirmera
          ton paiement.
        </p>
        {numeroTresorier ? (
          <div className="encart-wave">
            <div>Envoie ta cotisation de {formatMontant(MONTANT_COTISATION)} par Wave ou Orange Money au trésorier :</div>
            <div className="numero">
              <a href={'tel:' + numeroTresorier.replace(/\s/g, '')}>{numeroTresorier}</a>
            </div>
            <div>Le bureau confirmera ton paiement après vérification.</div>
          </div>
        ) : (
          <p className="aide">Le bureau n’a pas encore indiqué le numéro du trésorier ici.</p>
        )}

        <h3 style={{ marginTop: 24 }}>Les dons de tickets</h3>
        <p>
          Quand le bureau lance une campagne de dons, il l’annonce sur WhatsApp. Si tu as besoin d’un
          ticket, inscris-toi ici : le bureau choisit qui reçoit un ticket, en priorité les étudiants
          qui ne sont pas boursiers, puis te dit où le récupérer.
        </p>

        {charge && <p className="chargement">Chargement des campagnes…</p>}
        {erreur && <p className="message-erreur">{erreur}</p>}

        {!charge && !erreur && dons.length === 0 && (
          <p className="vide">
            Aucune campagne de dons en cours pour le moment.
            <br />
            Les prochaines campagnes seront annoncées sur WhatsApp par le bureau de l’amicale.
          </p>
        )}

        {!charge && dons.map((d) => <CarteDon key={d.id} don={d} recharger={charger} />)}
      </section>
    </div>
  )
}
