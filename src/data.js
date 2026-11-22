// Données fixes du site AERD/UAM : filières, niveaux, liens utiles.

// Filières (structures de l'UAM) présentes à l'amicale. Seuls « court » et
// « long » servent à l'espace bureau et aux fiches des membres : ne pas
// changer ces libellés. Les fiches détaillées de la page d'accueil
// (formations, débouchés, admission) sont dans formations.js.
export const FILIERES = [
  { court: 'UFR SEG', long: 'Sciences Économiques et de Gestion' },
  { court: 'UFR STA', long: 'Sciences et Technologies Avancées' },
  { court: 'UFR TECNA', long: 'Technologies de la Communication Numérique et de l’Audiovisuel' },
  { court: 'Polytech DGAE', long: 'Géosciences Appliquées et Environnement' },
  { court: 'Polytech DSTI', long: 'Sciences et Techniques de l’Ingénieur' },
  { court: 'Polytech DU2ADT', long: 'Urbanisme, Architecture et Aménagement Durable des Territoires' },
  { court: 'Polytech DGO', long: 'Gestion des Organisations' },
  { court: 'Polytech DSTAAN', long: 'Sciences et Techniques Agricoles, Alimentaires et Nutritionnelles' }
]

export const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2']

export const ORIGINES = ['Diourbel', 'Bambey']

// Postes du bureau de l'amicale, proposés dans le formulaire
// de l'organigramme (le poste reste un texte libre).
export const POSTES_BUREAU = [
  'Président',
  'Secrétaire général',
  'Secrétaire général adjoint',
  'Trésorier',
  'Président de la commission pédagogique',
  'Président de la commission sociale'
]

// Met en forme un montant en FCFA, ex : 7 500 FCFA
export function formatMontant(montant) {
  if (montant == null || montant === '') return ''
  const n = Number(montant)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('fr-FR') + ' FCFA'
}

// Formulaire Google Forms de l'amicale (inscription des membres).
// Le bureau ajoute ensuite les membres dans l'espace bureau.
export const FORMULAIRE_INSCRIPTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSf8jPCCyyJYzn9BS6qPUFTTW2xZOyvSZZ030FpM1tH2faqdAg/viewform'

// Met en forme une date en français, ex : samedi 12 décembre 2026.
// La date arrive soit en « AAAA-MM-JJ » (formulaire), soit en texte ISO
// complet (« 2026-11-29T00:00:00.000Z ») quand elle vient de la base de
// données : on ne garde que les 10 premiers caractères, sinon la date
// s'affichait telle quelle, en brut, sur la carte.
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const jour = String(dateStr).slice(0, 10)
  const d = new Date(jour + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return String(dateStr)
  const texte = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  // Le jour commence par une majuscule : « Dimanche 29 novembre 2026 »,
  // pas « dimanche 29 novembre 2026 ».
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

// Lieu de départ d'une caravane, selon sa destination.
// La caravane part toujours de l'autre ville : vers Diourbel ou Bambey,
// on part de Dakar (UAM, Diamniadio) ; vers Dakar, on part de Diourbel
// (Gouvernance de Diourbel). Le bureau peut toujours modifier le lieu.
export function lieuDepartParDefaut(destination) {
  const d = String(destination || '').toLowerCase()
  if (d.includes('dakar') || d.includes('diamniadio')) return 'Gouvernance de Diourbel'
  if (d.includes('diourbel') || d.includes('bambey')) return 'UAM, Diamniadio'
  return ''
}

// Petit nettoyage d'un numéro de téléphone (espaces en trop retirés)
export function normaliserTelephone(valeur) {
  return String(valeur || '').replace(/\s+/g, ' ').trim()
}

// Carte de membre : prix décidé par le bureau (1000 FCFA, novembre 2026).
// Le membre paie par Wave ou Orange Money au trésorier, le bureau confirme
// le paiement, puis le membre télécharge sa carte avec QR code.
export const PRIX_CARTE_FCFA = 1000

// Numéro de carte : AERD-2026-001, AERD-2026-002, etc. L'année est celle
// de l'attribution, le numéro est séquentiel dans l'année.
export function formaterNumeroCarte(annee, numero) {
  return 'AERD-' + annee + '-' + String(numero).padStart(3, '0')
}

// Texte du QR code de la carte : le nom et le numéro du membre.
export function texteQRCarte(membre) {
  return 'AERD/UAM - ' + membre.prenom + ' ' + membre.nom + ' - ' + membre.numero_carte
}

// Cotisation mensuelle du volet social : chaque membre paye ce montant
// chaque mois (500 FCFA). Le bureau suit les paiements dans l'espace
// bureau (onglet « Cotisations ») et coche « Payé » après vérification.
export const MONTANT_COTISATION = 500

// Mois courant au format « AAAA-MM », ex : « 2026-11 ».
// L'heure est celle de Dakar (UTC+0).
export function moisCourant() {
  return new Date().toISOString().slice(0, 7)
}

// Mois « AAAA-MM » en français, ex : « novembre 2026 ».
export function formatMois(mois) {
  if (!/^\d{4}-\d{2}$/.test(String(mois || ''))) return String(mois || '')
  const d = new Date(mois + '-01T12:00:00')
  if (Number.isNaN(d.getTime())) return String(mois)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// Règle des désistements : on ne peut plus se désister quand il reste
// moins de 24 heures avant le départ de la caravane. Un désistement
// de dernière minute peut porter préjudice à la caravane et la retarder.
export const DELAI_DESISTEMENT_HEURES = 24

// Date et heure de départ d'une caravane (date_depart AAAA-MM-JJ,
// heure_depart HH:MM, 08:00 par défaut). L'heure est l'heure de Dakar (UTC+0).
export function dateDepartCaravane(caravane) {
  const heure = String((caravane && caravane.heure_depart) || '08:00').slice(0, 5)
  const jour = String((caravane && caravane.date_depart) || '').slice(0, 10)
  return new Date(jour + 'T' + heure + ':00Z')
}

// Vrai si on peut encore se désister (24 h ou plus avant le départ).
export function desistementOuvert(caravane) {
  if (!caravane || !caravane.date_depart) return true
  const depart = dateDepartCaravane(caravane)
  if (Number.isNaN(depart.getTime())) return true
  return depart.getTime() - Date.now() >= DELAI_DESISTEMENT_HEURES * 3600 * 1000
}

// Heure de départ en français, ex : 08:00
export function formatHeure(heureStr) {
  return String(heureStr || '08:00').slice(0, 5)
}
