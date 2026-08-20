# TS Clock App

## Stack

- **Frontend** : React 19, TanStack Router, Vite, Tailwind CSS
- **Backend** : Bun, Elysia, Valibot (validation)
- **Base de données** : PostgreSQL 17 (Docker)

## Prérequis

- [Bun](https://bun.sh/) — `curl -fsSL https://bun.sh/install | bash`
- [Docker](https://www.docker.com/) avec Docker Compose

## Démarrage

### 1. Préparer l'environnement

```bash
cp .env.example .env
```

Le fichier `.env` configure à la fois Docker et le backend. Par défaut la DB est sur le port `5433` pour éviter les conflits avec un PostgreSQL déjà installé en 5432.

### 2. Lancer la base de données

```bash
docker compose up -d
```

Le schéma (`db/schema.sql`) est appliqué automatiquement au premier démarrage. Vérifier que tout est bon :

```bash
docker compose ps
```

### 3. Lancer le backend

```bash
cd backend
bun install
bun run dev
```

Le serveur démarre sur `http://localhost:3000`. On peut vérifier avec :

```bash
curl http://localhost:3000
On verra -> {"status":"ok","service":"ts-clock-app-api"}
```

### 4. Lancer le frontend

```bash
cd frontend
bun install
bun run dev
```

Ouvrir `http://localhost:5173` dans le navigateur.

## Réinitialiser la base

Pour repartir de zéro (supprimer toutes les données) :

```bash
docker compose down -v && docker compose up -d
```

Ou rejouer le schéma sans supprimer les données :

```bash
docker compose exec -T db psql -U clock -d clock < db/schema.sql
```

## Fonctionnalités

- **Horloge** : pointer l'arrivée / le départ sur un projet, avec labels
- **Entrées** : liste paginée des sessions de travail, édition manuelle
- **Projets & Labels** : CRUD simple
- **Statistiques** : temps total par projet et par label, filtrable par dates
