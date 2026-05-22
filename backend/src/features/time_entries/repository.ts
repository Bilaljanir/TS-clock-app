import sql from "../../db";
import type { Project } from "../projects/repository";
import type { Label } from "../labels/repository";

export type TimeEntry = {
  id: number;
  project_id?: number;
  description?: string;
  start_time: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  project?: Pick<Project, "id" | "name">;
  labels?: Pick<Label, "id" | "name" | "color">[];
};

const entrySelect = sql`
  te.id,
  te.project_id,
  te.description,
  te.start_time,
  te.end_time,
  te.created_at,
  te.updated_at,
  CASE WHEN p.id IS NOT NULL THEN json_build_object('id', p.id, 'name', p.name) END AS project,
  COALESCE(
    json_agg(
      json_build_object('id', l.id, 'name', l.name, 'color', l.color)
      ORDER BY l.id
    ) FILTER (WHERE l.id IS NOT NULL),
    '[]'::json
  ) AS labels
`;

const entryFrom = sql`
  FROM time_entries te
  LEFT JOIN projects p ON p.id = te.project_id
  LEFT JOIN time_entry_labels tel ON tel.time_entry_id = te.id
  LEFT JOIN labels l ON l.id = tel.label_id
`;

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

const SORTABLE_COLUMNS = new Set(["created_at", "start_time", "end_time", "description", "id"]);

type Queryable = {
  <T extends any[]>(strings: TemplateStringsArray, ...values: any[]): Promise<T>;
};

async function getEntryById(conn: Queryable, id: number): Promise<TimeEntry | null> {
  const [result] = await conn<TimeEntry[]>`
    SELECT ${entrySelect}
    ${entryFrom}
    WHERE te.id = ${id}
    GROUP BY te.id, p.id, p.name
  `;
  return result ?? null;
}

export async function findById(id: number): Promise<TimeEntry | null> {
  return getEntryById(sql, id);
}

export async function findAll(
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = "created_at",
  sortOrder: string = "desc",
): Promise<PaginatedResult<TimeEntry>> {
  if (!SORTABLE_COLUMNS.has(sortBy)) sortBy = "created_at";
  if (sortOrder !== "asc" && sortOrder !== "desc") sortOrder = "desc";

  const offset = (page - 1) * pageSize;

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM time_entries`;

  const sortDir = sortOrder === "desc" ? sql`DESC` : sql`ASC`;

  const data = await sql<TimeEntry[]>`
    SELECT ${entrySelect}
    ${entryFrom}
    GROUP BY te.id, p.id, p.name
    ORDER BY te.${sql(sortBy)} ${sortDir}
    LIMIT ${pageSize}
    OFFSET ${offset}`;

  return { data, page, pageSize, total: count };
}

export async function findActive(): Promise<TimeEntry | null> {
  const [entry] = await sql<TimeEntry[]>`
    SELECT ${entrySelect}
    ${entryFrom}
    WHERE te.end_time IS NULL
    GROUP BY te.id, p.id, p.name
    LIMIT 1
  `;
  return entry ?? null;
}

export async function create(data: {
  project_id: number;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  label_ids?: number[];
}): Promise<TimeEntry> {
  return await sql.begin(async (tx) => {
    const [entry] = await tx<TimeEntry[]>`
      INSERT INTO time_entries (project_id, description, start_time, end_time)
      VALUES (
        ${data.project_id},
        ${data.description ?? null},
        ${data.start_time},
        ${data.end_time ?? null}
      )
      RETURNING *
    `;

    if (data.label_ids?.length) {
      await tx`
        INSERT INTO time_entry_labels (time_entry_id, label_id)
        SELECT ${entry.id}, unnest(${data.label_ids}::int[])
        ON CONFLICT DO NOTHING
      `;
    }

    return (await getEntryById(tx, entry.id))!;
  });
}

export async function update(
  id: number,
  data: {
    project_id?: number;
    description?: string | null;
    start_time?: string;
    end_time?: string | null;
    label_ids?: number[];
  },
): Promise<TimeEntry | null> {
  return await sql.begin(async (tx) => {
    const hasFieldChanges =
      data.project_id !== undefined ||
      data.description !== undefined ||
      data.start_time !== undefined ||
      data.end_time !== undefined;

    if (!hasFieldChanges && data.label_ids === undefined) {
      return getEntryById(tx, id);
    }

    if (hasFieldChanges) {
      const [updated] = await tx<TimeEntry[]>`
        UPDATE time_entries SET
          project_id = ${data.project_id !== undefined ? sql`${data.project_id}` : sql`project_id`},
          description = ${data.description !== undefined ? sql`${data.description}` : sql`description`},
          start_time = ${data.start_time !== undefined ? sql`${data.start_time}` : sql`start_time`},
          end_time = ${data.end_time !== undefined ? sql`${data.end_time}` : sql`end_time`}
        WHERE id = ${id}
        RETURNING *
      `;
      if (!updated) return null;
    }

    if (data.label_ids !== undefined) {
      await tx`DELETE FROM time_entry_labels WHERE time_entry_id = ${id}`;
      if (data.label_ids.length > 0) {
        await tx`
          INSERT INTO time_entry_labels (time_entry_id, label_id)
          SELECT ${id}, unnest(${data.label_ids}::int[])
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return getEntryById(tx, id);
  });
}

export async function clockIn(data: {
  project_id: number;
  description?: string | null;
  label_ids?: number[];
}): Promise<TimeEntry> {
  return await sql.begin(async (tx) => {
    const [entry] = await tx<TimeEntry[]>`
      INSERT INTO time_entries (project_id, description, start_time, end_time)
      VALUES (${data.project_id}, ${data.description ?? null}, NOW(), NULL)
      RETURNING *
    `;

    if (data.label_ids?.length) {
      await tx`
        INSERT INTO time_entry_labels (time_entry_id, label_id)
        SELECT ${entry.id}, unnest(${data.label_ids}::int[])
        ON CONFLICT DO NOTHING
      `;
    }

    return (await getEntryById(tx, entry.id))!;
  });
}

export async function clockOut(description?: string | null): Promise<TimeEntry | null> {
  return await sql.begin(async (tx) => {
    const [entry] = await tx<TimeEntry[]>`
      UPDATE time_entries SET
        end_time = NOW(),
        description = COALESCE(${description ?? null}, description)
      WHERE end_time IS NULL
      RETURNING *
    `;
    if (!entry) return null;

    return getEntryById(tx, entry.id);
  });
}

export async function clockSwitch(data: {
  project_id?: number;
  description?: string | null;
  label_ids?: number[];
}): Promise<{ previous: TimeEntry; current: TimeEntry } | null> {
  return await sql.begin(async (tx) => {
    const [active] = await tx<TimeEntry[]>`
      SELECT ${entrySelect}
      ${entryFrom}
      WHERE te.end_time IS NULL
      GROUP BY te.id, p.id, p.name
      LIMIT 1
    `;
    if (!active) return null;

    await tx`
      UPDATE time_entries SET end_time = NOW() WHERE id = ${active.id}
    `;

    const projectId: number = data.project_id ?? (active.project_id as number);
    const desc = data.description !== undefined ? data.description : active.description;

    const [next] = await tx<TimeEntry[]>`
      INSERT INTO time_entries (project_id, description, start_time, end_time)
      VALUES (${projectId}, ${desc ?? null}, NOW(), NULL)
      RETURNING *
    `;

    const labelIds = data.label_ids ?? (
      await tx<{ label_id: number }[]>`
        SELECT label_id FROM time_entry_labels WHERE time_entry_id = ${active.id}
      `
    ).map((r) => r.label_id);

    if (labelIds.length > 0) {
      await tx`
        INSERT INTO time_entry_labels (time_entry_id, label_id)
        SELECT ${next.id}, unnest(${labelIds}::int[])
        ON CONFLICT DO NOTHING
      `;
    }

    return {
      previous: (await getEntryById(tx, active.id))!,
      current: (await getEntryById(tx, next.id))!,
    };
  });
}

export async function remove(id: number): Promise<TimeEntry | null> {
  const [entry] = await sql<TimeEntry[]>`
    DELETE FROM time_entries WHERE id = ${id}
    RETURNING *
  `;
  return entry ?? null;
}
