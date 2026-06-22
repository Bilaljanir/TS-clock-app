import { Elysia } from "elysia";
import { validate } from "../../lib/validate";
import { SetClockSchema } from "./clock.model";
import * as clock from "./clock.service";

export const clockRoutes = new Elysia({ prefix: "/clock" })
  .get("/", async () => ({ active: await clock.getActiveEntry() }))

  .put("/", async ({ body }) => {
    const input = validate(SetClockSchema, body);
    return { active: await clock.setClock(input) };
  });
