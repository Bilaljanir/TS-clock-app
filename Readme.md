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

## Statistiques

La page `/stats` montre le temps passé par projet et par label, avec un filtre par dates.

Pour aller vite, j'ai utilisé des **vues matérialisées** : au lieu de recalculer
les totaux à chaque ouverture de la page, le total est déjà pré-calculé par jour
dans la base. Je garde le grain "par jour" pour pouvoir quand même filtrer entre
deux dates (il suffit d'additionner les jours).

Pour que les chiffres restent justes, je rafraîchis ces vues à chaque fois qu'une
entrée change (création, modif, suppression, pointage). C'est un petit coût à
l'écriture, mais les stats sont toujours à jour. Sur un gros volume, on ferait
plutôt un rafraîchissement automatique toutes les X minutes.

Plus de détails dans [`docs/statistics.md`](docs/statistics.md).
