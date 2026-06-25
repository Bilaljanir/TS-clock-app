import { sql } from "../../db";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors";
import { type PageParams, type Paginated, paginate } from "../../lib/pagination";
import { refreshStats } from "../stats/stats.service";
import type { CreateEntryInput, UpdateEntryInput } from "./entries.model";

export type EntryDetail = {
  id: number;
  description: string | null;
  start_time: string;
  end_time: string | null;
  project: { id: number; name: string; description: string | null };
  labels: { id: number; name: string; color: string }[];
  created_at: string;
  updated_at: string;
};

type RawEntry = {
  id: number;
  project_id: number;
  description: string | null;
  start_time: string;
  end_time: string | null;
};

/**
 * Liste paginée des entrées.
 * Tri par défaut : plus récentes d'abord (start_time DESC, puis id DESC en départage).
 */
export async function listEntries(
  params: PageParams,
): Promise<Paginated<EntryDetail>> {
  const offset = (params.page - 1) * params.pageSize;

  const [{ count }] = (await sql`
    SELECT COUNT(*)::int AS count FROM time_entries
  `) as { count: number }[];

  const data = (await sql`
    SELECT
      te.id, te.description, te.start_time, te.end_time, te.created_at, te.updated_at,
      jsonb_build_object('id', p.id, 'name', p.name, 'description', p.description) AS project,
      COALESCE(
        jsonb_agg(
          jsonb_build_object('id', l.id, 'name', l.name, 'color', l.color)
          ORDER BY l.name
        ) FILTER (WHERE l.id IS NOT NULL),
        '[]'::jsonb
      ) AS labels
    FROM time_entries te
    JOIN projects p ON p.id = te.project_id
    LEFT JOIN time_entry_labels tel ON tel.time_entry_id = te.id
    LEFT JOIN labels l ON l.id = tel.label_id
    GROUP BY te.id, p.id
    ORDER BY te.start_time DESC, te.id DESC
    LIMIT ${params.pageSize} OFFSET ${offset}
  `) as EntryDetail[];

  return paginate(data, count, params);
}

export async function getEntry(id: number): Promise<EntryDetail> {
  const [entry] = (await sql`
    SELECT
      te.id, te.description, te.start_time, te.end_time, te.created_at, te.updated_at,
      jsonb_build_object('id', p.id, 'name', p.name, 'description', p.description) AS project,
      COALESCE(
        jsonb_agg(
          jsonb_build_object('id', l.id, 'name', l.name, 'color', l.color)
          ORDER BY l.name
        ) FILTER (WHERE l.id IS NOT NULL),
        '[]'::jsonb
      ) AS labels
    FROM time_entries te
    JOIN projects p ON p.id = te.project_id
    LEFT JOIN time_entry_labels tel ON tel.time_entry_id = te.id
    LEFT JOIN labels l ON l.id = tel.label_id
    WHERE te.id = ${id}
    GROUP BY te.id, p.id
  `) as EntryDetail[];

  if (!entry) throw new NotFoundError(`Entrée ${id} introuvable.`);
  return entry;
}

export async function createEntry(input: CreateEntryInput): Promise<EntryDetail> {
  await assertProjectExists(input.project_id);
  await assertLabelsExist(input.label_ids);

  try {
    const id = await sql.begin(async (tx) => {
      const [row] = (await tx`
        INSERT INTO time_entries (project_id, description, start_time, end_time)
        VALUES (${input.project_id}, ${input.description ?? null}, ${input.start_time}, ${input.end_time ?? null})
        RETURNING id
      `) as { id: number }[];

      await insertLabelLinks(tx, row.id, input.label_ids);
      return row.id;
    });

    await refreshStats();
    return getEntry(id);
  } catch (error) {
    throw mapActiveEntryConflict(error);
  }
}

export async function updateEntry(
  id: number,
  input: UpdateEntryInput,
): Promise<EntryDetail> {
  const current = await getRawEntry(id); // lève 404 si absent

  const project_id = input.project_id ?? current.project_id;
  const description =
    input.description !== undefined ? input.description : current.description;
  const start_time = input.start_time ?? current.start_time;
  const end_time =
    input.end_time !== undefined ? input.end_time : current.end_time;

  if (input.project_id !== undefined) await assertProjectExists(project_id);
  if (input.label_ids !== undefined) await assertLabelsExist(input.label_ids);

  if (end_time != null && new Date(end_time) <= new Date(start_time)) {
    throw new ValidationError([
      { path: "end_time", message: "La fin doit être postérieure au début." },
    ]);
  }

  try {
    await sql.begin(async (tx) => {
      await tx`
        UPDATE time_entries
        SET project_id = ${project_id},
            description = ${description},
            start_time = ${start_time},
            end_time = ${end_time}
        WHERE id = ${id}
      `;

      if (input.label_ids !== undefined) {
        await tx`DELETE FROM time_entry_labels WHERE time_entry_id = ${id}`;
        await insertLabelLinks(tx, id, input.label_ids);
      }
    });
  } catch (error) {
    throw mapActiveEntryConflict(error);
  }

  await refreshStats();
  return getEntry(id);
}

export async function deleteEntry(id: number): Promise<void> {
  await getRawEntry(id); // lève 404 si absent
  // ON DELETE CASCADE retire les associations dans time_entry_labels.
  await sql`DELETE FROM time_entries WHERE id = ${id}`;
  await refreshStats();
}

// --- Helpers privés ---

/**
 * L'index unique idx_one_active_entry interdit plus d'une entrée sans heure de
 * fin (une seule "horloge" active à la fois). On transforme la violation
 * (SQLSTATE 23505) en 409 explicite plutôt qu'en 500.
 */
function mapActiveEntryConflict(error: unknown): unknown {
  const isUniqueViolation =
    typeof error === "object" &&
    error !== null &&
    "errno" in error &&
    (error as { errno?: string }).errno === "23505";

  if (isUniqueViolation) {
    return new ConflictError(
      "Une entrée est déjà en cours. Terminez l'entrée active (renseignez une heure de fin) avant d'en démarrer une nouvelle.",
    );
  }
  return error;
}

async function getRawEntry(id: number): Promise<RawEntry> {
  const [entry] = (await sql`
    SELECT id, project_id, description, start_time, end_time
    FROM time_entries WHERE id = ${id}
  `) as RawEntry[];

  if (!entry) throw new NotFoundError(`Entrée ${id} introuvable.`);
  return entry;
}

export async function assertProjectExists(projectId: number): Promise<void> {
  const [row] = (await sql`
    SELECT 1 FROM projects WHERE id = ${projectId}
  `) as unknown[];

  if (!row) {
    throw new ValidationError([
      { path: "project_id", message: `Le projet ${projectId} n'existe pas.` },
    ]);
  }
}

export async function assertLabelsExist(labelIds: number[]): Promise<void> {
  if (labelIds.length === 0) return;

  const unique = [...new Set(labelIds)];
  const rows = (await sql`
    SELECT id FROM labels WHERE id IN ${sql(unique)}
  `) as { id: number }[];

  const found = new Set(rows.map((r) => r.id));
  const missing = unique.filter((id) => !found.has(id));

  if (missing.length > 0) {
    throw new ValidationError([
      {
        path: "label_ids",
        message: `Labels introuvables : ${missing.join(", ")}.`,
      },
    ]);
  }
}

export async function insertLabelLinks(
  tx: typeof sql,
  entryId: number,
  labelIds: number[],
): Promise<void> {
  const unique = [...new Set(labelIds)];
  if (unique.length === 0) return;

  const rows = unique.map((label_id) => ({
    time_entry_id: entryId,
    label_id,
  }));
  await tx`INSERT INTO time_entry_labels ${tx(rows)}`;
}
