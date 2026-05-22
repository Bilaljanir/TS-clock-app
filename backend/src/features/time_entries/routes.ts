import { Elysia, t } from "elysia";
import { NotFoundError } from "../../errors";
import * as repo from "./repository";
import {
  ClockInSchema,
  ClockOutSchema,
  ClockSwitchSchema,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
} from "./schema";

const SORTABLE_COLUMNS = new Set(["created_at", "start_time", "end_time", "description", "id"] as const) as Set<string>;

export const timeEntriesRoutes = new Elysia({ prefix: "/api/time-entries" })

  .get("/", async ({ query: { page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" }, set }) => {
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      set.status = 400;
      return { message: "page must be >= 1 and pageSize must be between 1 and 100" };
    }
    if (!SORTABLE_COLUMNS.has(sortBy)) {
      set.status = 400;
      return { message: `sortBy must be one of: ${[...SORTABLE_COLUMNS].join(", ")}` };
    }
    return await repo.findAll(page, pageSize, sortBy, sortOrder);
  }, {
    query: t.Object({
      page: t.Optional(t.Numeric()),
      pageSize: t.Optional(t.Numeric()),
      sortBy: t.Optional(t.String()),
      sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
    }),
  })

  .post("/clock-in", async ({ body, set }) => {
    const active = await repo.findActive();
    if (active) {
      set.status = 409;
      return { message: "Already clocked in. Clock out first or switch project." };
    }
    return await repo.clockIn(body);
  }, {
    body: ClockInSchema,
  })

  .post("/clock-out", async ({ body, set }) => {
    const entry = await repo.clockOut(body.description);
    if (!entry) {
      set.status = 404;
      return { message: "Not clocked in" };
    }
    return entry;
  }, {
    body: ClockOutSchema,
  })

  .put("/clock-switch", async ({ body, set }) => {
    const result = await repo.clockSwitch(body);
    if (!result) {
      set.status = 404;
      return { message: "Not clocked in" };
    }
    return result;
  }, {
    body: ClockSwitchSchema,
  })

  .get("/active", async () => {
    const entry = await repo.findActive();
    return entry ?? { message: "Not clocked in" };
  })

  .get("/:id", async ({ params: { id } }) => {
    const entry = await repo.findById(id);
    if (!entry) throw new NotFoundError("Time entry");
    return entry;
  }, {
    params: t.Object({ id: t.Numeric() }),
  })

  .post("/", async ({ body }) => {
    return await repo.create(body);
  }, {
    body: CreateTimeEntrySchema,
  })

  .put("/:id", async ({ params: { id }, body }) => {
    const entry = await repo.update(id, body);
    if (!entry) throw new NotFoundError("Time entry");
    return entry;
  }, {
    params: t.Object({ id: t.Numeric() }),
    body: UpdateTimeEntrySchema,
  })

  .delete("/:id", async ({ params: { id } }) => {
    const entry = await repo.remove(id);
    if (!entry) throw new NotFoundError("Time entry");
    return { message: "Time entry deleted", entry };
  }, {
    params: t.Object({ id: t.Numeric() }),
  });
