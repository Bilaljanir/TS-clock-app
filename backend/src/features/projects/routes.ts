import { Elysia } from "elysia";
import * as v from "valibot";
import sql from "../../db";
import { CreateProjectSchema, UpdateProjectSchema } from "./schema";

const isValidId = (id: string) => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
};

export const projectsRoutes = new Elysia({ prefix: "/api/projects" })
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND") return;
    return { message: error.message };
  })

  .get("/", async () => {
    const projects = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
    return projects;
  })

  .post("/", async ({ body, set }) => {
    const result = v.safeParse(CreateProjectSchema, body);
    if (!result.success) {
      set.status = 400;
      return { message: "Validation failed", issues: result.issues };
    }

    const { name, description } = result.output;
    const [project] = await sql`
      INSERT INTO projects (name, description)
      VALUES (${name}, ${description ?? null})
      RETURNING *
    `;
    return project;
  })

  .put("/:id", async ({ params, body, set }) => {
    if (!isValidId(params.id)) {
      set.status = 400;
      return { message: "Invalid project ID" };
    }

    const result = v.safeParse(UpdateProjectSchema, body);
    if (!result.success) {
      set.status = 400;
      return { message: "Validation failed", issues: result.issues };
    }

    const { name, description } = result.output;

    if (name === undefined && description === undefined) {
      set.status = 400;
      return { message: "No fields to update" };
    }

    const [project] = await sql`
      UPDATE projects SET
        name = COALESCE(${name ?? null}, name),
        description = COALESCE(${description ?? null}, description)
      WHERE id = ${Number(params.id)}
      RETURNING *
    `;

    if (!project) {
      set.status = 404;
      return { message: "Project not found" };
    }

    return project;
  })

  .delete("/:id", async ({ params, set }) => {
    if (!isValidId(params.id)) {
      set.status = 400;
      return { message: "Invalid project ID" };
    }

    const [project] = await sql`
      DELETE FROM projects WHERE id = ${Number(params.id)}
      RETURNING *
    `;

    if (!project) {
      set.status = 404;
      return { message: "Project not found" };
    }

    return { message: "Project deleted", project };
  });
