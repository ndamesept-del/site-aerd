// Page 404 de l'application React : affichée quand l'adresse
// demandée ne correspond à aucune page du site.

export default function Introuvable({ aller }) {
  return (
    <div className="conteneur">
      <section className="section" style={{ textAlign: 'center' }}>
        <h2>Page introuvable</h2>
        <p className="intro" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          Cette page n’existe pas (ou plus). L’adresse est peut-être mal écrite, ou la page a été déplacée.
          Reviens à l’accueil pour retrouver les caravanes, les membres et le bureau de l’amicale.
        </p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="bouton" onClick={() => aller('accueil')}>
            Retour à l’accueil
          </button>
        </div>
      </section>
    </div>
  )
}
