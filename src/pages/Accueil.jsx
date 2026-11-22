import { useCallback, useEffect, useState } from 'react'
import { FILIERES, NIVEAUX, FORMULAIRE_INSCRIPTION, formatDate, formatMontant } from '../data.js'
import { api } from '../api.js'
import Modale from '../components/Modale.jsx'
import { ficheDe } from '../formations.js'

function initiales(prenom, nom) {
  const lettres = (String(prenom || '').trim().charAt(0) + String(nom || '').trim().charAt(0)).toUpperCase()
  return lettres || '?'
}

// Fenêtre de présentation d'une structure de l'UAM (formations, débouchés,
// admission, lien officiel). Réutilise la fenêtre Modale du site : bouton ×,
// touche Échap et clic sur le fond la ferment.
function FicheFormation({ filiere, onFermer }) {
  const fiche = ficheDe(filiere.court)
  return (
    <Modale titre={filiere.court} onFermer={onFermer} className="modale-fiche">
      <p className="fiche-nom">{filiere.long}</p>
      {!fiche && (
        <p className="intro">
          La fiche de cette structure n’est pas encore disponible. Consulte le site de l’UAM pour plus
          d’informations.
        </p>
      )}
      {fiche && (
        <>
          <p>{fiche.resume}</p>
          <h4>Formations</h4>
          <ul className="fiche-liste">
            {fiche.formations.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h4>Principaux débouchés</h4>
          <ul className="fiche-liste">
            {fiche.debouches.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h4>Admission</h4>
          <ul className="fiche-liste">
            {fiche.admission.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {fiche.note && <p className="fiche-note">{fiche.note}</p>}
          <p className="fiche-avertissement">
            Les conditions d’admission, les dates et les formations peuvent changer chaque année. Vérifie
            toujours les informations à jour sur le site de l’UAM.
          </p>
          <div className="fiche-liens">
            {fiche.liens.map((l, i) => (
              <a
                key={l.url}
                className={'bouton' + (i > 0 ? ' bouton-secondaire' : '')}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.libelle} ↗
              </a>
            ))}
          </div>
        </>
      )}
    </Modale>
  )
}

export default function Accueil({ aller }) {
  const [prochaine, setProchaine] = useState(null)
  const [charge, setCharge] = useState(true)
  const [bureau, setBureau] = useState([])
  const [anciens, setAnciens] = useState([])
  const [filiereOuverte, setFiliereOuverte] = useState(null)
  const fermerFiliere = useCallback(() => setFiliereOuverte(null), [])

  useEffect(() => {
    api
      .caravanesPubliques()
      .then((data) => {
        setProchaine(data.caravanes && data.caravanes.length > 0 ? data.caravanes[0] : null)
      })
      .catch(() => setProchaine(null))
      .finally(() => setCharge(false))
    api
      .bureauPublic()
      .then((data) => {
        setBureau(data.bureau || [])
        setAnciens(data.anciens || [])
      })
      .catch(() => {
        setBureau([])
        setAnciens([])
      })
  }, [])

  return (
    <div>
      <section className="hero">
        <div className="conteneur">
          <p className="sur-titre">Bienvenue à l’AERD / UAM</p>
          <h1>
            Les étudiants de <span className="souligne-or">Diourbel et de Bambey</span>, réunis à l’UAM.
          </h1>
          <p className="chapeau">
            On accueille les nouveaux bacheliers de Diourbel et de Bambey à l’UAM, et on organise les caravanes de retour au pays.
          </p>
          <div className="actions">
            <button type="button" className="bouton" onClick={() => aller('caravanes')}>
              Voir les prochaines caravanes
            </button>
            <a className="bouton bouton-secondaire" href={FORMULAIRE_INSCRIPTION} target="_blank" rel="noreferrer">
              Rejoindre l’amicale
            </a>
          </div>
          <p className="faits">
            <strong>8 filières</strong> · de la <strong>L1</strong> au <strong>M2</strong> · un bureau élu par les membres
          </p>
        </div>
      </section>

      <section className="section">
        <div className="conteneur">
          <h2>Ce que fait l’amicale</h2>
          <p className="intro">
            Un réseau d’entraide entre étudiants de Diourbel et de Bambey. Tout le travail est bénévole.
          </p>
          <div className="cartes-fonctions">
            <article className="carte-fonction">
              <span className="numero-fonction" aria-hidden="true">1</span>
              <h3>Accueillir</h3>
              <p>
                Orientation, parrainage par les anciens et conseils pratiques dès l’arrivée.
              </p>
            </article>
            <article className="carte-fonction">
              <span className="numero-fonction" aria-hidden="true">2</span>
              <h3>Organiser les caravanes</h3>
              <p>
                Départs groupés vers Diourbel et Bambey, avec liste d’inscrits et suivi des paiements.
              </p>
            </article>
            <article className="carte-fonction">
              <span className="numero-fonction" aria-hidden="true">3</span>
                            <h3>Garder le lien</h3>
              <p>
                Un annuaire des chauffeurs transmis d’un bureau à l’autre.
              </p>
            </article>
            <article className="carte-fonction">
              <span className="numero-fonction" aria-hidden="true">4</span>
              <h3>S’entraider</h3>
              <p>
                500 FCFA par mois de cotisation : le bureau donne des tickets aux étudiants qui en ont
                besoin, en priorité aux non-boursiers.
              </p>
              <button type="button" className="bouton-discret" onClick={() => aller('cotisations')}>
                Cotisations et dons ›
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="conteneur">
          <h2>Prochaine caravane</h2>
          {charge && <p className="chargement">Chargement…</p>}
          {!charge && !prochaine && (
            <p className="intro">
              Aucune caravane programmée pour le moment.
            </p>
          )}
          {!charge && prochaine && (
            <div className="carte carte-caravane">
              <h3>{prochaine.destination}</h3>
              <p className="date">{formatDate(prochaine.date_depart)}</p>
              {prochaine.montant_fcfa != null && (
                <p className="montant">{formatMontant(prochaine.montant_fcfa)} par place</p>
              )}
              {prochaine.chauffeur && (
                <p className="ligne">
                  <span className="etiquette">Chauffeur :</span> {prochaine.chauffeur.prenom} {prochaine.chauffeur.nom}{' '}
                  —{' '}
                  <a href={'tel:' + prochaine.chauffeur.telephone.replace(/\s/g, '')}>
                    {prochaine.chauffeur.telephone}
                  </a>
                </p>
              )}
              <p className="compteurs">
                <span>
                  <strong>{prochaine.inscrits}</strong> inscrit(s)
                </span>
                <span>
                  <strong>{prochaine.payes}</strong> payé(s)
                </span>
              </p>
              <button type="button" className="bouton" onClick={() => aller('caravanes')}>
                S’inscrire à cette caravane
              </button>
            </div>
          )}
        </div>
      </section>

      {(bureau.length > 0 || anciens.length > 0) && (
        <section className="section">
          <div className="conteneur">
            <p className="sur-titre">Les responsables</p>
            <h2>Le bureau de l’amicale</h2>
            {bureau.length > 0 && (
              <>
                <p className="intro">
                  Ils accueillent les nouveaux et organisent les caravanes.
                </p>
                <div className="grille-bureau">
                  {bureau.map((m) => (
                    <article className="carte-bureau" key={m.id}>
                      {m.photo ? (
                        <img className="photo-bureau" src={m.photo} alt={'Photo de ' + m.prenom + ' ' + m.nom} />
                      ) : (
                        <span className="initiales-bureau" aria-hidden="true">
                          {initiales(m.prenom, m.nom)}
                        </span>
                      )}
                      <h3>
                        {m.prenom} {m.nom}
                      </h3>
                      <p className="poste-bureau">{m.poste}</p>
                      {m.poste === 'Président' && m.telephone && (
                        <p className="contact-bureau">
                          Contact du président :{' '}
                          <a href={'tel:' + String(m.telephone).replace(/\s/g, '')}>{m.telephone}</a>
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
            {anciens.length > 0 && (
              <div className="section-anciens">
                <h3>Anciens membres du bureau</h3>
                <p className="intro">
                  Ils ont dirigé l’amicale avant le bureau actuel.
                </p>
                <ul className="liste-simple">
                  {anciens.map((m) => (
                    <li key={m.id}>
                      <strong>
                        {m.prenom} {m.nom}
                      </strong>{' '}
                      — {m.poste}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <div className="conteneur">
          <h2>Découvrir les formations de l’UAM</h2>
          <p className="intro">Touche une carte pour voir les formations, les débouchés et l’admission.</p>
          <ul className="filieres">
            {FILIERES.map((f) => {
              const morceaux = f.court.split(' ')
              const type = morceaux[0]
              const sigle = morceaux.slice(1).join(' ')
              return (
                <li key={f.court}>
                  <button
                    type="button"
                    className="carte-filiere"
                    onClick={() => setFiliereOuverte(f)}
                    aria-haspopup="dialog"
                  >
                    <span className="filiere-type">{type}</span>
                    <strong>{sigle}</strong>
                    <span className="filiere-nom">{f.long}</span>
                    <span className="filiere-voir" aria-hidden="true">
                      Voir la fiche →
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="niveaux">
            Niveaux : <strong>{NIVEAUX.join(' · ')}</strong>
          </p>
          {filiereOuverte && <FicheFormation filiere={filiereOuverte} onFermer={fermerFiliere} />}
        </div>
      </section>

      <section className="section section-cta">
        <div className="conteneur">
          <div className="cta">
            <h2>Devenir membre</h2>
            <p className="intro">
              Remplis le formulaire : le bureau t’ajoute à la liste des membres.
            </p>
            <a className="bouton" href={FORMULAIRE_INSCRIPTION} target="_blank" rel="noreferrer">
              Rejoindre l’amicale
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
