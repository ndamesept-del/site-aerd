import { useEffect, useState } from 'react'
import { FILIERES, NIVEAUX, FORMULAIRE_INSCRIPTION, formatDate } from '../data.js'
import { api } from '../api.js'

export default function Accueil({ aller }) {
  const [prochaine, setProchaine] = useState(null)
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    api
      .caravanesPubliques()
      .then((data) => {
        setProchaine(data.caravanes && data.caravanes.length > 0 ? data.caravanes[0] : null)
      })
      .catch(() => setProchaine(null))
      .finally(() => setCharge(false))
  }, [])

  return (
    <div>
      <section className="hero">
        <div className="conteneur">
          <hr className="regle-or" />
          <h1>Les étudiants de Diourbel et de Bambey, réunis à l’UAM.</h1>
          <p className="chapeau">
            L’amicale accueille les nouveaux bacheliers de Diourbel et de Bambey à l’Université Amadou Mahtar Mbow,
            à Diamniadio. On vous aide à trouver vos repères sur le campus, et on organise ensemble les caravanes
            de retour au pays.
          </p>
          <div className="actions">
            <button type="button" className="bouton" onClick={() => aller('caravanes')}>
              Voir les prochaines caravanes
            </button>
            <a className="bouton bouton-secondaire" href={FORMULAIRE_INSCRIPTION} target="_blank" rel="noreferrer">
              Devenir membre de l’amicale
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
            L’amicale, c’est un réseau d’entraide entre les étudiants originaires de Diourbel et de Bambey
            qui étudient à l’UAM. Le bureau est élu par les membres, et tout le travail est bénévole.
          </p>
          <ul className="liste-simple">
            <li>
              <strong>Accueillir les nouveaux bacheliers.</strong> Orientation, parrainage par les anciens,
              informations pratiques dès l’arrivée à Diamniadio : filière, logement, repères sur le campus.
            </li>
            <li>
              <strong>Organiser les caravanes.</strong> Des départs groupés vers Diourbel et Bambey, avec une liste
              d’inscrits et un suivi des paiements, pour que personne ne soit oublié et que l’argent soit clair.
            </li>
            <li>
              <strong>Garder le lien entre les anciens chauffeurs et les nouveaux.</strong> L’annuaire des chauffeurs
              permet aux futurs responsables de retrouver facilement les chauffeurs déjà utilisés.
            </li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="conteneur">
          <h2>Prochaine caravane</h2>
          {charge && <p className="chargement">Chargement…</p>}
          {!charge && !prochaine && (
            <p className="intro">
              Aucune caravane n’est programmée pour le moment. Les prochaines dates seront annoncées ici
              par le bureau de l’amicale.
            </p>
          )}
          {!charge && prochaine && (
            <div className="carte carte-caravane">
              <h3>{prochaine.destination}</h3>
              <p className="date">{formatDate(prochaine.date_depart)}</p>
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

      <section className="section">
        <div className="conteneur">
          <h2>Présents dans chaque filière de l’UAM</h2>
          <p className="intro">
            Que vous soyez en licence ou en master, l’amicale vous accueille. Chaque membre est enregistré
            avec sa filière et son niveau, pour mieux vous orienter et vous mettre en relation avec les
            étudiants de votre parcours.
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

      <section className="section">
        <div className="conteneur">
          <h2>Devenir membre</h2>
          <p className="intro">
            Pour rejoindre l’amicale, remplis le formulaire d’inscription. Le bureau vérifie tes informations
            et t’ajoute à la liste des membres. Tes informations restent dans l’amicale.
          </p>
          <a className="bouton bouton-bleu" href={FORMULAIRE_INSCRIPTION} target="_blank" rel="noreferrer">
            Remplir le formulaire d’inscription
          </a>
        </div>
      </section>
    </div>
  )
}
