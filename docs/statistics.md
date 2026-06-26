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

## L'optimisation (le choix retenu)

Les totaux sont **calculés directement** sur `time_entries` au moment où on
ouvre la page, avec une simple agrégation SQL (`SUM(end_time - start_time)`
regroupé par projet / par label). Les index existants sur `time_entries`
(`idx_time_entries_start_time`, `idx_time_entries_project_id`) suffisent à
cette échelle.

**Pourquoi pas de vue matérialisée ?** J'avais d'abord pré-calculé les totaux
par jour dans deux vues matérialisées rafraîchies à chaque écriture. Mais un
`REFRESH MATERIALIZED VIEW` recalcule **toute** la vue à zéro : le faire à
chaque pointage revient à payer le coût d'agrégation complet sur chaque
écriture — soit plus cher que de calculer à la lecture, tout en couplant la
logique stats au pointage. Une vue matérialisée n'a d'intérêt que si les
lectures sont massives et le recalcul coûteux ; ici c'est l'inverse (beaucoup
de pointages, peu de consultations de la page). J'ai donc choisi l'agrégation
directe : **toujours à jour**, plus simple, et largement assez rapide à cette
échelle.

Si un jour le volume devenait gros, l'évolution serait soit une vue
matérialisée rafraîchie **sur un planning** (ex. pg_cron toutes les X minutes,
avec un léger retard assumé), soit une table de rollup mise à jour de façon
incrémentale — mais pas un refresh synchrone sur le chemin d'écriture.

## L'API

```
GET /stats?from=AAAA-MM-JJ&to=AAAA-MM-JJ
→ {
    range: { from, to },
    total_seconds,
    by_project: [{ project_id, name, total_seconds }],
    by_label:   [{ label_id, name, color, total_seconds }]
  }
```

## Les fichiers

- `backend/src/features/stats/` → l'API stats (model, service, routes) — l'agrégation SQL est dans `stats.service.ts`
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
