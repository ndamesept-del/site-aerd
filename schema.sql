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
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
--   INSERT INTO bureau (prenom, nom, poste, ordre) VALUES ('Mame Cheikh', 'Niang', 'Président', 1);

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
