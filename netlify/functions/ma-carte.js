// Ma carte de membre (public, sans jeton).
//
// On retrouve le membre par son NOM (prénom + nom), pas par son numéro
// de téléphone : le numéro peut changer (une personne peut avoir deux
// numéros), alors que le nom ne change pas. Si plusieurs membres ont le
// même nom, le site les propose tous et la personne choisit le sien.
//
// POST /.netlify/functions/ma-carte  { prenom, nom }
//   Recherche par nom. Renvoie { membres: [...] } : prénom, nom, numéro
//   de carte, carte payée, paiement déclaré, filière et niveau seulement.
//   Ni le numéro de téléphone, ni le numéro du parent, ni le statut
//   boursier ne sortent.
//
// POST /.netlify/functions/ma-carte  { action: 'declarer-paiement', id }
//   Le membre déclare avoir payé sa carte (1 000 FCFA). Il apparaît
//   alors en haut de l'onglet « Cartes de membres » du bureau
//   (« Paiements déclarés – à valider »), pour que le trésorier le
//   valide directement. Le trésorier vérifie le vrai paiement avant de
//   valider : déclarer ne donne pas la carte tout seul.
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()
  if (event.httpMethod !== 'POST') return erreur('Méthode non autorisée.', 405)

  try {
    const corps = lireCorps(event)

    // Déclarer son paiement.
    if (corps.action === 'declarer-paiement') {
      const id = Number(corps.id)
      if (!id) return erreur('Membre introuvable.', 400)
      const res = await pool.query(
        `UPDATE membres SET carte_paiement_declare = TRUE WHERE id = $1 AND carte_payee = FALSE
         RETURNING id, prenom, nom, numero_carte, carte_payee, carte_paiement_declare, ufr_departement, niveau`,
        [id]
      )
      if (res.rows.length === 0) {
        return erreur('Membre introuvable ou carte déjà payée.', 404)
      }
      const m = res.rows[0]
      return reponse(200, {
        membre: {
          id: m.id,
          prenom: m.prenom,
          nom: m.nom,
          numero_carte: m.numero_carte,
          carte_payee: !!m.carte_payee,
          carte_paiement_declare: !!m.carte_paiement_declare,
          ufr_departement: m.ufr_departement,
          niveau: m.niveau
        }
      })
    }

    // Recherche par nom.
    const prenom = nettoyerTexte(corps.prenom)
    const nom = nettoyerTexte(corps.nom)
    if (prenom.length < 2 || nom.length < 2) {
      return erreur('Écris ton prénom et ton nom en entier.', 400)
    }
    const res = await pool.query(
      `SELECT id, prenom, nom, numero_carte, carte_payee, carte_paiement_declare, ufr_departement, niveau
       FROM membres
       WHERE prenom ILIKE $1 AND nom ILIKE $2
       ORDER BY prenom ASC, nom ASC
       LIMIT 10`,
      ['%' + prenom + '%', '%' + nom + '%']
    )
    return reponse(200, {
      membres: res.rows.map((m) => ({
        id: m.id,
        prenom: m.prenom,
        nom: m.nom,
        numero_carte: m.numero_carte,
        carte_payee: !!m.carte_payee,
        carte_paiement_declare: !!m.carte_paiement_declare,
        ufr_departement: m.ufr_departement,
        niveau: m.niveau
      }))
    })
  } catch (e) {
    console.error(e)
    return erreur('Une erreur est survenue.')
  }
}
