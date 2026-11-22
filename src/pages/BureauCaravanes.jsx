import { useEffect, useState } from 'react'
import { formatDate, formatHeure, formatMontant, lieuDepartParDefaut, normaliserTelephone } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

function badgeStatut(statut) {
  if (statut === 'payé') return <span className="badge badge-paye">Payé</span>
  if (statut === 'désisté') return <span className="badge badge-desiste">Désisté</span>
  return <span className="badge badge-inscrit">Inscrit</span>
}

function FormulaireCaravane({ chauffeurs, onCree, onAnnuler }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    date_depart: '',
    heure_depart: '08:00',
    destination: '',
    lieu_depart: '',
    numero_wave_responsable: '',
    montant_fcfa: '',
    chauffeur_id: '',
    nouveau_chauffeur: false,
    nc_prenom: '',
    nc_nom: '',
    nc_telephone: ''
  })

  const changer = (cle) => (e) => setForm({ ...form, [cle]: e.target.value })

  // Quand la destination change, le lieu de départ se remplit tout seul
  // s'il est encore vide (UAM pour Diourbel/Bambey, Gouvernance de Diourbel
  // pour Dakar). Le bureau peut toujours le modifier ensuite.
  const changerDestination = (e) => {
    const destination = e.target.value
    setForm((ancien) => ({
      ...ancien,
      destination,
      lieu_depart: ancien.lieu_depart === '' ? lieuDepartParDefaut(destination) : ancien.lieu_depart
    }))
  }

  const creer = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      const donnees = {
        date_depart: form.date_depart,
        heure_depart: form.heure_depart || '08:00',
        destination: form.destination,
        lieu_depart: form.lieu_depart,
        numero_wave_responsable: normaliserTelephone(form.numero_wave_responsable),
        montant_fcfa: form.montant_fcfa === '' ? null : Number(form.montant_fcfa)
      }
      if (form.nouveau_chauffeur) {
        donnees.nouveau_chauffeur = {
          prenom: form.nc_prenom,
          nom: form.nc_nom,
          telephone: normaliserTelephone(form.nc_telephone)
        }
      } else if (form.chauffeur_id) {
        donnees.chauffeur_id = Number(form.chauffeur_id)
      }
      await api.creerCaravane(donnees)
      onCree(form.destination, form.date_depart, form.heure_depart)
    } catch (err) {
      setErreur(err.message || 'Impossible de créer cette caravane.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={creer}>
      {erreur && <p className="message-erreur">{erreur}</p>}
      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="car-date">Date de départ</label>
          <input id="car-date" type="date" value={form.date_depart} onChange={changer('date_depart')} required />
        </div>
        <div className="champ">
          <label htmlFor="car-heure">Heure de départ</label>
          <input id="car-heure" type="time" value={form.heure_depart} onChange={changer('heure_depart')} required />
          <p className="aide">Les désistements ferment 24 h avant cette heure.</p>
        </div>
        <div className="champ">
          <label htmlFor="car-destination">Destination</label>
          <input
            id="car-destination"
            value={form.destination}
            onChange={changerDestination}
            placeholder="Ex : Diourbel"
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="car-lieu">Lieu de départ</label>
          <input
            id="car-lieu"
            value={form.lieu_depart}
            onChange={changer('lieu_depart')}
            placeholder="Ex : UAM, Diamniadio"
          />
          <p className="aide">
            Se remplit tout seul selon la destination : UAM pour Diourbel ou Bambey, Gouvernance de
            Diourbel pour Dakar. Tu peux le modifier.
          </p>
        </div>
        <div className="champ">
          <label htmlFor="car-wave">Numéro Wave du responsable (pour recevoir les paiements)</label>
          <input
            id="car-wave"
            type="tel"
            value={form.numero_wave_responsable}
            onChange={changer('numero_wave_responsable')}
            placeholder="Ex : 77 000 00 00"
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="car-montant">Montant par place (FCFA)</label>
          <input
            id="car-montant"
            type="number"
            min="0"
            step="500"
            value={form.montant_fcfa}
            onChange={changer('montant_fcfa')}
            placeholder="Ex : 7500"
          />
          <p className="aide">Ce montant s’affiche sur le site public, à côté du numéro de paiement.</p>
        </div>
        <div className="champ">
          <label htmlFor="car-chauffeur">Chauffeur</label>
          <select
            id="car-chauffeur"
            value={form.nouveau_chauffeur ? 'nouveau' : form.chauffeur_id}
            onChange={(e) => {
              if (e.target.value === 'nouveau') setForm({ ...form, chauffeur_id: '', nouveau_chauffeur: true })
              else if (e.target.value === '') setForm({ ...form, chauffeur_id: '', nouveau_chauffeur: false })
              else setForm({ ...form, chauffeur_id: e.target.value, nouveau_chauffeur: false })
            }}
          >
            <option value="">Pas encore désigné</option>
            {chauffeurs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom} — {c.telephone}
              </option>
            ))}
            <option value="nouveau">Nouveau chauffeur (pas dans l’annuaire)</option>
          </select>
          <p className="aide">Choisis un chauffeur de l’annuaire, ou ajoute-en un nouveau ici.</p>
        </div>
      </div>

      {form.nouveau_chauffeur && (
        <div className="grille-champs">
          <div className="champ">
            <label htmlFor="car-nc-prenom">Prénom du chauffeur</label>
            <input id="car-nc-prenom" value={form.nc_prenom} onChange={changer('nc_prenom')} required />
          </div>
          <div className="champ">
            <label htmlFor="car-nc-nom">Nom du chauffeur</label>
            <input id="car-nc-nom" value={form.nc_nom} onChange={changer('nc_nom')} required />
          </div>
          <div className="champ">
            <label htmlFor="car-nc-tel">Numéro du chauffeur</label>
            <input id="car-nc-tel" type="tel" value={form.nc_telephone} onChange={changer('nc_telephone')} required />
          </div>
        </div>
      )}

      <div className="actions">
        <button type="submit" className="bouton bouton-plein" disabled={envoi}>
          {envoi ? 'Création…' : 'Créer cette caravane'}
        </button>
        <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    </form>
  )
}

// Si le mot de passe des caravanes change, le jeton gardé dans le
// navigateur devient périmé : le serveur refuse l'accès (401). Dans ce
// cas, on revient au formulaire du mot de passe au lieu de rester bloqué
// sur « Accès refusé » sans pouvoir retaper le mot de passe.
export default function BureauCaravanes({ onAccesRefuse }) {
  const [caravanes, setCaravanes] = useState([])
  const [chauffeurs, setChauffeurs] = useState([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [modaleCreation, setModaleCreation] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(null)
  // Confirmation en pop-up : { inscription, action: 'paye' | 'retirer' } ou null
  const [aConfirmer, setAConfirmer] = useState(null)

  const charger = async () => {
    setErreur('')
    try {
      const [dataCaravanes, dataChauffeurs] = await Promise.all([
        api.caravanesBureau(),
        api.chauffeurs('')
      ])
      setCaravanes(dataCaravanes.caravanes || [])
      setChauffeurs(dataChauffeurs.chauffeurs || [])
    } catch (err) {
      if (err.status === 401 && onAccesRefuse) {
        onAccesRefuse()
        return
      }
      setErreur(err.message || 'Impossible de charger les caravanes.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger()
  }, [])

  const apresCreation = (destination, date_depart, heure_depart) => {
    setMessage('Caravane créée : ' + destination + ', le ' + formatDate(date_depart) + ' à ' + formatHeure(heure_depart) + '.')
    setModaleCreation(false)
    charger()
  }

  const confirmerAction = async () => {
    if (!aConfirmer) return
    const { inscription, action } = aConfirmer
    setErreur('')
    setMessage('')
    setActionEnCours(inscription.id + '-' + action)
    try {
      if (action === 'paye') {
        await api.marquerPaye(inscription.id)
        setMessage('Paiement confirmé pour ' + inscription.prenom + ' ' + inscription.nom + '.')
      } else {
        await api.retirerInscription(inscription.id)
        setMessage(inscription.prenom + ' ' + inscription.nom + ' a été retiré(e) de la caravane.')
      }
      setAConfirmer(null)
      charger()
    } catch (err) {
      if (err.status === 401 && onAccesRefuse) {
        onAccesRefuse()
        return
      }
      setErreur(err.message || 'Une erreur est survenue.')
      setAConfirmer(null)
    } finally {
      setActionEnCours(null)
    }
  }

  return (
    <div>
      <h3>Caravanes</h3>
      <p>
        Crée la caravane ici : les membres s’inscrivent ensuite tout seuls sur le site public.
        Quand un membre a payé par Wave ou Orange Money, coche « Payé ». Si quelqu’un se désiste,
        retire-le de la liste.
      </p>

      <div className="banniere-avertissement">
        <strong>Règle : les désistements ferment 24 heures avant le départ,</strong> pour ne pas retarder
        la caravane.
      </div>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="actions">
        <button type="button" className="bouton bouton-bleu" onClick={() => setModaleCreation(true)}>
          Créer une caravane
        </button>
      </div>

      {modaleCreation && (
        <Modale titre="Nouvelle caravane" onFermer={() => setModaleCreation(false)}>
          <FormulaireCaravane
            chauffeurs={chauffeurs}
            onCree={apresCreation}
            onAnnuler={() => setModaleCreation(false)}
          />
        </Modale>
      )}

      {aConfirmer && (
        <Modale
          titre={aConfirmer.action === 'paye' ? 'Confirmer le paiement' : 'Retirer de la caravane'}
          onFermer={() => setAConfirmer(null)}
        >
          {aConfirmer.action === 'paye' ? (
            <p>
              <strong>{aConfirmer.inscription.prenom} {aConfirmer.inscription.nom}</strong> a payé sa place
              par Wave ou Orange Money ? Confirme seulement si tu as bien reçu l’argent.
            </p>
          ) : (
            <p>
              Retirer <strong>{aConfirmer.inscription.prenom} {aConfirmer.inscription.nom}</strong> de
              la caravane ? Il ou elle ne sera plus inscrit(e).
            </p>
          )}
          <div className="actions">
            <button
              type="button"
              className={'bouton bouton-plein' + (aConfirmer.action === 'retirer' ? ' bouton-danger' : '')}
              disabled={!!actionEnCours}
              onClick={confirmerAction}
            >
              {actionEnCours ? 'Enregistrement…' : aConfirmer.action === 'paye' ? 'Oui, c’est payé' : 'Retirer'}
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
        {!charge && caravanes.length === 0 && (
          <p className="vide">Aucune caravane pour le moment. Crée une caravane pour ouvrir les inscriptions.</p>
        )}
        {!charge &&
          caravanes.map((c) => {
            const actifs = (c.inscriptions || []).filter((i) => i.statut !== 'désisté')
            const payes = actifs.filter((i) => i.statut === 'payé').length
            const desistes = (c.inscriptions || []).filter((i) => i.statut === 'désisté')
            return (
              <article className="carte carte-caravane" key={c.id}>
                <h3>
                  {c.destination} {c.exemple && <span className="badge badge-exemple">Exemple</span>}
                </h3>
                <div className="bloc-depart">
                  {c.lieu_depart && (
                    <p className="ligne">
                      <span className="etiquette">Lieu de départ :</span> <strong>{c.lieu_depart}</strong>
                    </p>
                  )}
                  <p className="ligne">
                    <span className="etiquette">Date de départ :</span> <strong>{formatDate(c.date_depart)}</strong>
                  </p>
                  <p className="ligne">
                    <span className="etiquette">Heure de départ :</span> <strong>{formatHeure(c.heure_depart)}</strong>
                  </p>
                </div>
                {c.chauffeur ? (
                  <p className="ligne">
                    <span className="etiquette">Chauffeur :</span> {c.chauffeur.prenom} {c.chauffeur.nom} —{' '}
                    <a href={'tel:' + c.chauffeur.telephone.replace(/\s/g, '')}>{c.chauffeur.telephone}</a>
                  </p>
                ) : (
                  <p className="ligne">
                    <span className="etiquette">Chauffeur :</span> pas encore désigné
                  </p>
                )}
                <p className="ligne">
                  <span className="etiquette">Wave du responsable :</span> {c.numero_wave_responsable}
                </p>
                {c.montant_fcfa != null && (
                  <p className="ligne">
                    <span className="etiquette">Montant :</span>{' '}
                    <strong className="montant">{formatMontant(c.montant_fcfa)} par place</strong>
                  </p>
                )}
                <p className="compteurs">
                  <span>
                    <strong>{actifs.length}</strong> inscrit(s)
                  </span>
                  <span>
                    <strong>{payes}</strong> payé(s)
                  </span>
                  <span>
                    <strong>{actifs.length - payes}</strong> en attente de paiement
                  </span>
                </p>

                <h3 style={{ marginTop: 16 }}>Liste des inscrits</h3>
                {actifs.length === 0 && <p className="vide">Personne n’est inscrit pour le moment.</p>}
                {actifs.map((i) => (
                  <div className="rangee" key={i.id}>
                    <div className="nom">
                      {i.prenom} {i.nom} {badgeStatut(i.statut)}
                    </div>
                    <div className="details">
                      <a href={'tel:' + String(i.telephone).replace(/\s/g, '')}>{i.telephone}</a>
                    </div>
                    <div className="actions-ligne">
                      {i.statut === 'inscrit' && (
                        <button
                          type="button"
                          className="bouton-discret"
                          disabled={actionEnCours === i.id + '-paye'}
                          onClick={() => setAConfirmer({ inscription: i, action: 'paye' })}
                        >
                          Marquer « Payé »
                        </button>
                      )}
                      <button
                        type="button"
                        className="bouton-discret bouton-danger"
                        disabled={actionEnCours === i.id + '-retirer'}
                        onClick={() => setAConfirmer({ inscription: i, action: 'retirer' })}
                      >
                        Retirer de la liste
                      </button>
                    </div>
                  </div>
                ))}
                {desistes.length > 0 && (
                  <p className="details" style={{ color: '#4d5866', fontSize: 15 }}>
                    {desistes.length} désistement(s) :{' '}
                    {desistes.map((i) => i.prenom + ' ' + i.nom).join(', ')}.
                  </p>
                )}
              </article>
            )
          })}
      </div>
    </div>
  )
}
