import { Elysia } from "elysia";
import { projectsRoutes } from "./features/projects/routes";

const app = new Elysia().use(projectsRoutes).listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
