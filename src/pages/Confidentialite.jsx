// Page « Confidentialité » : quelles données l'amicale collecte,
// pourquoi, qui les voit, et comment demander leur suppression.

export default function Confidentialite({ aller }) {
  return (
    <div className="conteneur">
      <section className="section">
        <h2>Confidentialité</h2>
        <p className="intro">
          Cette page explique quelles informations l’amicale collecte sur ce site, pourquoi, et qui peut les voir.
          Le bureau de l’amicale est responsable de ces données.
        </p>

        <h3>Quelles données on collecte</h3>
        <ul className="liste-simple">
          <li>
            <strong>Pour devenir membre :</strong> prénom, nom, numéro de téléphone, filière ou département,
            niveau (L1 à M2), téléphone d’un parent en cas d’urgence, et si tu es de Diourbel ou de Bambey.
            Quand le champ existera, le lieu où tu habites pendant tes études.
          </li>
          <li>
            <strong>Pour une caravane :</strong> prénom, nom et numéro de téléphone, pour t’inscrire et te
            retrouver dans la liste des inscrits.
          </li>
          <li>
            <strong>Pour le bureau :</strong> prénom, nom, poste dans l’amicale et photo, pour présenter
            l’organigramme sur la page d’accueil.
          </li>
        </ul>

        <h3>Pourquoi on les collecte</h3>
        <p>
          Uniquement pour faire vivre l’amicale : gérer la liste des membres, organiser les caravanes
          (inscriptions, paiements, désistements) et présenter le bureau. Rien d’autre.
        </p>

        <h3>Qui peut les voir</h3>
        <ul className="liste-simple">
          <li>
            <strong>Le bureau seulement</strong> voit les numéros de téléphone et les informations complètes
            des membres. Ces informations ne sont jamais publiques.
          </li>
          <li>
            <strong>La liste publique des inscrits d’une caravane</strong> montre seulement le prénom, le nom
            et le statut de paiement (« Payé » ou « En attente »). Les numéros de téléphone ne s’affichent
            jamais sur cette liste.
          </li>
          <li>
            <strong>La page d’accueil</strong> montre la photo, le nom et le poste des membres du bureau.
          </li>
        </ul>

        <h3>Combien de temps on les garde</h3>
        <p>
          Tes informations restent dans la base de l’amicale tant que tu es membre. Quand tu quittes l’amicale
          ou que tu le demandes, le bureau les supprime.
        </p>

        <h3>Demander la suppression de tes données</h3>
        <p>
          Tu peux demander à tout moment au bureau de corriger ou de supprimer tes informations.
          Contacte un membre du bureau ou écris au bureau de l’amicale, et ta demande sera traitée.
        </p>

        <h3>Cookies et suivi</h3>
        <p>
          Ce site ne dépose aucun cookie de suivi et ne mesure pas ton activité. Il n’y a ni publicité,
          ni traqueur d’audience. Tes données ne sont ni vendues, ni partagées avec qui que ce soit
          d’autre que le bureau de l’amicale.
        </p>

        <div className="actions">
          <button type="button" className="bouton" onClick={() => aller('accueil')}>
            Retour à l’accueil
          </button>
        </div>
      </section>
    </div>
  )
}
