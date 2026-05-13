import { Elysia } from "elysia";
import { projectsRoutes } from "./features/projects/routes";
import { labelsRoutes } from "./features/labels/routes";

const app = new Elysia().use(projectsRoutes).use(labelsRoutes).listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
