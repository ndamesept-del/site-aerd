// Page « Conditions d'utilisation » du site de l'amicale AERD/UAM.

export default function Conditions({ aller }) {
  return (
    <div className="conteneur">
      <section className="section">
        <h2>Conditions d’utilisation</h2>
        <p className="intro">
          Ce site est celui de l’Amicale des Étudiants Ressortissants de Diourbel (AERD/UAM),
          à l’Université Amadou Mahtar Mbow de Diamniadio. En l’utilisant, tu acceptes ces règles simples.
        </p>

        <h3>À qui sert ce site</h3>
        <p>
          Aux étudiants de Diourbel et de Bambey qui étudient à l’UAM, et aux membres du bureau de l’amicale.
          L’espace bureau est réservé aux membres du bureau.
        </p>

        <h3>Devenir membre</h3>
        <p>
          L’inscription à l’amicale est gratuite. Tu remplis le formulaire d’inscription, le bureau vérifie
          tes informations et t’ajoute à la liste des membres. Donne des informations exactes : ton prénom,
          ton nom et ton numéro de téléphone servent à te retrouver pour les caravanes.
        </p>

        <h3>Les caravanes</h3>
        <ul className="liste-simple">
          <li>
            <strong>Inscription :</strong> le bureau crée la caravane, et tu t’inscris toi-même sur le site
            public avec ton prénom, ton nom et ton numéro de téléphone.
          </li>
          <li>
            <strong>Paiement :</strong> tu paies ta place par Wave ou Orange Money au numéro du responsable
            indiqué sur la caravane. Le bureau confirme ton paiement après vérification et coche « Payé ».
            Le site ne prend pas l’argent directement : il n’y a pas de paiement automatique.
          </li>
          <li>
            <strong>Désistement :</strong> si tu ne peux plus venir, désiste-toi au moins 24 heures avant
            le départ, pour libérer ta place et ne pas retarder la caravane. Moins de 24 heures avant le
            départ, les désistements sont fermés : contacte le bureau si tu as un problème. Le bureau peut
            toujours retirer quelqu’un de la liste.
          </li>
        </ul>

        <h3>La liste des inscrits</h3>
        <p>
          La liste des inscrits d’une caravane est publique : elle montre le prénom, le nom et le statut
          de paiement de chacun, pour que tout le monde puisse vérifier son inscription. Les numéros de
          téléphone ne s’affichent jamais sur cette liste.
        </p>

        <h3>Ce qu’il ne faut pas faire</h3>
        <p>
          Ne t’inscris pas avec un faux nom ou un faux numéro, ne t’inscris pas plusieurs fois à la même
          caravane, et n’essaie pas de modifier les informations des autres. Le bureau peut retirer une
          inscription qui ne respecte pas ces règles.
        </p>

        <h3>Responsabilité</h3>
        <p>
          L’amicale fait de son mieux pour que les informations du site soient justes (dates, montants,
          numéros), mais vérifie toujours la date et le lieu de départ avant de venir. En cas de problème,
          contacte directement un membre du bureau.
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
