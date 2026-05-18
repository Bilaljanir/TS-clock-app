import { Elysia } from "elysia";
import { projectsRoutes } from "./features/projects/routes";
import { labelsRoutes } from "./features/labels/routes";
import { timeEntriesRoutes } from "./features/time_entries/routes";

const app = new Elysia()
  .use(projectsRoutes)
  .use(labelsRoutes)
  .use(timeEntriesRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
