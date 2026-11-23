// Vérifier une carte de membre (privé : jeton du bureau obligatoire).
//
// La vérification est réservée au bureau : le public ne voit plus cette
// page. Le QR code de la carte reste un lien vers cette vérification,
// avec le numéro de la carte :
//   GET /.netlify/functions/verifier-carte?numero=AERD-2026-001
//
// Quand on scanne le QR sans être connecté au bureau, la page demande
// d'abord le mot de passe du bureau, puis elle vérifie.
//
// On ne renvoie que le prénom, le nom, le numéro de carte et si elle est
// payée : jamais le numéro de téléphone, ni le numéro du parent, ni le
// statut boursier.
//
//   - numéro trouvé + carte payée : { authentique: true, membre }
//   - numéro trouvé + carte pas payée : { authentique: false, raison: 'non-validee', membre }
//   - numéro introuvable : { authentique: false, raison: 'inconnu' }
//
// Une carte inventée (par exemple fabriquée par une IA) porte un numéro
// qui n'existe pas dans la base : elle est détectée ici. Une photocopie
// d'une vraie carte reste authentique : celui qui vérifie doit comparer
// le nom affiché avec le nom écrit sur la carte.
import { getPool, reponse, erreur, pasDeBase, nettoyerTexte } from './db.js'
import { jetonValide, nonAutorise } from './auth.js'

export async function handler(event) {
  const pool = getPool()
  if (!pool) return pasDeBase()
  if (event.httpMethod !== 'GET') return erreur('Méthode non autorisée.', 405)
  if (!jetonValide(event)) return nonAutorise()

  const numero = nettoyerTexte(event.queryStringParameters?.numero)
    .toUpperCase()
    .replace(/\s+/g, '')
  if (!numero) return erreur('Numéro de carte manquant.', 400)

  try {
    const res = await pool.query(
      'SELECT id, prenom, nom, numero_carte, carte_payee FROM membres WHERE numero_carte = $1',
      [numero]
    )
    if (res.rows.length === 0) {
      return reponse(200, { authentique: false, raison: 'inconnu', numero })
    }
    const m = res.rows[0]
    return reponse(200, {
      authentique: !!m.carte_payee,
      raison: m.carte_payee ? null : 'non-validee',
      numero: m.numero_carte,
      membre: {
        id: m.id,
        prenom: m.prenom,
        nom: m.nom,
        numero_carte: m.numero_carte,
        carte_payee: !!m.carte_payee
      }
    })
  } catch {
    return erreur('Erreur de vérification.')
  }
}
