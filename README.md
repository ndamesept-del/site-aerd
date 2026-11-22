# Site de l’AERD/UAM

Site de l’**Amicale des Étudiants Ressortissants de Diourbel (AERD/UAM)**,
à l’Université Amadou Mahtar Mbow de Diamniadio.

Le site permet de :
- présenter l’amicale aux nouveaux bacheliers de Diourbel et de Bambey ;
- montrer les caravanes à venir, avec le chauffeur et le numéro Wave du responsable ;
- laisser chaque membre **s’inscrire tout seul à une caravane** (et se désister si besoin) ;
- gérer, dans l’espace bureau : les membres, l’annuaire des chauffeurs, les caravanes
  et les paiements (cocher « Payé » après vérification).

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
2. Crée un projet (par exemple « aerd »). Neon te donne une adresse de connexion (elle commence par `postgresql://...`). C'est ton `DATABASE_URL`.
3. Ouvre l'onglet « SQL Editor » de ton projet Neon et colle tout le contenu du fichier `schema.sql`
   (à la racine du projet). Cela crée les tables : `membres`, `chauffeurs`,
   `caravanes`, `inscriptions`.
4. Dans Netlify (Site settings → Environment variables), ajoute `DATABASE_URL` avec l'adresse copiée à l'étape 2.

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
  - `DATABASE_URL` : l’adresse de ta base PostgreSQL (donnée par Neon)

Pour changer le mot de passe plus tard : change la variable dans Netlify,
puis redéploie le site. L’ancien mot de passe ne marche plus.

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
   `DATABASE_URL` et `BUREAU_PASSWORD`.
5. Clique sur « Deploy ». Netlify te donne une adresse, par exemple
   `https://aerd-uam.netlify.com`.
6. Dans la console SQL de ta base, vérifie que les tables existent
   (colle `schema.sql` si ce n’est pas fait, étape 3).

Ensuite, chaque fois que tu changes le code et que tu l’envoies sur GitHub,
Netlify redéploie le site tout seul.

## 6. Vérifier que tout marche

1. Ouvre le site. La page d’accueil s’affiche avec le logo, les 8 filières et les niveaux.
2. Va dans « Caravanes » : aucune caravane au début, c’est normal.
3. Connecte-toi à l’espace bureau avec ton mot de passe.
4. Dans le tableau de bord, clique sur « Charger des exemples » pour tester.
5. Va dans « Caravanes », crée une caravane (ou utilise l’exemple).
6. Sur le site public, inscris-toi à la caravane, puis reviens dans le bureau :
   ton inscription apparaît, coche « Payé », puis essaie « Retirer de la liste ».
7. Quand tu as fini de tester, clique sur « Supprimer les exemples ».

## Structure du projet

```
site-aerd/
  index.html              Page HTML de base
  package.json            Dépendances (React, Vite, pg)
  vite.config.js          Configuration Vite
  netlify.toml            Configuration Netlify (build, dossier des fonctions)
  schema.sql              Tables PostgreSQL (membres, chauffeurs, caravanes, inscriptions)
  .env.example            Modèle des variables d'environnement (à copier en .env)
  public/
    Logo_AERD_UAM.png     Logo de l'amicale (utilisé dans l'en-tête)
  src/
    main.jsx              Point d'entrée React
    App.jsx               En-tête, navigation, pied de page
    api.js                Appels aux Netlify Functions (avec repli local en dev)
    localMock.js          Base locale du navigateur (mode local seulement)
    data.js               Filières, niveaux, lien du formulaire d'inscription
    styles.css            Tout le design (bleu profond et or, mobile-first)
    pages/
      Accueil.jsx         Page d'accueil publique
      CaravanesPubliques.jsx  Caravanes publiques, inscription, désistement
      Bureau.jsx          Connexion et onglets du bureau
      BureauDashboard.jsx Tableau de bord et données d'exemple
      BureauMembres.jsx   Recherche et ajout de membres
      BureauChauffeurs.jsx Annuaire des chauffeurs
      BureauCaravanes.jsx Création de caravanes, inscrits, paiements
  netlify/functions/
    db.js                 Connexion PostgreSQL et réponses JSON
    auth.js               Mot de passe du bureau et jeton de session
    login.js              Connexion au bureau
    caravanes.js          Liste et création des caravanes
    inscriptions.js       S'inscrire, se désister, marquer payé, retirer
    membres.js            Recherche et ajout de membres
    chauffeurs.js         Recherche et ajout de chauffeurs
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
- Les paiements se font par Wave, à la main : le membre paie sur le numéro Wave
  du responsable, et le bureau coche « Payé » après vérification. Il n’y a pas
  de paiement automatique sur le site (il faudrait un compte marchand).
