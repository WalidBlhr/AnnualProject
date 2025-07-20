# Plateforme Communautaire de Troc et Services de Quartier

<!--
@Borito
@WalidBlhr
@Wallblue
-->

Ce projet vise à créer une application complète facilitant l’échange, la communication et la collaboration entre voisins. L’objectif est de promouvoir l’entraide, la convivialité et la vie de quartier grâce à une plateforme intégrée regroupant troc, services, activités, messagerie, etc.

---

## 1. Instructions d’Installation et de Lancement

1. **Cloner le dépôt** :

  ```bash
    git clone git@github.com:WalidBlhr/AnnualProject.git
    cd AnnualProject
  ```

2. **Démarrer l'API et le front**

Le fonctionnement de cette architecture web nécessite Docker.

Nous considérons que nous sommes à la racine du projet cloné.

```bash
  cd dev/src
  docker compose up
```

Une fois les dockers chargés, l'API devrait être accessible sur votre localhost:3000 et le frontend sur votre localhost:80.

Vous pouvez accéder à la documentation de l'API via <http://localhost:3000/docs>.

---

## 2. Fonctionnalités de l’Application

### 2.1 Troc entre Voisins

- Les utilisateurs peuvent publier des offres/demandes de troc (par exemple, échange de livres, d’équipements, etc.).
- Possibilité d’échanger des **messages privés** pour finaliser l’échange.

### 2.2 Services

- Les voisins peuvent **proposer/solliciter des services** : récupération de colis, sortie de chien, courses pour une personne âgée, etc.
- Gestion d’un **planning** indiquant les prochaines dates/horaires où un utilisateur est disponible.

### 2.3 Sorties / Activités

- **Organisation d’activités** (cinéma, restaurant, balade, etc.) avec un **nombre max. de participants**.
- Les utilisateurs doivent s’inscrire : l’activité est annulée si le quota minimum n’est pas atteint (ou si le maximum est dépassé).

### 2.4 Surveillance en Cas d’Absence

- Les voisins peuvent **déclarer leurs dates d’absence** afin de demander une surveillance du logement.
- Possibilité de s’inscrire comme **“contact de confiance”** pour un voisin.

### 2.5 Messagerie (incl. vidéo si possible)

- **Discussions textuelles** individuelles ou de groupe.
- **État “connecté/hors-ligne”** pour chaque utilisateur.
- *(Optionnel)* Intégration **WebRTC** pour la visioconférence.

### 2.6 Organisation d’Événements Communautaires

- Organisation d’événements de quartier : **nettoyage, collecte de déchets, fêtes de quartier**, etc.
- Gestion d’une page/section où les utilisateurs peuvent **voir la liste des prochains événements** et s’y inscrire.

### 2.7 Journal de Quartier

- **Pages d’articles, news ou annonces** stockées dans MongoDB.
- Accès en lecture (public ou restreint) et **possibilité de contribution** (rédiger un article).

### 2.8 Mémorisation des Interactions

- Enregistrement des interactions (ex. : **A a sorti le chien de B**, **B est allé au cinéma avec C**).
- Objectif : générer des **suggestions de rencontre ou de participation** (moteur de suggestion).

### 2.9 Jeux (Optionnel)

- **Quiz communautaire**, petits jeux “casual” en ligne entre voisins.
- Permet de promouvoir l’interaction et la convivialité.

---

## 3. Architecture Globale

### 3.1 Back-end (NodeJS + BDD)

- **API REST** développée en **NodeJS**.
- Utilisation d’un **SGBD relationnel** (PostgreSQL).
- **MongoDB** pour les pages du journal de quartier ou l’historique des interactions.
- Sécurisation des routes via **JWT**.

### 3.2 Front-end Web (React)

- **Deux interfaces distinctes** :
  1. **Interface utilisateur** : accessible à tous (troc, messagerie, services, etc.).
  2. **Back-office** : administration, modération, statistiques d’usage.
- **Messagerie en temps réel** : WebSocket (Socket.io côté NodeJS) pour la messagerie instantanée et le statut en ligne/hors-ligne.
- **Design Responsive** (Bootstrap) avec systèmes de **thèmes clairs/sombres**.

### 3.3 Application Desktop Java (JavaFX + WebScraping)

- **JavaFX** pour l’interface.
- Récupération de données (ex. événements locaux, actualités de la mairie) depuis d’autres sites web.
- Configuration des **sites à scraper** (URL) et des **catégories d’informations** à extraire.
- **WebScraping** avec la bibliothèque **JSoup** pour parser le HTML.
- **Fonctionnalités avancées** :
  - Système de mise à jour du logiciel.
  - Stockage offline avec synchronisation ultérieure.
  - Système de plugins (chargement dynamique de jar).

### 3.4 Langage d’Interrogation (lex & yacc)

- Conception d’un **mini-langage style SQL** en Python.
  - Exemple : `SELECT titre, auteur FROM Articles WHERE categorie = 'Evenement';`
- Intégration dans l’API NodeJS ou dans l’application Java via un wrapper.
- Permet à l’utilisateur/administrateur de taper une requête pour récupérer des résultats.

### 3.5 Moteur de Suggestion (Interactions entre Voisins)

- À chaque interaction, on l’enregistre dans la collection **Interactions**.
- **Algorithmes** :
  - **Filtrage collaboratif** : recommander des personnes ayant des centres d’intérêt communs.
  - **Rule-based** : si un utilisateur a rendu service plusieurs fois, proposer d’autres services.
  - **Scoring** : calcul d’un score d’affinité basé sur le nombre et le type d’interactions.
- Suggère des activités, trocs, partenaires potentiels à chaque connexion.

---

## 4. Conteneurisation et Déploiement

- Création de **Dockerfile** pour chaque composant du projet.
- Fichier **docker-compose.yml** pour orchestrer et déployer facilement tous les services.
- Ajouter les configurations spécifiques si besoin (ports, variables d’environnement, etc.)

---

## 5. Contributions

Les contributions sont les bienvenues !
Pour contribuer :

Forkez ce dépôt.
Créez une branche pour votre fonctionnalité ou correctif.
Envoyez une Pull Request avec une description détaillée de vos modifications.

---

## 6. Licence

Ce projet est sous licence MIT.
