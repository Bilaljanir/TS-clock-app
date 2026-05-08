import { Elysia } from "elysia";
import * as v from "valibot";
import sql from "../../db";
import { CreateProjectSchema, UpdateProjectSchema } from "./schema";

export const projectsRoutes = new Elysia({ prefix: "/api/projects" })
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
    const result = v.safeParse(UpdateProjectSchema, body);
    if (!result.success) {
      set.status = 400;
      return { message: "Validation failed", issues: result.issues };
    }

    const { name, description } = result.output;

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
