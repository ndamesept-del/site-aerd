// Fiches de présentation des structures de l'UAM, affichées dans les
// fenêtres de la page d'accueil (section « Découvrir les formations »).
//
// Ces fiches sont rattachées à la liste FILIERES de data.js par la clé
// « court » (ex. « UFR SEG », « Polytech DSTAAN »). La liste FILIERES,
// elle, ne change pas : l'espace bureau et les fiches des membres
// continuent de l'utiliser telle quelle.
//
// Source : pages officielles de l'UAM (uam.sn) et brochure / appel à
// candidatures de Polytech Diamniadio (polytech.sn). Les conditions
// d'admission et les dates changent chaque année : chaque fiche invite
// à vérifier sur le site officiel. Quand une information n'a pas pu être
// confirmée, la fiche le dit dans « note » au lieu de l'affirmer.

const ADMISSION_POLYTECH =
  'Entrée en 1re année par concours, organisé chaque année après le baccalauréat (dépôt du dossier en ligne ; les candidats titulaires d’un bac étranger sont retenus sur dossier).'
const ADMISSION_POLYTECH_SUITE =
  'Entrée en 3e année de licence sur dossier ; cycle ingénieur à partir de la 4e année, sur dossier, selon les règles de chaque département.'

export const FICHES = {
  'UFR SEG': {
    resume:
      'Structure de l’UAM dédiée à l’économie et à la gestion.',
    formations: [
      'Licence en sciences économiques et de gestion, avec quatre parcours : Économie industrielle et innovation, Économie appliquée, Finance et comptabilité, Management des organisations.',
      'Enseignement en présentiel et à distance, avec stages en entreprise obligatoires.'
    ],
    debouches: [
      'Analyste économique et statisticien, analyste financier, auditeur interne',
      'Assistant en gestion de projet, ingénieur organisation',
      'Organisations internationales, ONG, entreprises, banques, assurances, éducation et recherche'
    ],
    admission: [
      'Entrée en 1re année de licence par concours pour plusieurs séries de bac, dont L2, F6, STEG (G), S1, S1A, S2, S2A et S3.',
      'Entrée en L2 ou L3 avec 60 ou 120 crédits du même parcours, ou sur dossier.',
      'Étudiants étrangers : demande d’admission préalable, avec étude du dossier.'
    ],
    note:
      'Ces informations viennent de la page officielle de la Haute École des Sciences Économiques et de Gestion (HEEG) de l’UAM. Je n’ai pas pu lire la page de l’UFR SEG elle-même pour confirmer que les parcours et les conditions sont identiques : vérifie-la avant de t’y fier.',
    liens: [
      {
        libelle: 'Page officielle de l’UFR SEG',
        url: 'https://uam.sn/unite-de-formation-et-de-recherche-sciences-economiques-et-de-gestion-ufr-seg/'
      },
      {
        libelle: 'Page de la HEEG (économie et gestion)',
        url: 'https://uam.sn/haute-ecole-des-sciences-economiques-et-de-gestion-heeg/'
      }
    ]
  },

  'UFR STA': {
    resume:
      'Sciences, technologies, numérique et innovation. Formations professionnalisantes adossées à la recherche.',
    formations: [
      'Département Mathématiques, Informatique et Modélisation : Mathématiques, Physique et Informatique (MPI) ; Mathématiques Appliquées aux Sciences Sociales (MASS).',
      'Département des Sciences de la Matière et de l’Univers : Sciences de la Mer et du Littoral (SML) ; Physique et Applications (PA).',
      'Diplômes : licence, master et doctorat. Exemples de masters : Big data, Internet des objets et IA ; Cyber Security ; Robotique ; Bio-informatique ; Économie bleue ; Sciences et technologies spatiales.'
    ],
    debouches: [
      'MPI : enseignement, développement logiciel, science des données, cybersécurité, réseaux, intelligence artificielle, recherche',
      'MASS : finance, assurance, banque, gestion des risques, audit, économie, marketing',
      'SML : recherche en biologie marine, génie côtier et portuaire, pêche et aquaculture, environnement',
      'PA : matériaux, énergie, eau, spatial, nanosciences'
    ],
    admission: [
      'MPI et SML : bac S1, S1A, S2, S2A, S3 ou S4.',
      'MASS : mêmes séries, plus STEG.',
      'Physique et Applications : conditions non précisées sur la page consultée.'
    ],
    note: null,
    liens: [
      {
        libelle: 'Page officielle de l’UFR STA',
        url: 'https://uam.sn/unite-de-formation-et-de-recherche-sciences-et-technologies-avancees-ufr-sta/'
      }
    ]
  },

  'UFR TECNA': {
    resume:
      'Numérique, communication, image et spectacle. Trois départements, avec un tronc commun puis une spécialisation.',
    formations: [
      'Communication numérique et multimédia.',
      'Infographie et design numérique.',
      'Technologies de l’audiovisuel et du spectacle vivant.',
      'Licence : tronc commun en L1 et L2, spécialisation à partir de la L3.'
    ],
    debouches: [
      'Communication numérique : journaliste numérique, community manager, chargé de publicité ou d’e-réputation',
      'Infographie et design : web designer-développeur, infographiste de mise en page ou de montage',
      'Audiovisuel et spectacle vivant : réalisateur, producteur, régisseur (cinéma, télévision, spectacle)'
    ],
    admission: [
      'Bac de la série L (liste exacte des séries à vérifier sur la page officielle).',
      'Les candidats sont classés sur la plateforme d’orientation Campusen, avec des pondérations de matières selon le parcours.'
    ],
    note:
      'Ces informations viennent de la page officielle du département Audiovisuel et spectacle vivant. Je n’ai pas pu ouvrir la page principale de l’UFR TECNA : vérifie-la pour les séries de bac et les masters éventuels.',
    liens: [
      {
        libelle: 'Page officielle de l’UFR TECNA',
        url: 'https://uam.sn/unite-de-formation-et-de-recherche-technologies-de-la-communication-numerique-et-de-laudiovisuel-ufr-tecna/'
      }
    ]
  },

  'Polytech DGAE': {
    resume:
      'Département de l’École supérieure polytechnique de Diamniadio. Géosciences, environnement et ressources en eau.',
    formations: [
      'Filières : Environnement ; Géomatique ; Hydraulique et assainissement ; Mines et géologie.',
      'Cycles : licence, master et ingénieur de conception.'
    ],
    debouches: [
      'Environnement : environnementaliste, responsable QHSE ou RSE, conseiller en développement durable',
      'Géomatique : géomaticien, cartographe, administrateur de bases de données, télépilote de drone',
      'Hydraulique et assainissement : hydraulicien, technicien ou ingénieur assainissement, génie rural',
      'Mines et géologie : géologue minier, hydrogéologue, géophysicien, géotechnicien'
    ],
    admission: [
      ADMISSION_POLYTECH,
      'Séries scientifiques (S1, S1A, S2, S2A, S3, S4, S5) selon la page de présentation de Polytech.',
      ADMISSION_POLYTECH_SUITE
    ],
    note:
      'Selon les documents de l’UAM, la liste des séries de bac acceptées n’est pas toujours la même : vérifie-la pour l’année qui t’intéresse.',
    liens: [
      {
        libelle: 'Présentation de Polytech Diamniadio',
        url: 'https://uam.sn/presentation-polytech-diamniadio/'
      }
    ]
  },

  'Polytech DSTI': {
    resume:
      'Département de formation d’ingénieurs, issu de l’ancienne École supérieure des Sciences et Techniques de l’Ingénieur (ESTI).',
    formations: [
      'Génie des procédés.',
      'Infrastructures et génie civil.',
      'Électronique et télécommunications, et Ingénierie informatique.',
      'Systèmes électriques et énergétiques.',
      'Cycles : licence, master et ingénieur de conception.'
    ],
    debouches: [
      'Informatique et télécoms : architecte système, développeur full stack, data scientist, administrateur systèmes et réseaux',
      'Génie civil : ingénieur ou technicien en travaux publics, conducteur de travaux, responsable de chantier',
      'Génie des procédés : responsable de production, responsable QHSE (chimie, agroalimentaire, pharmacie)',
      'Énergie : conducteur de centrale, auditeur énergétique, technicien en énergies renouvelables'
    ],
    admission: [
      'Concours d’entrée en 1re année, ouvert aux bacheliers des séries S1, S1A, S2, S2A, S3, S4, S5, F6, T1 et T2.',
      ADMISSION_POLYTECH_SUITE
    ],
    note: null,
    liens: [
      {
        libelle: 'Page officielle du département',
        url: 'https://uam.sn/sciences-et-techniques-de-lingenieur/'
      }
    ]
  },

  'Polytech DU2ADT': {
    resume:
      'Département de Polytech Diamniadio consacré à la ville, à l’architecture et à l’aménagement durable du territoire.',
    formations: [
      'Urbanisme et aménagement.',
      'Architecture.'
    ],
    debouches: [
      'Urbaniste, aménagiste',
      'Architecte, architecte-conseil'
    ],
    admission: [
      ADMISSION_POLYTECH,
      'Séries S1, S1A, S2, S2A et L2 selon la page de présentation de Polytech ; certains documents en listent davantage.'
    ],
    note:
      'La page de Polytech ne précise pas les diplômes de ce département, et le détail des filières et des débouchés y est présenté de façon peu claire : vérifie ces points sur le site officiel.',
    liens: [
      {
        libelle: 'Présentation de Polytech Diamniadio',
        url: 'https://uam.sn/presentation-polytech-diamniadio/'
      }
    ]
  },

  'Polytech DGO': {
    resume:
      'Département de gestion de Polytech Diamniadio : finance, comptabilité et management.',
    formations: [
      'Finance et comptabilité.',
      'Management des organisations.',
      'Licence et master dans les deux filières.'
    ],
    debouches: [
      'Licence : assistant comptable, chargé d’affaires banque ou assurance, assistant RH, assistant commercial, responsable logistique',
      'Master : contrôleur de gestion, auditeur, responsable administratif et financier, analyste financier, responsable marketing ou RH'
    ],
    admission: [
      ADMISSION_POLYTECH,
      'Séries S1, S1A, S2, S2A, S3, F6, STEG (G) et L2. Pour le concours 2025, les candidats de la série L2 devaient avoir 12/20 de moyenne annuelle en terminale.'
    ],
    note: null,
    liens: [
      {
        libelle: 'Page officielle du département',
        url: 'https://uam.sn/gestion-des-organisations/'
      },
      {
        libelle: 'Présentation de Polytech Diamniadio',
        url: 'https://uam.sn/presentation-polytech-diamniadio/'
      }
    ]
  },

  'Polytech DSTAAN': {
    resume:
      'Département d’agriculture, d’alimentation et de nutrition de Polytech Diamniadio.',
    formations: [
      'Tronc commun les premières années, puis spécialisation au cycle ingénieur en quatre filières : Agroécologie et productions végétales ; Productions animales et systèmes d’élevage durables ; Technologies agro-alimentaires durables ; Leadership, innovation et conseil agroenvironnemental.',
      'Licence « Technologies agro-alimentaires durables » : 3 ans (6 semestres), en français.'
    ],
    debouches: [
      'Ingénieur agroalimentaire ou qualiticien, gestionnaire de ferme, conseiller agricole, agroéconomiste, nutritionniste',
      'Entreprises agricoles et agro-industrielles, ministères, instituts de recherche, ONG et projets de développement',
      'Installation à son compte : exploitation, bureau d’études, conseil'
    ],
    admission: [
      ADMISSION_POLYTECH,
      'Séries scientifiques S1, S1A, S2, S2A, S3, S4 et S5 (certains documents ajoutent T1, T2 et F6).',
      ADMISSION_POLYTECH_SUITE
    ],
    note:
      'Sur le site de l’UAM, ce département apparaît sous plusieurs sigles : ST2AN, DST2AN ou DSTAAN. L’amicale garde « DSTAAN » dans son annuaire pour ne pas modifier les fiches des membres : c’est bien le même département.',
    liens: [
      {
        libelle: 'Présentation de Polytech Diamniadio',
        url: 'https://uam.sn/presentation-polytech-diamniadio/'
      },
      {
        libelle: 'Licence Technologies agro-alimentaires durables',
        url: 'https://polytech.sn/program-post/technologies-agro-alimentaires-durables/'
      }
    ]
  }
}

// Fiche d'une structure, ou null si elle n'existe pas encore.
export function ficheDe(court) {
  return FICHES[court] || null
}
