import sql from "../../db";

export type TimeEntry = {
  id: number;
  project_id: number | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  project: { id: number; name: string } | null;
  labels: { id: number; name: string; color: string | null }[];
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

export async function findAll(): Promise<TimeEntry[]> {
  return await sql<TimeEntry[]>`
    SELECT ${sql(ENTRY_SELECT)}
    ${sql(ENTRY_FROM)}
    GROUP BY te.id, p.id, p.name
    ORDER BY te.created_at DESC
  `;
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
          VALUES (${entry.id}, ${labelId})
          ON CONFLICT DO NOTHING
        `;
      }
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
    description?: string;
    start_time?: string;
    end_time?: string;
    label_ids?: number[];
  },
): Promise<TimeEntry | null> {
  return await sql.begin(async (tx) => {
    const [updated] = await tx<TimeEntry[]>`
      UPDATE time_entries SET
        project_id = COALESCE(${data.project_id ?? null}, project_id),
        description = COALESCE(${data.description ?? null}, description),
        start_time = COALESCE(${data.start_time ?? null}, start_time),
        end_time = COALESCE(${data.end_time ?? null}, end_time)
      WHERE id = ${id}
      RETURNING *
    `;
    if (!updated) return null;

    if (data.label_ids !== undefined) {
      await tx`DELETE FROM time_entry_labels WHERE time_entry_id = ${id}`;
      if (data.label_ids.length > 0) {
        for (const labelId of data.label_ids) {
          await tx`
            INSERT INTO time_entry_labels (time_entry_id, label_id)
            VALUES (${id}, ${labelId})
            ON CONFLICT DO NOTHING
          `;
        }
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
