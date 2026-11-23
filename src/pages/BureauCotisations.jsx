import { useEffect, useState } from 'react'
import { MONTANT_COTISATION, formatMois, formatMontant, moisCourant, normaliserTelephone } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'

export default function BureauCotisations() {
  const [mois, setMois] = useState(moisCourant())
  const [membres, setMembres] = useState([])
  const [payes, setPayes] = useState(0)
  const [totalMembres, setTotalMembres] = useState(0)
  const [totalCollecte, setTotalCollecte] = useState(0)
  const [numeroTresorier, setNumeroTresorier] = useState('')
  const [nouveauNumero, setNouveauNumero] = useState('')
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [actionEnCours, setActionEnCours] = useState(null)
  // Confirmation en pop-up : { membre, statut } ou null
  const [aConfirmer, setAConfirmer] = useState(null)

  const charger = async (moisChoisi) => {
    setErreur('')
    try {
      const [dataCotisations, dataParametres] = await Promise.all([
        api.cotisations(moisChoisi),
        api.parametresPublics()
      ])
      setMembres(dataCotisations.membres || [])
      setPayes(dataCotisations.payes || 0)
      setTotalMembres(dataCotisations.total_membres || 0)
      setTotalCollecte(dataCotisations.total_collecte || 0)
      setNumeroTresorier(dataParametres.numero_wave_tresorier || '')
      setNouveauNumero(dataParametres.numero_wave_tresorier || '')
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les cotisations.')
    } finally {
      setCharge(false)
    }
  }

  useEffect(() => {
    charger(mois)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois])

  const changerMois = (nouveauMois) => {
    if (!/^\d{4}-\d{2}$/.test(nouveauMois || '')) return
    setCharge(true)
    setMois(nouveauMois)
  }

  const confirmerAction = async () => {
    if (!aConfirmer) return
    const { membre, statut } = aConfirmer
    setErreur('')
    setMessage('')
    setActionEnCours(membre.id + '-' + statut)
    try {
      await api.marquerCotisation(membre.id, mois, statut)
      setMessage(
        statut === 'paye'
          ? 'Cotisation de ' + formatMois(mois) + ' marquée payée pour ' + membre.prenom + ' ' + membre.nom + '.'
          : 'Cotisation de ' + formatMois(mois) + ' remise en attente pour ' + membre.prenom + ' ' + membre.nom + '.'
      )
      setAConfirmer(null)
      charger(mois)
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
      setAConfirmer(null)
    } finally {
      setActionEnCours(null)
    }
  }

  const retirerNumero = async () => {
    setErreur('')
    setMessage('')
    try {
      await api.definirNumeroTresorier('')
      setNumeroTresorier('')
      setNouveauNumero('')
      setMessage('Numéro du trésorier retiré. Il ne s’affiche plus sur les pages publiques.')
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    }
  }

  const enregistrerNumero = async (e) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    const numero = normaliserTelephone(nouveauNumero)
    if (numero && numero.replace(/\D/g, '').length < 9) {
      setErreur('Le numéro de téléphone semble incomplet. Vérifie-le et réessaie.')
      return
    }
    try {
      await api.definirNumeroTresorier(numero)
      setNumeroTresorier(numero)
      setMessage('Numéro du trésorier enregistré. Il s’affiche sur la page publique des cotisations.')
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
    }
  }

  return (
    <div>
      <h3>Cotisations du volet social</h3>
      <p>
        Chaque mois, chaque membre paye {formatMontant(MONTANT_COTISATION)} pour le volet social.
        Les membres paient par Wave ou Orange Money au numéro du trésorier. Quand tu as bien reçu
        l’argent, coche « Payé » ici.
      </p>

      {message && <p className="message-ok">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="grille-champs">
        <div className="champ">
          <label htmlFor="cotisations-mois">Mois</label>
          <input
            id="cotisations-mois"
            type="month"
            value={mois}
            onChange={(e) => changerMois(e.target.value)}
          />
        </div>
      </div>

      {!charge && (
        <p className="compteurs">
          <span>
            <strong>
              {payes} sur {totalMembres}
            </strong>{' '}
            ont payé en {formatMois(mois)}
          </span>
          <span>
            Total collecté : <strong>{formatMontant(totalCollecte)}</strong>
          </span>
        </p>
      )}

      <h3 style={{ marginTop: 20 }}>Numéro du trésorier</h3>
      <p className="aide">
        C’est à ce numéro que les membres envoient leurs cotisations par Wave ou Orange Money.
        Il s’affiche sur la page publique des cotisations et des dons. Si la trésorerie change,
        retire ce numéro et mets celui du nouveau trésorier.
      </p>
      <form className="formulaire" onSubmit={enregistrerNumero}>
        <div className="champ">
          <label htmlFor="numero-tresorier">Numéro Wave / Orange Money du trésorier</label>
          <input
            id="numero-tresorier"
            type="tel"
            value={nouveauNumero}
            onChange={(e) => setNouveauNumero(e.target.value)}
            placeholder="Ex : 77 000 00 00"
          />
          {numeroTresorier && <p className="aide">Numéro enregistré : {numeroTresorier}</p>}
        </div>
        <div className="actions">
          <button type="submit" className="bouton bouton-bleu">
            Enregistrer le numéro
          </button>
          {numeroTresorier && (
            <button type="button" className="bouton-discret bouton-danger" onClick={retirerNumero}>
              Retirer le numéro
            </button>
          )}
        </div>
      </form>

      <h3 style={{ marginTop: 20 }}>Membres — {formatMois(mois)}</h3>
      {charge && <p className="chargement">Chargement…</p>}
      {!charge && membres.length === 0 && <p className="vide">Aucun membre pour le moment.</p>}
      {!charge &&
        membres.map((m) => (
          <div className="rangee" key={m.id}>
            <div className="nom">
              {m.prenom} {m.nom}{' '}
              {m.statut === 'paye' ? (
                <span className="badge badge-paye">Payé</span>
              ) : (
                <span className="badge badge-inscrit">En attente</span>
              )}
            </div>
            <div className="details">
              <a href={'tel:' + String(m.telephone).replace(/\s/g, '')}>{m.telephone}</a>
            </div>
            <div className="actions-ligne">
              {m.statut === 'paye' ? (
                <button
                  type="button"
                  className="bouton-discret"
                  disabled={actionEnCours === m.id + '-en_attente'}
                  onClick={() => setAConfirmer({ membre: m, statut: 'en_attente' })}
                >
                  Remettre en attente
                </button>
              ) : (
                <button
                  type="button"
                  className="bouton-discret"
                  disabled={actionEnCours === m.id + '-paye'}
                  onClick={() => setAConfirmer({ membre: m, statut: 'paye' })}
                >
                  Marquer « Payé »
                </button>
              )}
            </div>
          </div>
        ))}

      {aConfirmer && (
        <Modale
          titre={aConfirmer.statut === 'paye' ? 'Confirmer le paiement' : 'Remettre en attente'}
          onFermer={() => setAConfirmer(null)}
        >
          {aConfirmer.statut === 'paye' ? (
            <p>
              <strong>
                {aConfirmer.membre.prenom} {aConfirmer.membre.nom}
              </strong>{' '}
              a payé sa cotisation de {formatMontant(MONTANT_COTISATION)} pour {formatMois(mois)} par
              Wave ou Orange Money ? Confirme seulement si tu as bien reçu l’argent.
            </p>
          ) : (
            <p>
              Remettre la cotisation de{' '}
              <strong>
                {aConfirmer.membre.prenom} {aConfirmer.membre.nom}
              </strong>{' '}
              pour {formatMois(mois)} en attente ? Elle ne comptera plus dans le total collecté.
            </p>
          )}
          <div className="actions">
            <button
              type="button"
              className="bouton bouton-plein"
              disabled={!!actionEnCours}
              onClick={confirmerAction}
            >
              {actionEnCours ? 'Enregistrement…' : aConfirmer.statut === 'paye' ? 'Oui, c’est payé' : 'Remettre en attente'}
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
    </div>
  )
}
