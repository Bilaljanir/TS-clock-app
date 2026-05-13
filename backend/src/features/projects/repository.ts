import sql from "../../db";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export async function findAll(): Promise<Project[]> {
  return await sql<Project[]>`SELECT * FROM projects ORDER BY created_at DESC`;
}

export async function create(data: {
  name: string;
  description?: string | null;
}): Promise<Project> {
  const [project] = await sql<Project[]>`
    INSERT INTO projects (name, description)
    VALUES (${data.name}, ${data.description ?? null})
    RETURNING *
  `;
  return project;
}

export async function update(
  id: number,
  data: { name?: string; description?: string }
): Promise<Project | null> {
  const [project] = await sql<Project[]>`
    UPDATE projects SET
      name = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description)
    WHERE id = ${id}
    RETURNING *
  `;
  return project ?? null;
}

export async function remove(id: number): Promise<Project | null> {
  const [project] = await sql<Project[]>`
    DELETE FROM projects WHERE id = ${id}
    RETURNING *
  `;
  return project ?? null;
}
