import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { clockRoutes } from "./features/clock/clock.routes";
import { entriesRoutes } from "./features/entries/entries.routes";
import { labelsRoutes } from "./features/labels/labels.routes";
import { projectsRoutes } from "./features/projects/projects.routes";
import { AppError, type ErrorBody } from "./lib/errors";

// CORS promu en scope global pour s'appliquer à TOUS les routers
// (sinon les hooks ne se propagent pas de façon fiable aux sous-instances).
const corsPlugin = new Elysia({ name: "cors-global" }).use(cors()).as("global");

const app = new Elysia()
  .use(corsPlugin)
  .onError(({ code, error, set }): ErrorBody => {
    if (error instanceof AppError) {
      set.status = error.status;
      return error.toJSON();
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: { code: "NOT_FOUND", message: "Route introuvable." } };
    }

    if (code === "PARSE") {
      set.status = 400;
      return {
        error: { code: "BAD_REQUEST", message: "Corps de requête JSON invalide." },
      };
    }

    console.error(error);
    set.status = 500;
    return {
      error: { code: "INTERNAL", message: "Erreur interne du serveur." },
    };
  })
  .get("/", () => ({ status: "ok", service: "ts-clock-app-api" }))
  .use(projectsRoutes)
  .use(labelsRoutes)
  .use(entriesRoutes)
  .use(clockRoutes)
  .listen(3000);

console.log(`🦊 API Elysia démarrée sur http://localhost:${app.server?.port}`);
