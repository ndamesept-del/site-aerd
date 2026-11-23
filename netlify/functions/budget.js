// Budget de l'amicale, pour le président et le trésorier (jeton budget).
//
// GET  /.netlify/functions/budget
//   Les entrées sont calculées toutes seules à partir de ce que le site
//   connaît déjà : cotisations payées (500 FCFA), cartes de membres
//   payées (1 000 FCFA), places de caravane payées (montant affiché de
//   la caravane). Les sorties sont les dépenses saisies par le bureau.
//   Renvoie { entrees: { cotisations, cartes, caravanes, total },
//   depenses: [...], total_depenses, solde }.
// POST /.netlify/functions/budget
//   { action: 'ajouter', date, libelle, montant_fcfa, categorie } :
//   ajouter une dépense.
//   { action: 'supprimer', id } : supprimer une dépense.
import { getPool, reponse, erreur, pasDeBase, lireCorps, nettoyerTexte } from './db.js'
import { jetonBudgetValide, nonAutoriseBudget } from './auth.js'

// Prix de la carte de membre (même valeur que PRIX_CARTE_FCFA dans src/data.js).
const PRIX_CARTE_FCFA = 1000

const CATEGORIES_DEPENSE = ['Carburant', 'Chauffeur', 'Aide sociale', 'Impression', 'Événement', 'Autre']

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()
  if (!jetonBudgetValide(event)) return nonAutoriseBudget()

  try {
    if (event.httpMethod === 'GET') {
      const cotisations = await pool.query(
        `SELECT COALESCE(SUM(montant_fcfa), 0)::int AS total FROM cotisations WHERE statut = 'paye'`
      )
      const cartes = await pool.query(
        `SELECT COUNT(*)::int AS n FROM membres WHERE carte_payee = TRUE`
      )
      const caravanes = await pool.query(
        `SELECT COALESCE(SUM(c.montant_fcfa), 0)::int AS total
         FROM inscriptions i JOIN caravanes c ON c.id = i.caravane_id
         WHERE i.statut = 'payé'`
      )
      const depenses = await pool.query(
        `SELECT id, date_depense, libelle, categorie, montant_fcfa
         FROM depenses ORDER BY date_depense DESC, id DESC`
      )
      const entrees = {
        cotisations: Number(cotisations.rows[0].total),
        cartes: Number(cartes.rows[0].n) * PRIX_CARTE_FCFA,
        caravanes: Number(caravanes.rows[0].total)
      }
      entrees.total = entrees.cotisations + entrees.cartes + entrees.caravanes
      const totalDepenses = depenses.rows.reduce((s, d) => s + Number(d.montant_fcfa), 0)
      return reponse(200, {
        entrees,
        depenses: depenses.rows.map((d) => ({
          id: d.id,
          date: String(d.date_depense).slice(0, 10),
          libelle: d.libelle,
          categorie: d.categorie,
          montant_fcfa: Number(d.montant_fcfa)
        })),
        total_depenses: totalDepenses,
        solde: entrees.total - totalDepenses
      })
    }

    if (event.httpMethod === 'POST') {
      const corps = lireCorps(event)
      const action = nettoyerTexte(corps.action)
      if (action === 'ajouter') {
        const date = nettoyerTexte(corps.date)
        const libelle = nettoyerTexte(corps.libelle)
        const montant = Number(corps.montant_fcfa)
        let categorie = nettoyerTexte(corps.categorie) || 'Autre'
        if (!CATEGORIES_DEPENSE.includes(categorie)) categorie = 'Autre'
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return erreur('Date invalide. Utilise le format AAAA-MM-JJ.', 400)
        if (!libelle || libelle.length > 120) return erreur('Le motif de la dépense est obligatoire (120 caractères au maximum).', 400)
        if (!Number.isInteger(montant) || montant <= 0) return erreur('Le montant doit être un nombre entier supérieur à 0.', 400)
        const res = await pool.query(
          `INSERT INTO depenses (date_depense, libelle, categorie, montant_fcfa)
           VALUES ($1, $2, $3, $4) RETURNING id, date_depense, libelle, categorie, montant_fcfa`,
          [date, libelle, categorie, montant]
        )
        const d = res.rows[0]
        return reponse(200, {
          depense: { id: d.id, date: String(d.date_depense).slice(0, 10), libelle: d.libelle, categorie: d.categorie, montant_fcfa: Number(d.montant_fcfa) }
        })
      }
      if (action === 'supprimer') {
        const id = Number(corps.id)
        if (!id) return erreur('Dépense introuvable.', 400)
        await pool.query(`DELETE FROM depenses WHERE id = $1`, [id])
        return reponse(200, { supprime: true })
      }
      return erreur('Action inconnue.', 400)
    }

    return erreur('Méthode non autorisée.', 405)
  } catch (e) {
    return erreur(e.message || 'Une erreur est survenue.', 500)
  }
}
