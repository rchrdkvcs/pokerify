# Pokerify - API Texas Hold'em Poker

API REST pour simuler des parties de poker Texas Hold'em développée avec NestJS.

## Table des matières

- [Description](#description)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement de l'application](#lancement-de-lapplication)
- [Routes API](#routes-api)
- [Fonctionnement du jeu](#fonctionnement-du-jeu)
- [Documentation Swagger](#documentation-swagger)
- [Technologies utilisées](#technologies-utilisées)

## Description

Pokerify est une API permettant de jouer au poker Texas Hold'em. L'application gère :
- Création de comptes utilisateurs avec une cave initiale de 1000€
- Authentification JWT
- Création et gestion de tables de poker
- Ajout automatique d'une IA si un joueur rejoint seul une table
- Distribution des cartes et gestion des tours de mises
- Évaluation des mains et détermination du gagnant
- Toutes les phases du jeu (PRE_FLOP, FLOP, TURN, RIVER, SHOWDOWN)

## Architecture

### Structure du projet

```
src/
├── auth/                 # Authentification JWT
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   ├── auth.decorator.ts
│   └── dto/
├── users/               # Gestion des utilisateurs
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── user.schema.ts
├── tables/              # Gestion des tables de poker
│   ├── tables.controller.ts
│   ├── tables.service.ts
│   ├── table.schema.ts
│   └── dto/
├── players/             # Gestion des joueurs dans une partie
│   ├── players.service.ts
│   └── player.schema.ts
├── poker/               # Logique du jeu de poker
│   ├── poker-game.service.ts
│   ├── hand-evaluator.service.ts
│   ├── poker.utils.ts
│   └── poker.types.ts
├── ai/                  # Intelligence artificielle
│   └── poker-ai.service.ts
└── swagger/            # Configuration Swagger
    └── swagger.service.ts
```

### Diagramme de classes

```
┌─────────────────┐
│   User          │
│─────────────────│
│ username        │
│ password        │
│ stack: 1000€    │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐        ┌──────────────────┐
│   Table         │   1:N  │     Player       │
│─────────────────│◄───────│──────────────────│
│ smallBlind      │        │ userId           │
│ bigBlind        │        │ username         │
│ pot             │        │ stack            │
│ communityCards  │        │ cards            │
│ deck            │        │ currentBet       │
│ state           │        │ status           │
│ currentBet      │        │ position         │
└─────────────────┘        │ type (human/ai)  │
        │                  └──────────────────┘
        │
        ▼
┌─────────────────────────┐
│   PokerGameService      │
│─────────────────────────│
│ initializeGame()        │
│ processAction()         │
│ determineWinner()       │
│ advanceToNextPhase()    │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│  HandEvaluatorService   │
│─────────────────────────│
│ evaluateHand()          │
│ findWinner()            │
│ compareHands()          │
└─────────────────────────┘
```

## Prérequis

- Node.js (v18 ou supérieur)
- npm ou bun
- MongoDB (via Docker ou installation locale)
- Docker et Docker Compose (optionnel, pour lancement simplifié)

## Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd pokerify
```

### 2. Installer les dépendances

```bash
npm install
# ou
bun install
```

### 3. Configuration de l'environnement

Copier le fichier `.env.example` vers `.env` et ajuster les variables si nécessaire :

```bash
cp .env.example .env
```

Variables d'environnement :
```env
PORT=3000
JWT_SECRET=your-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://root:password@localhost:27017/poker_db?authSource=admin
```

**Important** : Changez le `JWT_SECRET` en production !

## Lancement de l'application

### Avec Docker (recommandé)

```bash
# Construire et démarrer les conteneurs
npm run dev

# Voir les logs de l'application
npm run logs:app

# Voir les logs de MongoDB
npm run logs:db

# Arrêter les conteneurs
npm run down
```

L'API sera accessible sur `http://localhost:3000`

### Sans Docker

1. Démarrer MongoDB localement
2. Lancer l'application :

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

## Routes API

### Authentication

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|--------------|
| POST | `/auth/register` | Créer un nouveau compte (cave de 1000€) | Non |
| POST | `/auth/login` | Se connecter et obtenir un JWT | Non |
| GET | `/auth/me` | Obtenir les informations de l'utilisateur connecté | Oui |

#### Exemple Register

```json
POST /auth/register
{
  "username": "john_doe",
  "password": "password123",
  "password_confirmation": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Exemple Login

```json
POST /auth/login
{
  "username": "john_doe",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Tables

Toutes les routes suivantes nécessitent l'authentification (Bearer Token).

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/tables` | Créer une nouvelle table |
| GET | `/tables` | Lister toutes les tables |
| GET | `/tables/:id` | Obtenir les détails d'une table |
| POST | `/tables/:id/join` | Rejoindre une table (IA ajoutée automatiquement si seul) |
| POST | `/tables/:id/leave` | Quitter une table |
| POST | `/tables/:id/start` | Démarrer la partie (min 2 joueurs) |
| POST | `/tables/:id/action` | Effectuer une action (fold, check, call, raise, all_in) |

#### Exemples

**Créer une table**
```json
POST /tables
Authorization: Bearer <token>
{
  "smallBlind": 5,
  "bigBlind": 10
}
```

**Rejoindre une table**
```json
POST /tables/:id/join
Authorization: Bearer <token>
```

**Démarrer une partie**
```json
POST /tables/:id/start
Authorization: Bearer <token>
```

**Effectuer une action**
```json
POST /tables/:id/action
Authorization: Bearer <token>
{
  "action": "call"
}

// Pour raise
{
  "action": "raise",
  "amount": 20
}
```

### Actions disponibles

- `fold` : Se coucher
- `check` : Checker (seulement si aucune mise à suivre)
- `call` : Suivre la mise
- `raise` : Relancer (spécifier le montant)
- `all_in` : Faire tapis

## Fonctionnement du jeu

### 1. Création et inscription

- Un joueur crée un compte avec `/auth/register`
- Une cave de **1000€** lui est automatiquement allouée
- Il reçoit un JWT pour s'authentifier

### 2. Rejoindre une table

- Un joueur crée ou rejoint une table
- Si un joueur rejoint seul, **une IA est automatiquement ajoutée** pour avoir au minimum 2 joueurs
- Les tables acceptent entre 2 et 8 joueurs

### 3. Démarrage de la partie

- Lorsque `/tables/:id/start` est appelé :
  - Distribution de 2 cartes à chaque joueur
  - Placement des blindes (petite et grosse blind)
  - Début de la phase PRE_FLOP

### 4. Phases du jeu

1. **PRE_FLOP** : Tour d'enchères avec les 2 cartes personnelles
2. **FLOP** : 3 cartes communes dévoilées + tour d'enchères
3. **TURN** : 4ème carte commune dévoilée + tour d'enchères
4. **RIVER** : 5ème carte commune dévoilée + tour d'enchères
5. **SHOWDOWN** : Évaluation des mains et détermination du gagnant

### 5. Évaluation des mains

L'API évalue automatiquement les mains selon l'ordre suivant :
1. Royal Flush (Quinte Flush Royale)
2. Straight Flush (Quinte Flush)
3. Four of a Kind (Carré)
4. Full House (Full)
5. Flush (Couleur)
6. Straight (Suite)
7. Three of a Kind (Brelan)
8. Two Pair (Double Paire)
9. Pair (Paire)
10. High Card (Carte haute)

### 6. Intelligence Artificielle

L'IA prend des décisions automatiquement :
- Checke quand c'est possible
- Suit (call) si elle a assez de jetons
- Se couche (fold) sinon

### 7. Gestion des tours

- Chaque joueur joue à son tour
- Le tour se termine quand tous les joueurs actifs ont :
  - Misé le même montant
  - Agi au moins une fois
- L'IA joue automatiquement son tour
- Le jeu passe à la phase suivante automatiquement

## Documentation Swagger

L'API est documentée avec Swagger. Une fois l'application lancée, accédez à :

```
http://localhost:3000/api
```

Vous y trouverez :
- La liste complète des routes
- Les schémas de données (DTOs)
- Les codes de réponse possibles
- Un testeur d'API interactif

Pour utiliser les routes protégées dans Swagger :
1. Authentifiez-vous via `/auth/login`
2. Cliquez sur "Authorize" en haut de la page
3. Entrez votre token : `Bearer <votre-token>`

## Technologies utilisées

- **NestJS** : Framework Node.js pour l'API
- **MongoDB** : Base de données NoSQL
- **Mongoose** : ODM pour MongoDB
- **JWT** : Authentification par tokens
- **bcrypt** : Hashage des mots de passe
- **class-validator** : Validation des DTOs
- **Swagger** : Documentation de l'API
- **Docker** : Conteneurisation

## Développement

### Scripts disponibles

```bash
npm run build          # Compiler l'application
npm run start          # Démarrer l'application
npm run start:dev      # Mode développement avec hot-reload
npm run start:debug    # Mode debug
npm run start:prod     # Mode production

# Docker
npm run dev            # Lancer avec Docker Compose
npm run down           # Arrêter Docker Compose
npm run logs:app       # Logs de l'application
npm run logs:db        # Logs de MongoDB
npm run build:docker   # Rebuild les images Docker
```
