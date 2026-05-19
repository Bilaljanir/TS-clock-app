import { Elysia } from "elysia";
import { projectsRoutes } from "./features/projects/routes";
import { labelsRoutes } from "./features/labels/routes";
import { timeEntriesRoutes } from "./features/time_entries/routes";

const PG_CONSTRAINT_CODES = new Set(["23503", "23505", "23514"]);

const PG_CONSTRAINT_MESSAGES: Record<string, string> = {
  "23503": "Referenced resource does not exist",
  "23505": "Resource already exists",
  "23514": "Database constraint violation",
};

const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === "NOT_FOUND") return;
    if (code === "VALIDATION") return;

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as Record<string, unknown>).code === "string" &&
      PG_CONSTRAINT_CODES.has((error as unknown as Record<string, string>).code)
    ) {
      set.status = 400;
      return {
        message:
          PG_CONSTRAINT_MESSAGES[
            (error as unknown as Record<string, string>).code
          ] ?? "Constraint violation",
      };
    }

    console.error(error);
  })
  .use(projectsRoutes)
  .use(labelsRoutes)
  .use(timeEntriesRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
