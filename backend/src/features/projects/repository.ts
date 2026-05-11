import sql from "../../db";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export async function findAll(): Promise<Project[]> {
  return await sql`SELECT * FROM projects ORDER BY created_at DESC` as unknown as Project[];
}

export async function create(data: {
  name: string;
  description?: string | null;
}): Promise<Project> {
  const [project] = await sql`
    INSERT INTO projects (name, description)
    VALUES (${data.name}, ${data.description ?? null})
    RETURNING *
  ` as unknown as Project[];
  return project;
}

export async function update(
  id: number,
  data: { name?: string; description?: string }
): Promise<Project | null> {
  const [project] = await sql`
    UPDATE projects SET
      name = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description)
    WHERE id = ${id}
    RETURNING *
  ` as unknown as Project[];
  return project ?? null;
}

export async function remove(id: number): Promise<Project | null> {
  const [project] = await sql`
    DELETE FROM projects WHERE id = ${id}
    RETURNING *
  ` as unknown as Project[];
  return project ?? null;
}
