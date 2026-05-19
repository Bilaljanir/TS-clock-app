import { Elysia, t } from "elysia";
import { NotFoundError } from "../../errors";
import * as repo from "./repository";
import { CreateLabelSchema, UpdateLabelSchema } from "./schema";

export const labelsRoutes = new Elysia({ prefix: "/api/labels" })

  .get("/", async () => {
    return await repo.findAll();
  })

  .post("/", async ({ body }) => {
    return await repo.create(body);
  }, {
    body: CreateLabelSchema,
  })

  .put("/:id", async ({ params: { id }, body, set }) => {
    if (body.name === undefined && body.color === undefined) {
      set.status = 400;
      return { message: "No fields to update" };
    }

    const label = await repo.update(id, body);

    if (!label) throw new NotFoundError("Label");

    return label;
  }, {
    params: t.Object({ id: t.Numeric() }),
    body: UpdateLabelSchema,
  })

  .delete("/:id", async ({ params: { id }, set }) => {
    const label = await repo.remove(id);

    if (!label) throw new NotFoundError("Label");

    return { message: "Label deleted", label };
  }, {
    params: t.Object({ id: t.Numeric() }),
  });
