import { Elysia, t } from "elysia";
import * as repo from "./repository";
import { CreateTimeEntrySchema, UpdateTimeEntrySchema } from "./schema";

export const timeEntriesRoutes = new Elysia({ prefix: "/api/time-entries" })
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND") return;
    console.error(error);
  })

  .get("/", async () => {
    return await repo.findAll();
  })

  .get("/:id", async ({ params: { id }, set }) => {
    const entry = await repo.findById(id);

    if (!entry) {
      set.status = 404;
      return { message: "Time entry not found" };
    }

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

    if (!entry) {
      set.status = 404;
      return { message: "Time entry not found" };
    }

    return entry;
  }, {
    params: t.Object({ id: t.Numeric() }),
    body: UpdateTimeEntrySchema,
  })
  .delete("/:id", async ({ params: { id }, set }) => {
    const entry = await repo.remove(id);

    if (!entry) {
      set.status = 404;
      return { message: "Time entry not found" };
    }

    return { message: "Time entry deleted", entry };
  }, {
    params: t.Object({ id: t.Numeric() }),
  });
