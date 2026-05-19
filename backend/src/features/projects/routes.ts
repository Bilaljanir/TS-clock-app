import { Elysia, t } from "elysia";
import * as repo from "./repository";
import { CreateProjectSchema, UpdateProjectSchema } from "./schema";

export const projectsRoutes = new Elysia({ prefix: "/api/projects" })
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND") return;
    console.error(error);
  })

  .get("/", async () => {
    return await repo.findAll();
  })

  .post("/", async ({ body }) => {
    return await repo.create(body);
  }, {
    body: CreateProjectSchema,
  })

  .put("/:id", async ({ params: { id }, body, set }) => {
    if (body.name === undefined && body.description === undefined) {
      set.status = 400;
      return { message: "No fields to update" };
    }

    const project = await repo.update(id, body);

    if (!project) {
      set.status = 404;
      return { message: "Project not found" };
    }

    return project;
  }, {
    params: t.Object({ id: t.Numeric() }),
    body: UpdateProjectSchema,
  })

  .delete("/:id", async ({ params: { id }, set }) => {
    const entryCount = await repo.findTimeEntryCount(id);

    if (entryCount > 0) {
      set.status = 409;
      return {
        message: "Cannot delete project with associated time entries",
      };
    }

    const project = await repo.remove(id);

    if (!project) {
      set.status = 404;
      return { message: "Project not found" };
    }

    return { message: "Project deleted", project };
  }, {
    params: t.Object({ id: t.Numeric() }),
  });
