import { useEffect, useState } from 'react'
import { formatDate, formatHeure, formatMontant, desistementOuvert, normaliserTelephone } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

function textePaiement(caravane) {
  if (caravane.montant_fcfa != null) {
    return 'Envoie ' + formatMontant(caravane.montant_fcfa) + ' par Wave ou Orange Money au responsable :'
  }
  return 'Envoie le montant par Wave ou Orange Money au responsable :'
}

function FormulaireInscription({ caravane, onTermine, onAnnuler }) {
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
      await api.inscrire({
        caravane_id: caravane.id,
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
      <div className="champ-piege" aria-hidden="true">
        <label htmlFor={'site-' + caravane.id}>Site web (laisse ce champ vide)</label>
        <input
          id={'site-' + caravane.id}
          value={siteWeb}
          onChange={(e) => setSiteWeb(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>
      <div className="banniere-avertissement">
        <strong>À retenir :</strong> si tu ne peux plus venir, désiste-toi au moins 24 heures avant le départ.
        Après, les désistements sont fermés pour ne pas retarder la caravane.
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
    const telPropre = normaliserTelephone(telephone)
    if (telPropre.replace(/\D/g, '').length < 9) {
      setErreur('Le numéro de téléphone semble incomplet. Vérifie-le et réessaie.')
      return
    }
    setEnvoi(true)
    try {
      await api.desister({ caravane_id: caravane.id, telephone: telPropre })
      onTermine()
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue. Réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className="formulaire" onSubmit={envoyer}>
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
  // null | 'inscrire' | 'desister' | 'inscription-ok' | 'desistement-ok' | 'liste'
  const [modale, setModale] = useState(null)
  const [prenomInscrit, setPrenomInscrit] = useState('')

  // Règle : plus de désistement quand il reste moins de 24 h avant le départ.
  const desistementPossible = desistementOuvert(caravane)

  const apresInscription = ({ prenom }) => {
    setPrenomInscrit(prenom)
    setModale('inscription-ok')
    recharger()
  }

  const apresDesistement = () => {
    setModale('desistement-ok')
    recharger()
  }

  const fermerModale = () => setModale(null)

  return (
    <article className="carte carte-caravane">
      <h3>{caravane.destination}</h3>
      <div className="bloc-depart">
        {caravane.lieu_depart && (
          <p className="ligne">
            <span className="etiquette">Lieu de départ :</span> <strong>{caravane.lieu_depart}</strong>
          </p>
        )}
        <p className="ligne">
          <span className="etiquette">Date de départ :</span> <strong>{formatDate(caravane.date_depart)}</strong>
        </p>
        <p className="ligne">
          <span className="etiquette">Heure de départ :</span> <strong>{formatHeure(caravane.heure_depart)}</strong>
        </p>
      </div>
      {caravane.montant_fcfa != null && (
        <p className="montant">{formatMontant(caravane.montant_fcfa)} par place</p>
      )}
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
        <div>{textePaiement(caravane)}</div>
        <div className="numero">
          <a href={'tel:' + caravane.numero_wave_responsable.replace(/\s/g, '')}>
            {caravane.numero_wave_responsable}
          </a>
        </div>
        <div>Le bureau confirmera ton paiement après vérification.</div>
      </div>

      {!desistementPossible && (
        <p className="banniere-ferme">
          <strong>Désistements fermés :</strong> la caravane part dans moins de 24 heures. Contacte le bureau si tu
          as un problème.
        </p>
      )}

      <div className="actions">
        <button type="button" className="bouton bouton-plein" onClick={() => setModale('inscrire')}>
          S’inscrire à cette caravane
        </button>
        <button type="button" className="bouton bouton-secondaire bouton-plein" onClick={() => setModale('liste')}>
          Liste des inscrits ({(caravane.inscrits_liste || []).length})
        </button>
        {desistementPossible && (
          <button
            type="button"
            className="bouton bouton-secondaire bouton-plein"
            onClick={() => setModale('desister')}
          >
            Se désister
          </button>
        )}
      </div>

      {modale === 'liste' && (
        <Modale titre={'Liste des inscrits — ' + caravane.destination} onFermer={fermerModale}>
          <div className="liste-inscrits">
            {(!caravane.inscrits_liste || caravane.inscrits_liste.length === 0) && (
              <p className="details">Personne n’est inscrit pour le moment.</p>
            )}
            {(caravane.inscrits_liste || []).map((p, index) => (
              <div className="rangee-inscrit" key={index}>
                <span>
                  {p.prenom} {p.nom}
                </span>
                {p.statut === 'payé' ? (
                  <span className="badge badge-paye">Payé</span>
                ) : (
                  <span className="badge badge-inscrit">En attente</span>
                )}
              </div>
            ))}
          </div>
          <p className="aide">
            Chacun peut vérifier ici que son inscription est bien enregistrée, sans demander au bureau. Les numéros
            de téléphone ne s’affichent jamais sur cette liste.
          </p>
          <div className="actions">
            <button type="button" className="bouton bouton-plein" onClick={fermerModale}>
              Fermer
            </button>
          </div>
        </Modale>
      )}

      {modale === 'inscrire' && (
        <Modale titre={'S’inscrire à la caravane de ' + caravane.destination} onFermer={fermerModale}>
          <FormulaireInscription caravane={caravane} onTermine={apresInscription} onAnnuler={fermerModale} />
        </Modale>
      )}

      {modale === 'desister' && (
        <Modale titre={'Se désister de la caravane de ' + caravane.destination} onFermer={fermerModale}>
          <FormulaireDesistement caravane={caravane} onTermine={apresDesistement} onAnnuler={fermerModale} />
        </Modale>
      )}

      {modale === 'inscription-ok' && (
        <Modale titre="Inscription confirmée" onFermer={fermerModale}>
          <p className="message-ok">
            Merci {prenomInscrit}, ton inscription est bien enregistrée pour la caravane de {caravane.destination}.
          </p>
      <div className="bloc-depart">
        {caravane.lieu_depart && (
          <p className="ligne">
            <span className="etiquette">Lieu de départ :</span> <strong>{caravane.lieu_depart}</strong>
          </p>
        )}
        <p className="ligne">
          <span className="etiquette">Date de départ :</span> <strong>{formatDate(caravane.date_depart)}</strong>
        </p>
        <p className="ligne">
          <span className="etiquette">Heure de départ :</span> <strong>{formatHeure(caravane.heure_depart)}</strong>
        </p>
      </div>
          <h3>Maintenant, paye ta place</h3>
          <div className="encart-wave">
            <div>{textePaiement(caravane)}</div>
            <div className="numero">
              <a href={'tel:' + caravane.numero_wave_responsable.replace(/\s/g, '')}>
                {caravane.numero_wave_responsable}
              </a>
            </div>
            <div>Le bureau confirmera ton paiement après vérification.</div>
          </div>
          <p className="aide">
            Si tu ne peux plus venir, pense à te désister au moins 24 heures avant le départ, pour libérer ta place.
          </p>
          <div className="actions">
            <button type="button" className="bouton bouton-plein" onClick={fermerModale}>
              Fermer
            </button>
          </div>
        </Modale>
      )}

      {modale === 'desistement-ok' && (
        <Modale titre="Désistement confirmé" onFermer={fermerModale}>
          <p className="message-ok">Ton inscription est annulée. Ta place est libérée.</p>
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
          Inscris-toi, paie par Wave ou Orange Money, le bureau confirme.
        </p>

        <div className="banniere-avertissement">
          <strong>Désistements fermés 24 heures avant le départ.</strong>
        </div>

        {charge && <p className="chargement">Chargement des caravanes…</p>}
        {erreur && <p className="message-erreur">{erreur}</p>}

        {!charge && !erreur && caravanes.length === 0 && (
          <p className="vide">
            Aucune caravane n’est programmée pour le moment.
            <br />
            Les prochaines dates seront annoncées ici par le bureau de l’amicale.
          </p>
        )}

        {!charge && caravanes.map((c) => <CarteCaravane key={c.id} caravane={c} recharger={charger} />)}
      </section>
    </div>
  )
}
