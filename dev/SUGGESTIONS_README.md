# 🎯 Système de Suggestions Personnalisées - Quartissimo

## 📋 Vue d'Ensemble

Le système de suggestions de Quartissimo utilise un **algorithme hybride intelligent** qui combine trois approches pour proposer du contenu personnalisé aux utilisateurs :

- 🤝 **Suggestions basées sur les affinités** (40% du total)
- 📂 **Suggestions basées sur les catégories préférées** (30% du total)  
- 🔥 **Suggestions populaires et récentes** (30% du total)

## 🏗️ Architecture Technique

### Backend - SuggestionEngine
```
├── services/suggestionEngine.ts
├── services/interaction.ts
└── endpoints: GET /suggestions, POST /suggestions/realtime
```

### Frontend - SuggestionsPage
```
└── components/Suggestions/SuggestionsPage.tsx
```

---

## 🎯 Algorithmes de Suggestions

### 1. 🤝 Suggestions par Affinités (40%)

**Principe :** Trouve les utilisateurs avec qui vous avez le plus d'affinités et suggère leurs contenus récents.

```typescript
// Étapes de l'algorithme :
1. Récupère les 10 utilisateurs avec les plus fortes affinités
2. Pour chaque utilisateur afin :
   - Trouve ses contenus récents (dernier mois)
   - Calcule un score : (affinité × 70%) + (fraîcheur × 30%)
3. Retourne les meilleures suggestions
```

**Calcul du Score :**
- `affinité` : Pourcentage de compatibilité avec l'utilisateur (0-100%)
- `fraîcheur` : `Math.max(0, 100 - jours_depuis_création × 2)`

**Exemple :** Si Alice a 85% d'affinité avec Bob et que Bob a créé un service il y a 3 jours :
- Score affinité : 85 × 0.7 = 59.5
- Score fraîcheur : (100 - 3×2) × 0.3 = 28.2  
- **Score final : 88%**

---

### 2. 📂 Suggestions par Catégories (30%)

**Principe :** Analyse vos catégories préférées basées sur votre historique d'interactions.

```typescript
// Étapes de l'algorithme :
1. Analyse vos 5 catégories les plus utilisées
2. Pour chaque catégorie :
   - Trouve les contenus récents (dernière semaine)
   - Calcule : (préférence_catégorie × 60%) + (fraîcheur × 40%)
3. Exclut vos propres contenus si demandé
```

**Calcul de la Préférence :**
- `préférence_catégorie` : `(nombre_interactions / 10) × 100`
- Plus vous interagissez dans une catégorie, plus elle devient prioritaire

**Exemple :** Si vous avez 15 interactions dans "jardinage" :
- Préférence : (15/10) × 100 = 150% (plafonné à 100%)
- Pour un contenu jardinage récent → **Score élevé**

---

### 3. 🔥 Suggestions Populaires (30%)

**Principe :** Contenu récent et populaire, idéal pour les nouveaux utilisateurs.

```typescript
// Types de contenus recherchés :
- Services : status='available' + créés récemment
- Events : status='open' + date future + participants
- Trocs : status='open' + récents  
- Absences : status='pending' + urgentes (7 prochains jours)
```

**Critères de Popularité :**
- **Récence** : Contenus de la dernière semaine
- **Activité** : Events avec participants, services réservés
- **Urgence** : Absences nécessitant une réponse rapide

---

## 📊 Scoring et Filtrage

### Calcul des Scores Finaux

Chaque suggestion reçoit un **score de 0 à 100%** :

```typescript
Score Final = (Score_Algorithme × Poids) + (Score_Fraîcheur × Poids_Complémentaire)

// Exemples de pondération :
- Affinités : (affinité × 70%) + (fraîcheur × 30%)
- Catégories : (catégorie × 60%) + (fraîcheur × 40%)  
- Populaires : (popularité × 50%) + (fraîcheur × 50%)
```

### Déduplication et Tri

1. **Déduplication** : Supprime les doublons par `entityType-id`
2. **Tri** : Classe par score décroissant  
3. **Limitation** : Retourne les `N` meilleures suggestions

---

## 🔧 Configuration et Filtres

### Filtres Disponibles

```typescript
interface SuggestionFilters {
    categories?: string[];           // Filtrer par catégories
    entityTypes?: string[];          // 'service', 'troc', 'event', 'absence'
    excludeOwn?: boolean;           // Exclure ses propres contenus
    minScore?: number;              // Score minimum (0-100)
}
```

### Paramètres d'Appel

```typescript
// API Call
GET /suggestions?limit=20&excludeOwn=false&minScore=0&types=event,service
```

---

## 🎮 Cas d'Usage

### 👤 Nouvel Utilisateur (0 interactions)

**Résultat :** Seules les **suggestions populaires** s'affichent
- ✅ 4-5 événements récents et ouverts  
- ✅ Services populaires disponibles
- ❌ Pas d'affinités (historique vide)
- ❌ Pas de catégories préférées

**Objectif :** Inciter à l'interaction avec du contenu attractif

---

### 👥 Utilisateur Actif (59 interactions)

**Résultat :** **Mix intelligent** des 3 algorithmes
- 🤝 40% basé sur Alice, Bob, Claire (affinités fortes)
- 📂 30% dans jardinage, cuisine, technologie (catégories préférées)  
- 🔥 30% événements populaires récents

**Objectif :** Suggestions ultra-personnalisées

---

### 🔄 Utilisateur de Retour (inactif)

**Fonctionnalité :** `generateReactivationSuggestions()`
- Basé sur anciennes préférences
- Met en avant les nouveautés
- Score fixe de 75% pour encourager

---

## 🚀 Endpoints API

### GET /suggestions
```typescript
// Récupère les suggestions personnalisées
Query Parameters:
- limit: number (défaut: 10)
- categories: string[] 
- types: string[]
- excludeOwn: boolean
- minScore: number

Response: {
  success: boolean,
  suggestions: SuggestionItem[]
}
```

### POST /suggestions/realtime  
```typescript
// Génère des suggestions basées sur une action récente
Body: {
  type: 'service' | 'troc' | 'event' | 'absence',
  category: string,
  entityId: number
}
```

### GET /stats
```typescript
// Statistiques utilisateur pour la page suggestions
Response: {
  totalInteractions: number,
  topCategories: Array<{category: string, count: number}>,
  affinities: Array<{userId: number, score: number}>
}
```

---

## 🎨 Interface Utilisateur

### Composants Principaux

1. **📊 Cartes Statistiques**
   - Interactions totales
   - Activités récentes  
   - Catégories explorées

2. **🔍 Système de Filtres**
   - Types de contenu
   - Score minimum
   - Exclusion de ses contenus

3. **📋 Grille de Suggestions**
   - Titre et description
   - Score de pertinence (%)
   - Raison de la suggestion
   - Type et catégorie

### États d'Affichage

- **🔄 Chargement** : CircularProgress pendant l'appel API
- **❌ Erreur** : Alert avec message d'erreur détaillé
- **📭 Vide** : Message d'encouragement à interagir
- **✅ Contenu** : Grille responsive de suggestions

---

## 🔧 Développement

### Installation et Configuration

```bash
# Backend
cd backend/
npm install
npm run dev

# Frontend  
cd frontend/
npm install
npm start
```

### Variables d'Environnement

```env
# Backend
DB_HOST=localhost
DB_PORT=5432
DB_NAME=quartissimo

# Frontend
REACT_APP_API_URL=http://localhost:3000
```

### Tests et Debug

```typescript
// Activer les logs détaillés
console.log('🎯 [SuggestionEngine] Génération pour userId:', userId);
console.log('🤝 Affinités trouvées:', affinitySuggestions.length);
console.log('📂 Suggestions par catégories:', categorySuggestions.length);
console.log('🔥 Suggestions populaires:', popularSuggestions.length);
```

---

## 📈 Métriques et Performance

### KPI à Surveiller

- **Taux de clic** sur les suggestions
- **Temps passé** sur les contenus suggérés  
- **Taux de conversion** (contact/participation)
- **Diversité des suggestions** (équilibre types/catégories)

### Optimisations Possibles

1. **Cache** : Mise en cache des affinités utilisateur
2. **Pagination** : Suggestions infinies avec scroll
3. **ML** : Apprentissage automatique sur les interactions
4. **Géolocalisation** : Suggestions basées sur la proximité

---

## 🎯 Roadmap

### Version Actuelle (v1.0)
- ✅ Algorithme hybride 3-en-1
- ✅ Interface responsive
- ✅ Filtres avancés
- ✅ Statistiques utilisateur

### Prochaines Versions

**v1.1 - Interactions**
- 👍 Système de likes/favoris
- 💬 Commentaires sur suggestions
- 📞 Contact direct intégré

**v1.2 - Intelligence**  
- 🧠 Machine Learning
- 📍 Géolocalisation
- 🕐 Suggestions temps réel

**v1.3 - Social**
- 👥 Suggestions collaboratives
- 🔔 Notifications push
- 📊 Analytics avancées

---

## 🤝 Contribution

Pour contribuer au système de suggestions :

1. **Fork** le projet
2. **Créer** une branche feature
3. **Tester** avec différents profils utilisateur
4. **Documenter** les changements d'algorithme
5. **Pull Request** avec description détaillée

---

## 📞 Support

- **Documentation** : Ce README
- **Code** : `services/suggestionEngine.ts`
- **Interface** : `components/Suggestions/SuggestionsPage.tsx`
- **Tests** : Créer utilisateurs avec différents profils

---

*Développé avec ❤️ pour la communauté Quartissimo*
