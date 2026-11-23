# Site de l’AERD/UAM

Site de l’**Amicale des Étudiants Ressortissants de Diourbel (AERD/UAM)**,
à l’Université Amadou Mahtar Mbow de Diamniadio.

Le site permet de :
- présenter l’amicale aux nouveaux bacheliers de Diourbel et de Bambey ;
- montrer le bureau de l’amicale (photo, nom et poste de chacun) sur la page d’accueil ;
- montrer les caravanes à venir, avec le chauffeur, le montant de la place,
  le numéro Wave ou Orange Money du responsable, et un bouton
  « Liste des inscrits (X) » qui ouvre une pop-up avec le prénom, le nom et
  le statut de chaque inscrit (« Payé » ou « En attente ») — jamais de numéro
  de téléphone, les numéros restent privés ;
- laisser chaque membre **s’inscrire tout seul à une caravane** (et se désister si besoin) ;
- gérer, dans l’espace bureau : les membres, l’annuaire des chauffeurs, les caravanes,
  les paiements (cocher « Payé » après vérification) et l’organigramme du bureau
  (chacun met sa propre photo, enregistrée dans la base).

Technologies : Vite + React (le site), Netlify Functions (le serveur),
PostgreSQL (la base de données, Netlify DB / Neon). Le site s’adapte au téléphone
et à l’ordinateur (mise en page mobile-first).

---

## 1. Ouvrir le projet dans VS Code

1. Ouvre VS Code.
2. Fichier → Ouvrir le dossier → choisis le dossier `site-aerd`.
3. Ouvre un terminal dans VS Code (Terminal → Nouveau terminal).
4. Installe les dépendances :

```bash
npm install
```

## 2. Lancer le site en local (pour essayer)

```bash
npm run dev
```

Puis ouvre http://localhost:5173 dans ton navigateur.

**En local, le site tourne en « mode local »** : il n’y a pas de base de données,
les données sont gardées dans ton navigateur seulement (tu peux ajouter des membres,
des chauffeurs et des caravanes pour essayer). Un bandeau jaune en haut du site
te le rappelle. Pour la vraie base, voir l’étape 3.

**Mot de passe de l’espace bureau en local : `change-moi`.**
C’est la valeur par défaut de développement seulement. **À changer avant la mise en ligne**
(voir l’étape 4). Ne garde jamais ce mot de passe pour le vrai site.

Pour arrêter le serveur local : `Ctrl + C` dans le terminal.

Pour tester avec les vraies fonctions et la vraie base en local, tu peux aussi utiliser :

```bash
npx netlify dev
```

(Il faut d’abord avoir créé la base et le fichier `.env`, voir ci-dessous.)

## 3. Créer la base de données PostgreSQL

**Le plus simple et le plus sûr : créer la base directement sur Neon** (https://neon.com), le service qui fournit le PostgreSQL de Netlify. Le compte gratuit est **permanent, sans limite de temps et sans carte bancaire** : 1 Go de stockage (largement assez pour les membres et les caravanes de l'amicale) et 100 heures de calcul par mois. Quand personne n'utilise le site pendant 5 minutes, la base se met en pause toute seule, et elle se réveille en moins d'une seconde à la première visite. **Les données ne sont jamais supprimées** : même si une limite est atteinte, la base se met juste en pause jusqu'au mois suivant.

1. Crée un compte gratuit sur https://neon.com (avec ton adresse e-mail, pas besoin de carte bancaire).
2. Crée un projet (par exemple « aerd »). Neon te donne une adresse de connexion : c'est ton `DATABASE_URL`.
3. Ouvre l'onglet « SQL Editor » de ton projet Neon et colle tout le contenu du fichier `schema.sql`
   (à la racine du projet). Cela crée les tables : `membres`, `chauffeurs`,
   `caravanes`, `inscriptions`, `bureau`.
4. Dans Netlify (Site settings → Environment variables), ajoute `DATABASE_URL` avec l'adresse copiée à l'étape 2.

**Si ta base existe déjà (tables créées avant)** : colle seulement ces requêtes
dans l'éditeur SQL de Neon, pour ajouter ce qui manque :

```sql
ALTER TABLE caravanes ADD COLUMN IF NOT EXISTS montant_fcfa INTEGER;
ALTER TABLE caravanes ADD COLUMN IF NOT EXISTS lieu_depart TEXT;
ALTER TABLE membres ADD COLUMN IF NOT EXISTS numero_carte TEXT UNIQUE;
ALTER TABLE membres ADD COLUMN IF NOT EXISTS carte_payee BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE membres ADD COLUMN IF NOT EXISTS carte_paiement_declare BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bureau ADD COLUMN IF NOT EXISTS telephone TEXT;

CREATE TABLE IF NOT EXISTS bureau (
  id SERIAL PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  poste TEXT NOT NULL,
  photo TEXT,
  telephone TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  exemple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO bureau (prenom, nom, poste, telephone, ordre) VALUES ('Cheikh', 'Niang', 'Président', '77 936 03 11', 1);
```

Si le président est déjà dans la base avec l'ancien prénom et sans numéro,
corrige-le avec cette requête (après l'ALTER TABLE ci-dessus) :

```sql
UPDATE bureau SET prenom = 'Cheikh', telephone = '77 936 03 11' WHERE poste = 'Président';
```

La dernière ligne ajoute le président actuel à l'organigramme (sans photo pour
l'instant : il l'ajoutera lui-même dans l'espace bureau, onglet « Organigramme »).

**Cartes de membres (1000 FCFA)** : chaque membre a un numéro de carte (AERD-2026-001, AERD-2026-002, ...)
attribué tout seul à la validation du paiement. Le membre retrouve sa carte sur la page publique
« Ma carte de membre » avec son PRÉNOM et son NOM (pas avec son numéro de téléphone : le numéro peut
changer, le nom ne change pas ; si plusieurs membres ont le même nom, le site les propose tous et la
personne choisit le sien). Il paie 1000 FCFA par Wave ou Orange Money au trésorier (le numéro est celui
des paramètres, onglet « Cotisations »), puis il clique sur « J'ai payé 1 000 FCFA » : son paiement est
déclaré. Seuls ceux qui ont fait une demande de carte apparaissent dans l'onglet « Cartes de membres »
du bureau, dans « Paiements déclarés – à valider » : le trésorier les valide directement là (gros
bouton bleu), puis le membre revient sur la page « Ma carte de membre », appuie sur « Récupérer ma carte »
et télécharge sa carte en image PNG, avec son nom, son numéro et un QR code qui regroupe son nom et son
numéro. Après avoir déclaré son paiement, le membre voit aussi un bouton « Récupérer ma carte » qui
vérifie si le trésorier a validé : si oui, sa carte s'affiche tout de suite ; sinon, le site lui dit
d'attendre encore.

**Numéro du trésorier :** c'est à ce numéro (Wave / Orange Money) que les membres envoient les
1 000 FCFA de leur carte. Le trésorier le met lui-même dans l'onglet « Cartes de membres » (section
« Numéro du trésorier », en haut de l'onglet), et il s'affiche sur la page publique « Ma carte de
membre ». Si la trésorerie change, le trésorier retire ce numéro (bouton « Retirer le numéro ») et met
celui du nouveau trésorier. Le même numéro sert aussi pour les cotisations (onglet « Cotisations »,
même champ et même bouton « Retirer le numéro ») et s'affiche sur la page publique des cotisations
et des dons. Ceux qui n'ont pas
encore demandé de carte n'apparaissent pas dans cet onglet (on les retrouve dans l'onglet Membres,
filtre « Sans carte »).

**Lien direct de la carte (plus rapide) :** pour chaque carte payée, l'onglet « Cartes de membres » a un
bouton « Copier le lien de la carte ». Le trésorier le copie et l'envoie au membre par WhatsApp. Le lien
contient déjà le nom du membre (ex : `/ma-carte?prenom=Awa&nom=Diallo`) : en cliquant dessus, le membre
voit sa carte tout de suite et peut la télécharger, sans rien taper. Sans le lien, il peut aussi venir
sur la page « Ma carte de membre » et taper son prénom et son nom.

**Vérifier une carte (anti-fausse carte) :** le QR code de la carte est un lien de vérification
(`/verifier-carte?numero=AERD-2026-001`). En scannant la carte avec l'appareil photo du téléphone, on
arrive sur la page « Vérifier une carte », qui contrôle le numéro dans la base de l'amicale : carte
authentique (numéro trouvé, carte payée, avec le nom du membre), carte non validée (numéro trouvé, carte
pas encore payée) ou carte non reconnue (numéro inexistant, par exemple une carte inventée par une IA).
La page permet aussi de scanner avec la caméra du téléphone ou de taper le numéro à la main. La
vérification ne montre que le prénom, le nom et le numéro : jamais le téléphone ni le statut boursier.
Limite : une photocopie d'une vraie carte reste authentique, celui qui vérifie compare le nom affiché
avec le nom écrit sur la carte. L'endpoint public est `/.netlify/functions/verifier-carte?numero=...`. Pas de photo sur la carte (décision du bureau, novembre 2026). Le
numéro du président s'affiche sur la page d'accueil, sous sa carte (contact du président). Dans l'onglet
« Membres », celui qui a une carte payée porte une étoile dorée ★ à côté de son nom, et on peut filtrer
la liste : « Tous les membres », « ★ Avec carte » ou « Sans carte ». L'étoile sert à retrouver d'un coup
d'œil qui a une carte de membre.

**Cotisations et dons de tickets (volet social)** : si ta base existe déjà, colle
aussi ces 4 requêtes dans l'éditeur SQL de Neon :

```sql
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

CREATE TABLE IF NOT EXISTS parametres (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
);
```

Si la table `inscriptions_tickets` existe déjà sans la colonne « boursier »,
ajoute-la avec : `ALTER TABLE inscriptions_tickets ADD COLUMN IF NOT EXISTS boursier BOOLEAN DEFAULT NULL;`

**Statut boursier des membres** : si ta base existe déjà, ajoute aussi cette colonne
à la table des membres (elle accepte NULL : les membres importés de la liste papier
n'ont pas cette information, ils restent « Non renseigné ») :

```sql
ALTER TABLE membres ADD COLUMN IF NOT EXISTS boursier BOOLEAN DEFAULT NULL;
```

Pourquoi pas la base d'essai de Netlify ? L'ancienne « Netlify DB » en version d'essai ne dure que 7 jours : si on ne la relie pas à un compte Neon dans les 7 jours, elle est supprimée. En créant la base directement sur Neon, il n'y a pas du tout cette limite de 7 jours.

Pourquoi pas une base sur ton ordinateur ? Un site déployé sur internet ne peut pas joindre une base qui est sur ton ordinateur : ton ordinateur n'est pas toujours allumé, et il n'a pas d'adresse publique sur internet. La base doit être en ligne, comme le site.

Autres options vérifiées, moins bonnes pour vous :
- Supabase (gratuit) : la base se met en pause après 7 jours sans utilisation, et il faut cliquer soi-même sur « Resume » dans le tableau de bord pour la réveiller, sinon le site ne marche plus.
- Render (gratuit) : à éviter, la base gratuite expire après 30 jours, puis elle est supprimée avec les données.

En local, pour essayer le site sans base en ligne, tu peux utiliser le mode local (données dans le navigateur, voir section 2) ou une base Neon gratuite. Mets son adresse dans `.env` :

```bash
cp .env.example .env
```

Puis remplis `DATABASE_URL` dans `.env` avec l’adresse de ta base.

**La base est vide au départ.** Aucune donnée réelle n’est fournie avec le site.
Pour tester, le bureau peut charger des données d’exemple depuis le tableau de bord
(3 membres fictifs, 1 chauffeur fictif, 1 caravane fictive, marqués « Exemple »,
supprimables d’un clic).

## 4. Choisir le mot de passe du bureau

**Le mot de passe du bureau ne doit jamais être écrit dans le code.**
Il vient de la variable d’environnement `BUREAU_PASSWORD`.

- En local : mets-le dans le fichier `.env` (copié depuis `.env.example`).
- Sur Netlify : va dans Site settings → Environment variables, et ajoute :
  - `BUREAU_PASSWORD` : ton mot de passe (fort, connu du bureau seulement)
  - `CARAVANES_PASSWORD` : mot de passe de l’onglet Caravanes, connu de l’administrateur seulement
  - `CARTES_PASSWORD` : mot de passe de l’onglet Cartes de membres, connu du trésorier seulement
  - `DATABASE_URL` : l’adresse de ta base PostgreSQL (donnée par Neon)

Pour changer le mot de passe plus tard : change la variable dans Netlify,
puis redéploie le site. L’ancien mot de passe ne marche plus.

**Mot de passe des caravanes :** l’onglet Caravanes a son propre mot de passe
(`CARAVANES_PASSWORD`), séparé de celui du bureau. Seul l’administrateur le
connaît : sans lui, personne ne peut ouvrir l’onglet, ni créer une caravane,
ni valider un paiement (« Marquer Payé »).

**Mot de passe des cartes de membres :** l’onglet Cartes de membres a lui
aussi son propre mot de passe (`CARTES_PASSWORD`), séparé de celui du
bureau. Seul le trésorier le connaît : il donne accès seulement à
cette partie (voir les cartes, valider un paiement de carte), pas au
reste de l’espace bureau.

**Réduction sur la place de caravane (pour motiver) :** ce n'est pas une
subvention d'ailleurs, c'est une remise sur le paiement de la caravane.
Elle n'est pas dans le site : le bureau l'annonce (par exemple dans le
groupe WhatsApp), et les membres qui ont une carte de membre paient
directement le prix réduit par Wave ou Orange Money (ex : place à
4 000 FCFA, réduction de 500 FCFA, le membre avec une carte envoie
3 500 FCFA). Le bureau marque ensuite « Payé » comme d'habitude, après
vérification.

## 5. Déployer le site sur Netlify

1. Mets le dossier `site-aerd` dans un dépôt GitHub (ou GitLab).
2. Sur https://app.netlify.com, clique sur « Add new site » → « Import an existing project »,
   puis choisis ton dépôt.
3. Réglages de construction :
   - Build command : `npm run build`
   - Publish directory : `dist`
   - Functions directory : `netlify/functions`
   (Ces réglages sont déjà dans le fichier `netlify.toml`, Netlify les reprend tout seul.)
4. Avant de déployer, ajoute les variables d’environnement (étape 4) :
   `DATABASE_URL`, `BUREAU_PASSWORD`, `CARAVANES_PASSWORD` et `CARTES_PASSWORD`.
5. Clique sur « Deploy ». Netlify te donne une adresse, par exemple
   `https://aerd-uam.netlify.com`.
6. Dans la console SQL de ta base, vérifie que les tables existent
   (colle `schema.sql` si ce n’est pas fait, étape 3).

Ensuite, chaque fois que tu changes le code et que tu l’envoies sur GitHub,
Netlify redéploie le site tout seul.

## 6. Vérifier que tout marche

1. Ouvre le site. La page d’accueil s’affiche avec le logo, les 8 filières et les niveaux. Clique sur une filière : une pop-up montre ce qu’on y étudie, les diplômes, la durée et les débouchés (informations du site officiel de l’UAM).
2. Va dans « Caravanes » : aucune caravane au début, c’est normal.
3. Connecte-toi à l’espace bureau avec ton mot de passe.
4. Dans le tableau de bord, clique sur « Charger des exemples » pour tester.
5. Va dans « Caravanes », crée une caravane (ou utilise l’exemple).
6. Sur le site public, inscris-toi à la caravane, puis reviens dans le bureau :
   ton inscription apparaît, coche « Payé », puis essaie « Retirer de la liste ».
7. Cotisations et dons : dans l’espace bureau, onglet « Cotisations », choisis le mois et coche
   « Payé » pour un membre ; dans l’onglet « Dons de tickets », crée une campagne, puis sur la
   page publique « Cotisations et dons », inscris-toi pour un ticket et reviens dans le bureau
   pour l’attribuer.
8. Quand tu as fini de tester, clique sur « Supprimer les exemples ».

## Structure du projet

```
site-aerd/
  index.html              Page HTML de base
  package.json            Dépendances (React, Vite, pg)
  vite.config.js          Configuration Vite
  netlify.toml            Configuration Netlify (build, dossier des fonctions)
  schema.sql              Tables PostgreSQL (membres, chauffeurs, caravanes, inscriptions, bureau, cotisations, dons_tickets, inscriptions_tickets, parametres)
  .env.example            Modèle des variables d'environnement (à copier en .env)
  public/
    Logo_AERD_UAM.png     Logo de l'amicale (utilisé dans l'en-tête)
    fonts/                Police Inter, fournie dans le projet (aucun CDN)
  src/
    main.jsx              Point d'entrée React
    App.jsx               En-tête, navigation, pied de page
    api.js                Appels aux Netlify Functions (avec repli local en dev)
    localMock.js          Base locale du navigateur (mode local seulement)
    data.js               Filières, niveaux, postes du bureau, lien du formulaire d'inscription
    styles.css            Tout le design (bleu profond et or, mobile-first)
    pages/
      Accueil.jsx         Page d'accueil publique (dont la section « Le bureau »)
      CaravanesPubliques.jsx  Caravanes publiques, inscription, désistement
      Bureau.jsx          Connexion et onglets du bureau
      BureauDashboard.jsx Tableau de bord et données d'exemple
      BureauMembres.jsx   Recherche et ajout de membres
      BureauChauffeurs.jsx Annuaire des chauffeurs
      BureauCaravanes.jsx Création de caravanes, inscrits, paiements
      BureauOrganigramme.jsx Organigramme : photo, nom et poste de chaque membre du bureau
      BureauCotisations.jsx Cotisations mensuelles : qui a payé, total collecté, numéro du trésorier
      BureauDons.jsx      Campagnes de dons de tickets, inscrits, attribution des tickets
      CotisationsDons.jsx Page publique : cotisations et dons de tickets
  netlify/functions/
    db.js                 Connexion PostgreSQL et réponses JSON
    auth.js               Mot de passe du bureau et jeton de session
    login.js              Connexion au bureau
    caravanes.js          Liste et création des caravanes
    inscriptions.js       S'inscrire, se désister, marquer payé, retirer
    membres.js            Recherche et ajout de membres
    chauffeurs.js         Recherche et ajout de chauffeurs
    bureau.js             Organigramme du bureau (lecture publique, écriture réservée au bureau)
    cotisations.js        Cotisations mensuelles (bureau seulement)
    dons.js               Campagnes de dons (lecture publique, inscrits réservés au bureau)
    inscriptions_tickets.js S'inscrire à un don, attribuer ou refuser un ticket
    parametres.js         Numéro Wave du trésorier (lecture publique, écriture réservée au bureau)
    stats.js              Compteurs du tableau de bord
    exemples.js           Charger / supprimer les données d'exemple
```

## Règles importantes

- **Désistements : fermés 24 heures avant le départ.** Un membre ne peut plus
  se désister quand il reste moins de 24 heures avant le départ de la caravane
  (date + heure de départ, choisies par le bureau à la création). Le bouton
  « Se désister » disparaît alors sur le site public, et le serveur refuse
  aussi le désistement. Le bureau, lui, peut toujours retirer quelqu’un de la
  liste si besoin.
- **Aucune donnée personnelle réelle** dans le code : ni les noms ni les numéros
  des membres de la liste papier. Les membres s’ajoutent par le formulaire
  ou dans l’espace bureau.
- **Le mot de passe du bureau n’est jamais dans le code** : variable
  d’environnement `BUREAU_PASSWORD` seulement.
- Les paiements se font par Wave ou Orange Money, à la main : après son inscription,
  le membre voit le montant de la place et le numéro du responsable, il paie,
  et le bureau coche « Payé » après vérification. Il n’y a pas de paiement
  automatique sur le site (il faudrait un compte marchand).
- **Cotisations et dons de tickets (volet social) :** chaque membre cotise 500 FCFA par
  mois. Le bureau suit les paiements dans l’espace bureau (onglet « Cotisations ») et
  coche « Payé » après vérification. Le numéro Wave / Orange Money du trésorier se règle
  dans le même onglet et s’affiche sur la page publique. Pour les dons, le bureau crée
  une campagne (nombre de tickets, lieu de retrait), l’annonce sur WhatsApp, et les gens
  qui en ont besoin s’inscrivent sur la page publique « Cotisations et dons de tickets ».
  **Les non-boursiers sont prioritaires, et le tri est automatique :** quand quelqu’un
  s’inscrit à un don, le site cherche son numéro dans la liste des membres et copie
  son statut boursier avec l’inscription (vrai, faux, ou NULL si la personne n’est pas
  membre ou si son statut n’est pas renseigné). La liste renvoyée au bureau est déjà
  triée toute seule : non-boursiers d’abord, puis non renseignés, puis boursiers. Le
  bureau n’a rien à trier à la main. **La question « Es-tu boursier ? » n’est jamais
  posée dans le formulaire des tickets** : elle est dans le formulaire principal
  d’inscription à l’amicale (Google Forms), et le bureau peut aussi définir le statut
  pour chaque membre dans l’onglet « Membres » (à l’ajout et à la modification).
  **La liste des inscrits aux dons reste dans l’espace bureau seulement** : elle n’est
  jamais publique.
- **Organigramme : chaque membre du bureau met lui-même sa photo** (depuis son
  téléphone, dans l’espace bureau, onglet « Organigramme »). La photo est
  enregistrée dans la base de données et s’affiche sur la page d’accueil,
  avec son nom et son poste. Sans photo, le site affiche ses initiales
  dans un cercle bleu.
- **Anciens membres du bureau :** quand le bureau change, le bouton « Passer aux
  anciens » (onglet « Organigramme ») garde le nom et le poste du membre, mais
  **supprime sa photo pour libérer de l’espace** (une photo fait environ 30 à 60 Ko).
  Les anciens s’affichent en bas de la page « Le bureau », nom et poste seulement,
  sans photo. Si la base existe déjà, ajoute la colonne avec :
  `ALTER TABLE bureau ADD COLUMN IF NOT EXISTS ancien BOOLEAN NOT NULL DEFAULT FALSE;`

## Qualité du site (checklist du 22/11)

- **Confidentialité et conditions :** pages « Confidentialité » et « Conditions d’utilisation »,
  liées dans le pied de page. Le pied de page dit aussi que le site ne dépose aucun cookie de suivi.
- **Pas de suivi :** aucun traqueur d’audience (ni Google Analytics, ni cookies). Le bureau voit
  directement les inscriptions dans l’espace bureau.
- **SEO :** titre et description en français, image d’aperçu Open Graph (le logo), favicon (le logo),
  `sitemap.xml` et `robots.txt` dans `public/`.
- **Page 404 :** une page « Page introuvable » dans l’application (toute adresse inconnue) et un
  fichier `public/404.html` pour Netlify, avec un bouton « Retour à l’accueil ».
- **Anti-spam :** le formulaire public d’inscription aux caravanes contient un champ piège invisible
  (honeypot) : si un robot le remplit, le serveur refuse l’inscription. Le serveur refuse aussi
  les inscriptions trop rapprochées (même numéro en moins de 60 secondes, 20 inscriptions par minute
  au maximum). Pas de captcha, pas de service externe.
- **Images :** le logo est compressé (512 px, environ 42 Ko). Les photos du bureau sont redimensionnées
  dans le navigateur (400 px maximum, JPEG) avant d’être enregistrées.
- **Clés secrètes :** `DATABASE_URL`, `BUREAU_PASSWORD`, `CARAVANES_PASSWORD` et `CARTES_PASSWORD` sont des variables d’environnement Netlify
  seulement, jamais dans le code. Le HTTPS est forcé par Netlify par défaut.
