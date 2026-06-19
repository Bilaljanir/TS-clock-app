import { Elysia, t } from "elysia";
import { NotFoundError } from "../../errors";
import * as repo from "./repository";
import { CreateTimeEntrySchema, UpdateTimeEntrySchema } from "./schema";

export const timeEntriesRoutes = new Elysia({ prefix: "/api/time-entries" })

  .get("/", async ({ query }) => {
    return await repo.findAll(query.page, query.pageSize);
  }, {
    query: t.Object({
      page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
      pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
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
