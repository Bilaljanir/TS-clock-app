# TS Clock App

Application full-stack TypeScript de suivi du temps (time tracking).

- **Frontend** : React + TanStack Router (Vite) — port `5173`
- **Backend** : Bun + Elysia — port `3000`
- **Base de données** : PostgreSQL (Docker)

## Prérequis

- [Bun](https://bun.sh/) (dernière version)
- [Docker](https://www.docker.com/) avec Docker Compose

## 1. Variables d'environnement

```bash
cp .env.example .env
```

Le fichier `.env` est lu à la fois par Docker Compose et par le backend.
Par défaut la base est exposée sur le port `5433` (pour éviter un conflit avec
un PostgreSQL déjà installé sur `5432`).

## 2. Base de données (PostgreSQL via Docker)

Démarrer la base en **une seule commande** :

```bash
docker compose up -d
```

Le schéma (`db/schema.sql`) est exécuté automatiquement au **premier** démarrage
(quand le volume de données est vide).

Vérifier que la base tourne :

```bash
docker compose ps
docker compose exec db psql -U clock -d clock -c "\dt"
```

> ℹ️ Le schéma n'est rejoué automatiquement que sur une base vierge.
> Pour repartir de zéro après une modification du schéma :
> ```bash
> docker compose down -v && docker compose up -d
> ```
> Ou rejouer le DDL (idempotent) sur la base existante :
> ```bash
> docker compose exec -T db psql -U clock -d clock < db/schema.sql
> ```

Arrêter la base :

```bash
docker compose down        # garde les données
docker compose down -v     # supprime aussi les données
```

## 3. Backend

```bash
cd backend
bun install
bun run dev        # http://localhost:3000
```

## 4. Frontend

```bash
cd frontend
bun install
bun run dev        # http://localhost:5173
```
