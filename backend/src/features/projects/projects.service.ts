import { sql } from "../../db";
import { ConflictError, NotFoundError } from "../../lib/errors";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.model";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export async function listProjects(): Promise<Project[]> {
  return [...((await sql`SELECT * FROM projects ORDER BY name ASC`) as Project[])];
}

export async function getProject(id: number): Promise<Project> {
  const [project] = (await sql`
    SELECT * FROM projects WHERE id = ${id}
  `) as Project[];

  if (!project) throw new NotFoundError(`Projet ${id} introuvable.`);
  return project;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const [project] = (await sql`
    INSERT INTO projects (name, description)
    VALUES (${input.name}, ${input.description ?? null})
    RETURNING *
  `) as Project[];

  return project;
}

export async function updateProject(
  id: number,
  input: UpdateProjectInput,
): Promise<Project> {
  const current = await getProject(id); // lève 404 si absent

  const name = input.name ?? current.name;
  const description =
    input.description !== undefined ? input.description : current.description;

  const [project] = (await sql`
    UPDATE projects
    SET name = ${name}, description = ${description}
    WHERE id = ${id}
    RETURNING *
  `) as Project[];

  return project;
}

export async function deleteProject(id: number): Promise<void> {
  await getProject(id); // lève 404 si absent

  try {
    await sql`DELETE FROM projects WHERE id = ${id}`;
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new ConflictError(
        "Impossible de supprimer ce projet : des entrées de temps y sont rattachées. Supprimez ou réaffectez ces entrées d'abord.",
      );
    }
    throw error;
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "errno" in error &&
    (error as { errno?: string }).errno === "23503"
  );
}
