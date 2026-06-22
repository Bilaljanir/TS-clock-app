import { Elysia } from "elysia";
import { IdParamSchema } from "../../lib/params";
import { validate } from "../../lib/validate";
import { CreateLabelSchema, UpdateLabelSchema } from "./labels.model";
import * as labels from "./labels.service";

export const labelsRoutes = new Elysia({ prefix: "/labels" })
  .get("/", () => labels.listLabels())

  .get("/:id", ({ params }) => {
    const { id } = validate(IdParamSchema, params);
    return labels.getLabel(id);
  })

  .post("/", ({ body, set }) => {
    const input = validate(CreateLabelSchema, body);
    set.status = 201;
    return labels.createLabel(input);
  })

  .patch("/:id", ({ params, body }) => {
    const { id } = validate(IdParamSchema, params);
    const input = validate(UpdateLabelSchema, body);
    return labels.updateLabel(id, input);
  })

  .delete("/:id", async ({ params, set }) => {
    const { id } = validate(IdParamSchema, params);
    await labels.deleteLabel(id);
    set.status = 204;
  });
