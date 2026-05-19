import { Elysia, t } from "elysia";
import { NotFoundError } from "../../errors";
import * as repo from "./repository";
import { CreateTimeEntrySchema, UpdateTimeEntrySchema } from "./schema";

export const timeEntriesRoutes = new Elysia({ prefix: "/api/time-entries" })

  .get("/", async () => {
    return await repo.findAll();
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

  .put("/:id", async ({ params: { id }, body, set }) => {
    if (
      body.project_id === undefined &&
      body.description === undefined &&
      body.start_time === undefined &&
      body.end_time === undefined &&
      body.label_ids === undefined
    ) {
      set.status = 400;
      return { message: "No fields to update" };
    }

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
