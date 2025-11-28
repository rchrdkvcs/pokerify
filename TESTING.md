# Guide de Test - Pokerify API

Ce guide vous permet de tester rapidement les fonctionnalités principales de l'API.

## Démarrage

```bash
# Lancer l'application avec Docker
npm run dev

# Ou sans Docker (MongoDB doit être lancé)
npm run start:dev
```

L'API est accessible sur `http://localhost:3000`
La documentation Swagger est sur `http://localhost:3000/api`

## Scénario de test complet

### 1. Créer deux utilisateurs

**User 1:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

Réponse attendue:
```json
{
  "access_token": "eyJhbGciOiJIUz..."
}
```

Sauvegarder le token comme `TOKEN_ALICE`

**User 2:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

Sauvegarder le token comme `TOKEN_BOB`

### 2. Vérifier les informations utilisateur

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer TOKEN_ALICE"
```

Réponse attendue:
```json
{
  "_id": "...",
  "username": "alice",
  "stack": 1000
}
```

### 3. Créer une table de poker

```bash
curl -X POST http://localhost:3000/tables \
  -H "Authorization: Bearer TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{
    "smallBlind": 5,
    "bigBlind": 10
  }'
```

Réponse attendue:
```json
{
  "_id": "TABLE_ID",
  "smallBlind": 5,
  "bigBlind": 10,
  "pot": 0,
  "players": [],
  "communityCards": [],
  "state": "waiting",
  ...
}
```

Sauvegarder `TABLE_ID`

### 4. Alice rejoint la table

```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/join \
  -H "Authorization: Bearer TOKEN_ALICE"
```

**Important:** Une IA est automatiquement ajoutée si Alice est seule !

### 5. Bob rejoint la table

```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/join \
  -H "Authorization: Bearer TOKEN_BOB"
```

### 6. Vérifier l'état de la table

```bash
curl -X GET http://localhost:3000/tables/TABLE_ID \
  -H "Authorization: Bearer TOKEN_ALICE"
```

Vous devriez voir Alice, Bob, et potentiellement une IA dans `players`.

### 7. Démarrer la partie

```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/start \
  -H "Authorization: Bearer TOKEN_ALICE"
```

Après cette commande:
- Les cartes sont distribuées (2 par joueur)
- Les blindes sont placées
- Le jeu est en phase `pre_flop`
- C'est au tour d'un joueur de jouer

### 8. Vérifier qui doit jouer

```bash
curl -X GET http://localhost:3000/tables/TABLE_ID \
  -H "Authorization: Bearer TOKEN_ALICE"
```

Regarder le champ `currentPlayerIndex` pour savoir qui doit jouer.

### 9. Effectuer des actions

**Check (si pas de mise à suivre):**
```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/action \
  -H "Authorization: Bearer TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "check"
  }'
```

**Call (suivre la mise):**
```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/action \
  -H "Authorization: Bearer TOKEN_BOB" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "call"
  }'
```

**Raise (relancer):**
```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/action \
  -H "Authorization: Bearer TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "raise",
    "amount": 20
  }'
```

**Fold (se coucher):**
```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/action \
  -H "Authorization: Bearer TOKEN_BOB" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "fold"
  }'
```

**All-in (tapis):**
```bash
curl -X POST http://localhost:3000/tables/TABLE_ID/action \
  -H "Authorization: Bearer TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "all_in"
  }'
```

### 10. Progression du jeu

Le jeu progresse automatiquement à travers les phases:
1. **PRE_FLOP** → Après que tous les joueurs aient agi
2. **FLOP** → 3 cartes communes sont révélées
3. **TURN** → 4ème carte commune
4. **RIVER** → 5ème carte commune
5. **SHOWDOWN** → Évaluation des mains et détermination du gagnant

À chaque phase, vérifier l'état avec:
```bash
curl -X GET http://localhost:3000/tables/TABLE_ID \
  -H "Authorization: Bearer TOKEN_ALICE"
```

### 11. Fin de partie

Quand le jeu est en état `finished`:
- Le gagnant est déterminé automatiquement
- Son stack est augmenté du pot
- Les stacks sont visibles dans la réponse

## Test avec Swagger UI

Utilisez l'interface Swagger pour tester plus facilement:

1. Ouvrir `http://localhost:3000/api`
2. Utiliser `/auth/register` pour créer un compte
3. Copier le `access_token`
4. Cliquer sur "Authorize" en haut
5. Entrer: `Bearer <votre-token>`
6. Tester toutes les routes directement depuis l'interface

## Vérifications importantes

### ✅ Validation des données
Essayez d'envoyer des données invalides:
```bash
# Username trop court
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

Devrait retourner une erreur 400.

### ✅ Authentification
Essayez d'accéder à une route protégée sans token:
```bash
curl -X GET http://localhost:3000/tables
```

Devrait retourner une erreur 401.

### ✅ IA automatique
Quand un joueur rejoint seul une table:
- Une IA doit être automatiquement ajoutée
- L'IA joue automatiquement son tour
- Le jeu continue sans intervention

### ✅ Évaluation des mains
À la fin d'une partie (SHOWDOWN):
- Les mains sont évaluées automatiquement
- Le meilleur joueur gagne
- En cas d'égalité, le pot est partagé

### ✅ Gestion des tours
- Seul le joueur dont c'est le tour peut jouer
- L'IA joue automatiquement
- Les tours avancent automatiquement

## Erreurs courantes

### "Not your turn"
→ Ce n'est pas à votre tour de jouer. Vérifiez `currentPlayerIndex`.

### "Cannot check, must call or raise"
→ Il y a une mise à suivre, vous devez `call`, `raise`, `fold`, ou `all_in`.

### "Insufficient stack"
→ Vous n'avez pas assez de jetons pour cette action.

### "Table is full"
→ La table a atteint le nombre maximum de joueurs (8).

### "Need at least 2 players to start"
→ Attendez qu'au moins 2 joueurs rejoignent la table.

## Logs et Debug

Pour voir les logs en temps réel avec Docker:
```bash
npm run logs:app
```

Pour débugger, vérifier:
1. Les logs de l'application
2. L'état de la table avec GET `/tables/:id`
3. Les informations utilisateur avec GET `/auth/me`

## Collection Bruno

Le projet inclut des fichiers de test Bruno dans le dossier `http/`:
- `register.bru` - Test de création de compte
- `login.bru` - Test de connexion
- `me.bru` - Test d'informations utilisateur
- `tables.bru` - Tests des tables
- `collection.bru` - Configuration de la collection

Utilisez Bruno (https://www.usebruno.com/) pour importer et exécuter ces tests.
