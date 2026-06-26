# Statistiques

La page `/stats` montre le temps passé **par projet** et **par label**, avec un
filtre par dates (du / au).

## Comment ça marche

- On additionne la durée (`end_time - start_time`) de chaque entrée.
- On compte seulement les entrées **terminées** (une session en cours n'a pas
  encore de durée).
- Le filtre `du / au` se base sur la **date de début** de l'entrée.
- Une entrée qui a plusieurs labels est comptée pour chacun de ses labels. Donc
  le total par label peut être plus grand que le temps réellement travaillé
  (c'est normal, et c'est indiqué sur la page).
- L'API renvoie des **secondes**, c'est le front qui affiche "1h 20m".

## L'optimisation (vues matérialisées)

Plutôt que de tout recalculer à chaque ouverture de la page, les totaux sont
pré-calculés **par jour** dans deux vues matérialisées :

- `stats_project_daily` → temps par projet et par jour
- `stats_label_daily` → temps par label et par jour

Pourquoi "par jour" ? Parce qu'on peut quand même filtrer entre deux dates : il
suffit d'additionner les jours de la plage. Un total global pré-calculé, lui,
serait impossible à filtrer par date.

Une vue matérialisée ne se met pas à jour toute seule. Pour que les chiffres
restent justes, je la rafraîchis à chaque fois qu'une entrée change (création,
modif, suppression, pointage). C'est un petit coût à l'écriture, assumé à cette
échelle. Sur un gros volume, on ferait plutôt un rafraîchissement automatique
toutes les X minutes (ex. pg_cron). Il existe aussi un `POST /stats/refresh`
manuel au cas où.

## L'API

```
GET /stats?from=AAAA-MM-JJ&to=AAAA-MM-JJ
→ {
    range: { from, to },
    total_seconds,
    by_project: [{ project_id, name, total_seconds }],
    by_label:   [{ label_id, name, color, total_seconds }]
  }

POST /stats/refresh   → 204   (rafraîchit les vues)
```

## Les fichiers

- `db/schema.sql` → les 2 vues + leurs index
- `backend/src/features/stats/` → l'API stats (model, service, routes)
- `entries.service` / `clock.service` → appellent `refreshStats()` après écriture
- `frontend/src/routes/stats.tsx` → la page
- `frontend/src/lib/api.ts` + `format.ts` → client API et affichage des durées

## Vérifier que les chiffres sont bons

Comparer l'API à un calcul direct en base :

```bash
docker compose exec db psql -U clock -d ts_clock_app -c "
  SELECT p.name, SUM(EXTRACT(EPOCH FROM (te.end_time - te.start_time)))::bigint
  FROM time_entries te JOIN projects p ON p.id = te.project_id
  WHERE te.end_time IS NOT NULL GROUP BY p.name ORDER BY 2 DESC;"
```
