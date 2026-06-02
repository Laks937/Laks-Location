# Laks Location

Monorepo production-ready pour une application mobile Expo + API Express/TypeScript avec MySQL et Stripe (acompte).

## Structure

- `app/` — application mobile React Native (Expo SDK récent, TypeScript strict)
- `server/` — API Node.js + Express (TypeScript strict)

## Prérequis

- Node.js 20+
- npm 10+
- MySQL 8+
- Stripe CLI (pour les webhooks en local)

## Installation

```bash
npm install
```

## Variables d'environnement

### App (`app/.env`)

Copier `app/.env.example` vers `app/.env` puis renseigner:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Server (`server/.env`)

Copier `server/.env.example` vers `server/.env` puis renseigner:

```env
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:8081
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=laks
MYSQL_PASSWORD=laks_password
MYSQL_DATABASE=laks_location
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
JWT_SECRET=replace-with-a-long-random-secret-of-at-least-32-characters
JWT_EXPIRES_IN=12h
DEPOSIT_PERCENT=30
```

## Lancer MySQL (option Docker)

```bash
cd server
docker compose up -d
```

## Initialiser le schéma + seed

```bash
mysql -u laks -p laks_location < server/sql/schema.sql
mysql -u laks -p laks_location < server/sql/seed.sql
```

## Lancer le projet

### API

```bash
npm run dev:server
```

### App Expo

```bash
npm run dev:app
```

## Scripts utiles

Racine:

- `npm run dev`
- `npm run dev:server`
- `npm run dev:app`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

## Stripe webhooks en local

Démarrer l'écoute Stripe vers l'API:

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Récupérer le `webhook signing secret` renvoyé par Stripe CLI et le placer dans `STRIPE_WEBHOOK_SECRET`.

## Notes de sécurité

- Requêtes SQL **préparées uniquement** via `mysql2/promise`.
- Secrets via variables d'environnement uniquement (`.env` non versionné).
- Auth admin avec JWT signé côté serveur + hash Bcrypt.
- Aucune donnée bancaire en clair: saisie et traitement carte via Stripe PaymentSheet.
- Le statut de paiement en base est mis à jour **uniquement** via webhook Stripe (source de vérité).
- Idempotence webhook gérée avec `stripe_event_last_id`.
