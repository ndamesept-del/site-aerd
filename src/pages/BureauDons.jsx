import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

function badgeStatut(statut) {
  if (statut === 'attribue') return <span className="badge badge-paye">Ticket attribué</span>
  if (statut === 'refuse') return <span className="badge badge-desiste">Refusé</span>
  return <span className="badge badge-inscrit">Inscrit</span>
}

// La liste des inscrits arrive DÉJÀ TRIÉE par le serveur : les
// non-boursiers d'abord, puis les non renseignés, puis les boursiers.
// Le bureau n'a rien à trier à la main. Les boursiers ne sont pas
// exclus : ils peuvent toujours recevoir un ticket s'il en reste.

function FormulaireDon({ onCree, onAnnuler }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({ titre: '', description: '', nombre_tickets: '', lieu_retrait: '' })

  const changer = (cle) => (e) => setForm({ ...form, [cle]: e.target.value })

  const creer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await api.creerDon({
        titre: form.titre,
        description: form.description,
        nombre_tickets: Number(form.nombre_tickets),
        lieu_retrait: form.lieu_retrait
      })
      onCree(form.titre)
    } catch (err) {
      setErreur(err.message || 'Impossible de créer cette campagne.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={creer}>
      {erreur && <p className="message-erreur">{erreur}</p>}
      <div className="champ">
        <label htmlFor="don-titre">Titre de la campagne</label>
        <input
          id="don-titre"
          value={form.titre}
          onChange={changer('titre')}
          placeholder="Ex : Dons de tickets de restauration"
          required
        />
      </div>
      <div className="champ">
        <label htmlFor="don-description">Description</label>
        <textarea
          id="don-description"
          value={form.description}
          onChange={changer('description')}
          placeholder="Ex : Des tickets pour les étudiants qui en ont besoin ce mois-ci."
          rows={3}
        />
      </div>
      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="don-nombre">Nombre de tickets</label>
          <input
            id="don-nombre"
            type="number"
            min="1"
            step="1"
            value={form.nombre_tickets}
            onChange={changer('nombre_tickets')}
            placeholder="Ex : 20"
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="don-lieu">Lieu de retrait des tickets</label>
          <input
            id="don-lieu"
            value={form.lieu_retrait}
            onChange={changer('lieu_retrait')}
            placeholder="Ex : Bureau de l’amicale, campus de Diamniadio"
            required
          />
        </div>
      </div>
      <p className="aide">
        Une fois créée, annonce la campagne sur WhatsApp : les gens qui en ont besoin s’inscrivent sur la page
        publique « Cotisations et dons de tickets ».
      </p>
      <div className="actions">
        <button type="submit" className="bouton bouton-plein" disabled={envoi}>
          {envoi ? 'Création…' : 'Créer cette campagne'}
        </button>
        <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    </form>
  )
}

export default function BureauDons() {
  const [dons, setDons] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [modaleCreation, setModaleCreation] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(null)
  // Confirmation en pop-up : { type, don?, inscription? } ou null
  const [aConfirmer, setAConfirmer] = useState(null)

  const charger = async () => {
    setErreur('')
    try {
      const data = await api.donsBureau()
      setDons(data.dons || [])
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les dons de tickets.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const apresCreation = (titre) => {
    setMessage('Campagne créée : ' + titre + '. Annonce-la sur WhatsApp pour que les gens s’inscrivent.')
    setModaleCreation(false)
    charger()
  }

  const confirmerAction = async () => {
    if (!aConfirmer) return
    setErreur('')
    setMessage('')
    if (aConfirmer.type === 'fermer' || aConfirmer.type === 'rouvrir') {
      const don = aConfirmer.don
      const statut = aConfirmer.type === 'fermer' ? 'ferme' : 'ouvert'
      setActionEnCours(don.id + '-' + aConfirmer.type)
      try {
        await api.changerStatutDon(don.id, statut)
        setMessage(
          statut === 'ferme'
            ? 'Campagne « ' + don.titre + ' » fermée : plus personne ne peut s’inscrire.'
            : 'Campagne « ' + don.titre + ' » rouverte : les inscriptions sont de nouveau possibles.'
        )
        setAConfirmer(null)
        charger()
      } catch (err) {
        setErreur(err.message || 'Une erreur est survenue.')
        setAConfirmer(null)
      } finally {
        setActionEnCours(null)
      }
      return
    }
    const inscription = aConfirmer.inscription
    const action = aConfirmer.type
    setActionEnCours(inscription.id + '-' + action)
    try {
      if (action === 'attribuer') {
        await api.attribuerTicket(inscription.id)
        setMessage('Ticket attribué à ' + inscription.prenom + ' ' + inscription.nom + '.')
      } else {
        await api.refuserTicket(inscription.id)
        setMessage('Demande de ' + inscription.prenom + ' ' + inscription.nom + ' refusée.')
      }
      setAConfirmer(null)
      charger()
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
      setAConfirmer(null)
    } finally {
      setActionEnCours(null)
    }
  }

  return (
    <div>
      <h3>Dons de tickets</h3>
      <p>
        Avec l’argent des cotisations, l’amicale donne des tickets aux étudiants qui en ont besoin.
        Crée une campagne ici, annonce-la sur WhatsApp, et les gens s’inscrivent sur la page publique.
        <strong> Les non-boursiers sont prioritaires</strong> : ils apparaissent en premier dans la liste.
        Les boursiers ne sont pas exclus, ils peuvent recevoir un ticket s’il en reste.
      </p>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="actions">
        <button type="button" className="bouton bouton-bleu" onClick={() => setModaleCreation(true)}>
          Créer une campagne de dons
        </button>
      </div>

      {modaleCreation && (
        <Modale titre="Nouvelle campagne de dons" onFermer={() => setModaleCreation(false)}>
          <FormulaireDon onCree={apresCreation} onAnnuler={() => setModaleCreation(false)} />
        </Modale>
      )}

      {aConfirmer && (
        <Modale
          titre={
            aConfirmer.type === 'attribuer'
              ? 'Attribuer un ticket'
              : aConfirmer.type === 'refuser'
                ? 'Refuser la demande'
                : aConfirmer.type === 'fermer'
                  ? 'Fermer la campagne'
                  : 'Rouvrir la campagne'
          }
          onFermer={() => setAConfirmer(null)}
        >
          {aConfirmer.type === 'attribuer' && (
            <p>
              Attribuer un ticket à{' '}
              <strong>
                {aConfirmer.inscription.prenom} {aConfirmer.inscription.nom}
              </strong>{' '}
              ? Dis-lui ensuite où récupérer son ticket : {aConfirmer.lieuRetrait}.
            </p>
          )}
          {aConfirmer.type === 'refuser' && (
            <p>
              Refuser la demande de{' '}
              <strong>
                {aConfirmer.inscription.prenom} {aConfirmer.inscription.nom}
              </strong>{' '}
              ? Il ou elle ne recevra pas de ticket pour cette campagne.
            </p>
          )}
          {aConfirmer.type === 'fermer' && (
            <p>
              Fermer la campagne « <strong>{aConfirmer.don.titre}</strong> » ? Plus personne ne pourra
              s’inscrire. Les tickets déjà attribués ne changent pas.
            </p>
          )}
          {aConfirmer.type === 'rouvrir' && (
            <p>
              Rouvrir la campagne « <strong>{aConfirmer.don.titre}</strong> » ? Les gens pourront de
              nouveau s’inscrire, s’il reste des tickets.
            </p>
          )}
          <div className="actions">
            <button
              type="button"
              className={'bouton bouton-plein' + (aConfirmer.type === 'refuser' || aConfirmer.type === 'fermer' ? ' bouton-danger' : '')}
              disabled={!!actionEnCours}
              onClick={confirmerAction}
            >
              {actionEnCours
                ? 'Enregistrement…'
                : aConfirmer.type === 'attribuer'
                  ? 'Oui, attribuer le ticket'
                  : aConfirmer.type === 'refuser'
                    ? 'Refuser'
                    : aConfirmer.type === 'fermer'
                      ? 'Fermer la campagne'
                      : 'Rouvrir la campagne'}
            </button>
            <button
              type="button"
              className="bouton bouton-secondaire bouton-plein"
              onClick={() => setAConfirmer(null)}
            >
              Annuler
            </button>
          </div>
        </Modale>
      )}

      <div style={{ marginTop: 20 }}>
        {charge && <p className="chargement">Chargement…</p>}
        {!charge && dons.length === 0 && (
          <p className="vide">Aucune campagne de dons pour le moment. Crée une campagne pour commencer.</p>
        )}
        {!charge &&
          dons.map((don) => {
            const inscrits = don.inscrits || []
            const enAttente = inscrits.filter((i) => i.statut === 'inscrit').length
            const attribues = inscrits.filter((i) => i.statut === 'attribue').length
            return (
              <article className="carte carte-caravane" key={don.id}>
                <h3>
                  {don.titre}{' '}
                  {don.statut === 'ferme' ? (
                    <span className="badge badge-desiste">Fermée</span>
                  ) : (
                    <span className="badge badge-inscrit">Ouverte</span>
                  )}
                </h3>
                {don.description && <p className="details">{don.description}</p>}
                <p className="ligne">
                  <span className="etiquette">Lieu de retrait :</span> {don.lieu_retrait}
                </p>
                <p className="compteurs">
                  <span>
                    <strong>{don.nombre_tickets}</strong> ticket(s) au total
                  </span>
                  <span>
                    <strong>{don.tickets_restants}</strong> restant(s)
                  </span>
                  <span>
                    <strong>{enAttente}</strong> demande(s) en attente
                  </span>
                  <span>
                    <strong>{attribues}</strong> attribué(s)
                  </span>
                </p>
                <div className="actions">
                  {don.statut === 'ouvert' ? (
                    <button
                      type="button"
                      className="bouton bouton-secondaire"
                      disabled={actionEnCours === don.id + '-fermer'}
                      onClick={() => setAConfirmer({ type: 'fermer', don })}
                    >
                      Fermer la campagne
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="bouton bouton-secondaire"
                      disabled={actionEnCours === don.id + '-rouvrir'}
                      onClick={() => setAConfirmer({ type: 'rouvrir', don })}
                    >
                      Rouvrir la campagne
                    </button>
                  )}
                </div>

                <h3 style={{ marginTop: 16 }}>Personnes inscrites</h3>
                <p className="aide">
                  Cette liste reste dans l’espace bureau seulement : elle n’est jamais publique.
                  Elle est déjà triée toute seule par le site : les non-boursiers en premier
                  (les prioritaires), puis les non renseignés, puis les boursiers.
                </p>
                {inscrits.length === 0 && <p className="vide">Personne n’est inscrit pour le moment.</p>}
                {inscrits.map((i) => (
                  <div className="rangee" key={i.id}>
                    <div className="nom">
                      {i.prenom} {i.nom} {badgeStatut(i.statut)}{' '}
                      {i.boursier === true ? (
                        <span className="badge badge-inscrit">Boursier</span>
                      ) : i.boursier === false ? (
                        <span className="badge badge-prioritaire">Non boursier — prioritaire</span>
                      ) : (
                        <span className="badge badge-desiste">Non renseigné</span>
                      )}
                    </div>
                    <div className="details">
                      <a href={'tel:' + String(i.telephone).replace(/\s/g, '')}>{i.telephone}</a>
                    </div>
                    <div className="actions-ligne">
                      {i.statut === 'inscrit' && (
                        <>
                          <button
                            type="button"
                            className="bouton-discret"
                            disabled={actionEnCours === i.id + '-attribuer' || don.tickets_restants <= 0}
                            onClick={() =>
                              setAConfirmer({ type: 'attribuer', inscription: i, lieuRetrait: don.lieu_retrait })
                            }
                          >
                            Attribuer un ticket
                          </button>
                          <button
                            type="button"
                            className="bouton-discret bouton-danger"
                            disabled={actionEnCours === i.id + '-refuser'}
                            onClick={() => setAConfirmer({ type: 'refuser', inscription: i })}
                          >
                            Refuser
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </article>
            )
          })}
      </div>
    </div>
  )
}
