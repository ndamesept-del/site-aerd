-- Schéma PostgreSQL pour le site de l'AERD/UAM
-- Amicale des Étudiants Ressortissants de Diourbel (UAM Diamniadio)
--
-- Pour créer les tables :
--   1. Dans Netlify : crée une base Netlify DB (ou sur Neon).
--   2. Ouvre la console SQL de ta base et colle ce fichier.
--   3. Ou en local : psql "$DATABASE_URL" -f schema.sql
--
-- La base est vide au départ. Aucune donnée réelle n'est fournie ici.
-- La colonne "exemple" sert seulement aux données de test du bureau
-- (bouton "Charger des exemples") : elles sont marquées et supprimables.

-- Les 8 UFR et départements de l'UAM
-- UFR SEG, UFR STA, UFR TECNA
-- Polytech DGAE, DSTI, DU2ADT, DGO, DSTAAN

CREATE TABLE IF NOT EXISTS membres (
  id SERIAL PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  telephone_parent TEXT,
  ufr_departement TEXT NOT NULL,
  niveau TEXT NOT NULL CHECK (niveau IN ('L1', 'L2', 'L3', 'M1', 'M2')),
  origine TEXT NOT NULL CHECK (origine IN ('Diourbel', 'Bambey')),
  -- Boursier ou non : la question est dans le formulaire d'inscription
  -- à l'amicale. NULL veut dire « on ne sait pas » : les 29 membres
  -- importés de la liste papier n'ont pas cette information, on ne
  -- doit pas les étiqueter « Non boursier » par défaut. Le bureau peut
  -- renseigner le statut pour chaque membre, dans l'onglet « Membres ».
  -- Pour les dons de tickets, les non-boursiers sont prioritaires.
  boursier BOOLEAN DEFAULT NULL,
  -- Numéro de carte de membre (AERD-2026-001, ...) et paiement de la carte
  -- (1000 FCFA, payée par Wave ou Orange Money au trésorier, confirmée par
  -- le bureau). Le numéro est attribué à l'ajout du membre, ou quand le
  -- bureau confirme le paiement si le membre n'en avait pas encore.
  numero_carte TEXT UNIQUE,
  carte_payee BOOLEAN NOT NULL DEFAULT FALSE,
  -- Le membre a déclaré avoir payé sa carte (bouton « J'ai payé » sur la
  -- page « Ma carte de membre »). Il apparaît alors en haut de l'onglet
  -- « Cartes de membres » du bureau (« Paiements déclarés – à valider »),
  -- pour que le trésorier le valide directement. La validation remet
  -- cette case à faux.
  carte_paiement_declare BOOLEAN NOT NULL DEFAULT FALSE,
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si la table membres existe déjà sans ces colonnes, ajoute-les avec :
--   ALTER TABLE membres ADD COLUMN IF NOT EXISTS numero_carte TEXT UNIQUE;
--   ALTER TABLE membres ADD COLUMN IF NOT EXISTS carte_payee BOOLEAN NOT NULL DEFAULT FALSE;
--   ALTER TABLE membres ADD COLUMN IF NOT EXISTS carte_paiement_declare BOOLEAN NOT NULL DEFAULT FALSE;

-- Si la table membres existe déjà sans la colonne « boursier »,
-- ajoute-la avec :
--   ALTER TABLE membres ADD COLUMN IF NOT EXISTS boursier BOOLEAN DEFAULT NULL;

CREATE INDEX IF NOT EXISTS membres_nom_idx ON membres (nom, prenom);

CREATE TABLE IF NOT EXISTS chauffeurs (
  id SERIAL PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chauffeurs_nom_idx ON chauffeurs (nom, prenom);

CREATE TABLE IF NOT EXISTS caravanes (
  id SERIAL PRIMARY KEY,
  date_depart DATE NOT NULL,
  heure_depart TIME NOT NULL DEFAULT '08:00',
  destination TEXT NOT NULL,
  lieu_depart TEXT,
  chauffeur_id INTEGER REFERENCES chauffeurs(id) ON DELETE SET NULL,
  numero_wave_responsable TEXT NOT NULL,
  montant_fcfa INTEGER,
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Règle des désistements : on ne peut plus se désister quand il reste
-- moins de 24 heures avant le départ (date_depart + heure_depart).
-- Si la table existe déjà sans cette colonne, ajoute-la avec :
--   ALTER TABLE caravanes ADD COLUMN IF NOT EXISTS heure_depart TIME NOT NULL DEFAULT '08:00';

-- Montant de la place (en FCFA) : ce que chaque membre paie pour la caravane.
-- Si la table existe déjà sans cette colonne, ajoute-la avec :
--   ALTER TABLE caravanes ADD COLUMN IF NOT EXISTS montant_fcfa INTEGER;

-- Lieu de départ (point de rendez-vous) : « UAM, Diamniadio » quand la
-- caravane va à Diourbel ou Bambey, « Gouvernance de Diourbel » quand elle
-- va à Dakar. Le bureau peut le modifier à la création. Si la table existe
-- déjà sans cette colonne, ajoute-la avec :
--   ALTER TABLE caravanes ADD COLUMN IF NOT EXISTS lieu_depart TEXT;

CREATE INDEX IF NOT EXISTS caravanes_date_idx ON caravanes (date_depart);

-- Organigramme du bureau de l'amicale : qui occupe quel poste.
-- La photo est une petite image (400 px maximum) enregistrée directement
-- dans la base, en data URI (texte). Si la photo est vide, le site
-- affiche les initiales de la personne dans un cercle bleu.
-- « ordre » sert à ranger les membres : le président en premier (1),
-- puis les autres dans l'ordre choisi par le bureau.
CREATE TABLE IF NOT EXISTS bureau (
  id SERIAL PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  poste TEXT NOT NULL,
  photo TEXT,
  -- Numéro de téléphone du membre du bureau. Il s'affiche sur la page
  -- d'accueil pour le président seulement (contact du président).
  telephone TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  ancien BOOLEAN NOT NULL DEFAULT FALSE,
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bureau_ordre_idx ON bureau (ordre, nom);

-- Anciens membres du bureau : quand le bureau change, on garde le nom
-- et le poste des anciens, mais on supprime leur photo pour libérer
-- de l'espace (une photo fait environ 30 à 60 Ko). Si la table existe
-- déjà sans cette colonne, ajoute-la avec :
--   ALTER TABLE bureau ADD COLUMN IF NOT EXISTS ancien BOOLEAN NOT NULL DEFAULT FALSE;

-- Si la table bureau existe déjà sans la colonne « telephone »,
-- ajoute-la avec :
--   ALTER TABLE bureau ADD COLUMN IF NOT EXISTS telephone TEXT;
-- Puis corrige le nom du président et ajoute son numéro avec :
--   UPDATE bureau SET prenom = 'Cheikh', telephone = '77 936 03 11' WHERE poste = 'Président';

-- Si la table bureau n'existe pas encore dans ta base, crée-la et
-- ajoute le président actuel avec ces deux requêtes :
--   CREATE TABLE bureau (
--     id SERIAL PRIMARY KEY,
--     prenom TEXT NOT NULL,
--     nom TEXT NOT NULL,
--     poste TEXT NOT NULL,
--     photo TEXT,
--     ordre INTEGER NOT NULL DEFAULT 0,
--     ancien BOOLEAN NOT NULL DEFAULT FALSE,
--     exemple BOOLEAN NOT NULL DEFAULT FALSE,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   );
--   INSERT INTO bureau (prenom, nom, poste, telephone, ordre) VALUES ('Cheikh', 'Niang', 'Président', '77 936 03 11', 1);

CREATE TABLE IF NOT EXISTS inscriptions (
  id SERIAL PRIMARY KEY,
  caravane_id INTEGER NOT NULL REFERENCES caravanes(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'inscrit'
    CHECK (statut IN ('inscrit', 'payé', 'désisté')),
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inscriptions_caravane_idx ON inscriptions (caravane_id);

-- Une personne ne peut pas être inscrite deux fois à la même caravane
-- tant que son inscription est active (inscrit ou payé).
-- Après un désistement, elle peut s'inscrire de nouveau.
CREATE UNIQUE INDEX IF NOT EXISTS inscriptions_actives_uniques
  ON inscriptions (caravane_id, telephone)
  WHERE statut IN ('inscrit', 'payé');

-- Cotisations mensuelles du volet social : chaque mois, chaque membre
-- paye 500 FCFA. Le bureau suit qui a payé dans l'espace bureau
-- (onglet « Cotisations ») et coche « Payé » après vérification du
-- paiement par Wave ou Orange Money. Le mois est écrit « AAAA-MM »,
-- par exemple « 2026-11 » pour novembre 2026.
CREATE TABLE IF NOT EXISTS cotisations (
  id SERIAL PRIMARY KEY,
  membre_id INTEGER NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
  mois TEXT NOT NULL,
  montant_fcfa INTEGER NOT NULL DEFAULT 500,
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'paye')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (membre_id, mois)
);

CREATE INDEX IF NOT EXISTS cotisations_mois_idx ON cotisations (mois);

-- Dons de tickets (volet social) : le bureau crée une campagne
-- (nombre de tickets, lieu où les récupérer). L'annonce se fait par
-- WhatsApp. Les gens qui en ont besoin s'inscrivent sur la partie
-- publique du site, et le bureau choisit qui reçoit un ticket.
CREATE TABLE IF NOT EXISTS dons_tickets (
  id SERIAL PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  nombre_tickets INTEGER NOT NULL,
  lieu_retrait TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ouvert'
    CHECK (statut IN ('ouvert', 'ferme')),
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inscriptions aux dons de tickets : ce sont des gens dans le besoin.
-- La liste des inscrits reste dans l'espace bureau seulement,
-- elle n'est JAMAIS publique. La colonne « boursier » est remplie
-- TOUTE SEULE par le site au moment de l'inscription : le site cherche
-- le numéro de téléphone dans la table des membres et copie son statut
-- boursier (vrai, faux, ou NULL si la personne n'est pas membre ou si
-- son statut n'est pas renseigné). On ne demande JAMAIS « Es-tu
-- boursier ? » dans le formulaire d'inscription aux tickets : la
-- question est dans le formulaire principal d'inscription à l'amicale.
-- La liste renvoyée au bureau est triée toute seule côté serveur :
-- non-boursiers d'abord, puis non renseigné (NULL), puis boursiers.
CREATE TABLE IF NOT EXISTS inscriptions_tickets (
  id SERIAL PRIMARY KEY,
  don_id INTEGER NOT NULL REFERENCES dons_tickets(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  boursier BOOLEAN DEFAULT NULL,
  statut TEXT NOT NULL DEFAULT 'inscrit'
    CHECK (statut IN ('inscrit', 'attribue', 'refuse')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (don_id, telephone)
);

CREATE INDEX IF NOT EXISTS inscriptions_tickets_don_idx ON inscriptions_tickets (don_id);

-- Petits réglages du site, une ligne par réglage. Pour l'instant,
-- une seule ligne : le numéro Wave / Orange Money du trésorier,
-- pour payer les cotisations (clé « numero_wave_tresorier »).
CREATE TABLE IF NOT EXISTS parametres (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
);

-- Si ta base existe déjà (tables créées avant), colle ces 4 requêtes
-- dans l'éditeur SQL de Neon pour ajouter les cotisations et les
-- dons de tickets :
--   CREATE TABLE IF NOT EXISTS cotisations (
--     id SERIAL PRIMARY KEY,
--     membre_id INTEGER NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
--     mois TEXT NOT NULL,
--     montant_fcfa INTEGER NOT NULL DEFAULT 500,
--     statut TEXT NOT NULL DEFAULT 'en_attente'
--       CHECK (statut IN ('en_attente', 'paye')),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE (membre_id, mois)
--   );
--   CREATE TABLE IF NOT EXISTS dons_tickets (
--     id SERIAL PRIMARY KEY,
--     titre TEXT NOT NULL,
--     description TEXT,
--     nombre_tickets INTEGER NOT NULL,
--     lieu_retrait TEXT NOT NULL,
--     statut TEXT NOT NULL DEFAULT 'ouvert'
--       CHECK (statut IN ('ouvert', 'ferme')),
--     exemple BOOLEAN NOT NULL DEFAULT FALSE,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   );
--   CREATE TABLE IF NOT EXISTS inscriptions_tickets (
--     id SERIAL PRIMARY KEY,
--     don_id INTEGER NOT NULL REFERENCES dons_tickets(id) ON DELETE CASCADE,
--     prenom TEXT NOT NULL,
--     nom TEXT NOT NULL,
--     telephone TEXT NOT NULL,
--     boursier BOOLEAN DEFAULT NULL,
--     statut TEXT NOT NULL DEFAULT 'inscrit'
--       CHECK (statut IN ('inscrit', 'attribue', 'refuse')),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     UNIQUE (don_id, telephone)
--   );
--   CREATE TABLE IF NOT EXISTS parametres (
--     cle TEXT PRIMARY KEY,
--     valeur TEXT NOT NULL
--   );
-- Si la table inscriptions_tickets existe déjà sans la colonne
-- « boursier », ajoute-la avec :
--   ALTER TABLE inscriptions_tickets ADD COLUMN IF NOT EXISTS boursier BOOLEAN DEFAULT NULL;
