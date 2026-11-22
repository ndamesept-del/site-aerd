// Données fixes du site AERD/UAM : filières, niveaux, liens utiles.

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

// Met en forme une date (AAAA-MM-JJ) en français, ex : samedi 12 décembre 2026
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Petit nettoyage d'un numéro de téléphone (espaces en trop retirés)
export function normaliserTelephone(valeur) {
  return String(valeur || '').replace(/\s+/g, ' ').trim()
}

// Règle des désistements : on ne peut plus se désister quand il reste
// moins de 24 heures avant le départ de la caravane. Un désistement
// de dernière minute peut porter préjudice à la caravane et la retarder.
export const DELAI_DESISTEMENT_HEURES = 24

// Date et heure de départ d'une caravane (date_depart AAAA-MM-JJ,
// heure_depart HH:MM, 08:00 par défaut). L'heure est l'heure de Dakar (UTC+0).
export function dateDepartCaravane(caravane) {
  const heure = String((caravane && caravane.heure_depart) || '08:00').slice(0, 5)
  return new Date(caravane.date_depart + 'T' + heure + ':00Z')
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
