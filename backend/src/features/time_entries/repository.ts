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

const ENTRY_SELECT = `
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

const ENTRY_FROM = `
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
  totalPages: number;
};

export async function findAll(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResult<TimeEntry>> {
  const offset = (page - 1) * pageSize;

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM time_entries
  `;

  const data = await sql.unsafe<TimeEntry[]>(
    `
    SELECT ${ENTRY_SELECT}
    ${ENTRY_FROM}
    GROUP BY te.id, p.id, p.name
    ORDER BY te.created_at DESC
    LIMIT $1
    OFFSET $2
    `,
    [pageSize, offset],
  );

  return {
    data,
    page,
    pageSize,
    total: count,
    totalPages: Math.ceil(count / pageSize),
  };
}

export async function findById(id: number): Promise<TimeEntry | null> {
  const [entry] = await sql<TimeEntry[]>`
    SELECT ${sql(ENTRY_SELECT)}
    ${sql(ENTRY_FROM)}
    WHERE te.id = ${id}
    GROUP BY te.id, p.id, p.name
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

    if (data.label_ids && data.label_ids.length > 0) {
      for (const labelId of data.label_ids) {
          await tx`
              INSERT INTO time_entry_labels (time_entry_id, label_id)
              SELECT ${entry.id}, unnest(${data.label_ids}::int[])
                  ON CONFLICT DO NOTHING
          `;}
    }

    const result = await tx<TimeEntry[]>`
      SELECT ${sql(ENTRY_SELECT)}
      ${sql(ENTRY_FROM)}
      WHERE te.id = ${entry.id}
      GROUP BY te.id, p.id, p.name
    `;
    return result[0]!;
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
      const [existing] = await tx<TimeEntry[]>`SELECT ${sql(ENTRY_SELECT)} ${sql(ENTRY_FROM)} WHERE te.id = ${id} GROUP BY te.id, p.id, p.name`;
      return existing ?? null;
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

    const result = await tx<TimeEntry[]>`
      SELECT ${sql(ENTRY_SELECT)}
      ${sql(ENTRY_FROM)}
      WHERE te.id = ${id}
      GROUP BY te.id, p.id, p.name
    `;
    return result[0] ?? null;
  });
}

export async function remove(id: number): Promise<TimeEntry | null> {
  const [entry] = await sql<TimeEntry[]>`
    DELETE FROM time_entries WHERE id = ${id}
    RETURNING *
  `;
  return entry ?? null;
}
