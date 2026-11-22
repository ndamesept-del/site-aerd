import { useEffect, useState } from 'react'
import { FILIERES, NIVEAUX, FORMULAIRE_INSCRIPTION, formatDate, formatMontant } from '../data.js'
import { api } from '../api.js'

function initiales(prenom, nom) {
  const lettres = (String(prenom || '').trim().charAt(0) + String(nom || '').trim().charAt(0)).toUpperCase()
  return lettres || '?'
}

export default function Accueil({ aller }) {
  const [prochaine, setProchaine] = useState(null)
  const [charge, setCharge] = useState(true)
  const [bureau, setBureau] = useState([])
  const [anciens, setAnciens] = useState([])

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
          <h2>Présents dans chaque filière de l’UAM</h2>
          <p className="intro">
            En licence ou en master, dans toutes les filières.
          </p>
          <ul className="filieres">
            {FILIERES.map((f) => (
              <li key={f.court}>
                <strong>{f.court}</strong> — {f.long}
              </li>
            ))}
          </ul>
          <p className="niveaux">
            Niveaux : <strong>{NIVEAUX.join(' · ')}</strong>
          </p>
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
