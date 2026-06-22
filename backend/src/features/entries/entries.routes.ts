import { Elysia } from "elysia";
import { PaginationQuerySchema } from "../../lib/pagination";
import { IdParamSchema } from "../../lib/params";
import { validate } from "../../lib/validate";
import { CreateEntrySchema, UpdateEntrySchema } from "./entries.model";
import * as entries from "./entries.service";

export const entriesRoutes = new Elysia({ prefix: "/entries" })
  .get("/", ({ query }) => {
    const params = validate(PaginationQuerySchema, query);
    return entries.listEntries(params);
  })

  .get("/:id", ({ params }) => {
    const { id } = validate(IdParamSchema, params);
    return entries.getEntry(id);
  })

  .post("/", ({ body, set }) => {
    const input = validate(CreateEntrySchema, body);
    set.status = 201;
    return entries.createEntry(input);
  })

  .patch("/:id", ({ params, body }) => {
    const { id } = validate(IdParamSchema, params);
    const input = validate(UpdateEntrySchema, body);
    return entries.updateEntry(id, input);
  })

  .delete("/:id", async ({ params, set }) => {
    const { id } = validate(IdParamSchema, params);
    await entries.deleteEntry(id);
    set.status = 204;
  });
