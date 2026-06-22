import { Elysia } from "elysia";
import { IdParamSchema } from "../../lib/params";
import { validate } from "../../lib/validate";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects.model";
import * as projects from "./projects.service";

export const projectsRoutes = new Elysia({ prefix: "/projects" })
  .get("/", () => projects.listProjects())

  .get("/:id", ({ params }) => {
    const { id } = validate(IdParamSchema, params);
    return projects.getProject(id);
  })

  .post("/", ({ body, set }) => {
    const input = validate(CreateProjectSchema, body);
    set.status = 201;
    return projects.createProject(input);
  })

  .patch("/:id", ({ params, body }) => {
    const { id } = validate(IdParamSchema, params);
    const input = validate(UpdateProjectSchema, body);
    return projects.updateProject(id, input);
  })

  .delete("/:id", async ({ params, set }) => {
    const { id } = validate(IdParamSchema, params);
    await projects.deleteProject(id);
    set.status = 204;
  });
