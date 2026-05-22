import { Elysia, t } from "elysia";
import { NotFoundError } from "../../errors";
import * as repo from "./repository";
import { CreateTimeEntrySchema, UpdateTimeEntrySchema } from "./schema";

export const timeEntriesRoutes = new Elysia({ prefix: "/api/time-entries" })

  .get("/", async ({ query: { page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" }, set }) => {
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      set.status = 400;
      return { message: "page must be >= 1 and pageSize must be between 1 and 100" };
    }

    const allowedSortBy = ["created_at", "start_time", "end_time", "description", "id"];
    if (!allowedSortBy.includes(sortBy)) {
      set.status = 400;
      return { message: `sortBy must be one of: ${allowedSortBy.join(", ")}` };
    }

    const sortOrderNorm = sortOrder.toLowerCase();
    if (sortOrderNorm !== "asc" && sortOrderNorm !== "desc") {
      set.status = 400;
      return { message: 'sortOrder must be "asc" or "desc"' };
    }

    return await repo.findAll(page, pageSize, sortBy, sortOrderNorm);
  }, {
    query: t.Object({
      page: t.Optional(t.Numeric()),
      pageSize: t.Optional(t.Numeric()),
      sortBy: t.Optional(t.String()),
      sortOrder: t.Optional(t.String()),
    }),
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
