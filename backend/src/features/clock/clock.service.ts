import { sql } from "../../db";
import {
  assertLabelsExist,
  assertProjectExists,
  type EntryDetail,
  getEntry,
  insertLabelLinks,
} from "../entries/entries.service";
import type { SetClockInput } from "./clock.model";

/** Entrée actuellement en cours (end_time IS NULL), ou null si déconnecté. */
export async function getActiveEntry(): Promise<EntryDetail | null> {
  const [row] = (await sql`
    SELECT id FROM time_entries WHERE end_time IS NULL
  `) as { id: number }[];

  return row ? getEntry(row.id) : null;
}

/**
 * Définit l'état de l'horloge en une opération (clock in / switch / clock out).
 *
 * - project_id null  -> clock out : on ferme le segment actif éventuel.
 * - project_id défini -> clock in OU switch : on ferme le segment actif
 *   éventuel et on en ouvre un nouveau (close + open atomiques).
 */
export async function setClock(
  input: SetClockInput,
): Promise<EntryDetail | null> {
  // Clock out.
  if (input.project_id === null) {
    await sql`UPDATE time_entries SET end_time = now() WHERE end_time IS NULL`;
    return null;
  }

  // Validation AVANT toute mutation : un switch vers un projet/label invalide
  // ne doit pas fermer la session en cours.
  await assertProjectExists(input.project_id);
  await assertLabelsExist(input.label_ids);

  const id = await sql.begin(async (tx) => {
    // Ferme le segment actif (aucun en clock-in, le courant en switch).
    await tx`UPDATE time_entries SET end_time = now() WHERE end_time IS NULL`;

    const [row] = (await tx`
      INSERT INTO time_entries (project_id, start_time)
      VALUES (${input.project_id}, now())
      RETURNING id
    `) as { id: number }[];

    await insertLabelLinks(tx, row.id, input.label_ids);
    return row.id;
  });

  return getEntry(id);
}
