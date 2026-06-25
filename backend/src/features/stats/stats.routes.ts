import { Elysia } from "elysia";
import { validate } from "../../lib/validate";
import { StatsQuerySchema } from "./stats.model";
import * as stats from "./stats.service";

export const statsRoutes = new Elysia({ prefix: "/stats" })
  .get("/", ({ query }) => {
    const params = validate(StatsQuerySchema, query);
    return stats.getStats(params);
  })

  .post("/refresh", async ({ set }) => {
    await stats.refreshStats();
    set.status = 204;
  });
