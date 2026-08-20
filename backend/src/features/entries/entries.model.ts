import * as v from "valibot";
import { description, idNumber } from "../../lib/schemas";

const timestamp = v.pipe(
  v.string("La date/heure doit être une chaîne ISO 8601."),
  v.transform((value) => new Date(value)),
  v.check(
    (date) => !Number.isNaN(date.getTime()),
    "Date/heure invalide (format ISO 8601 attendu).",
  ),
);

const labelIds = v.optional(v.array(idNumber), []);

export const CreateEntrySchema = v.pipe(
  v.object({
    project_id: idNumber,
    description,
    start_time: timestamp,
    end_time: v.nullish(timestamp),
    label_ids: labelIds,
  }),
  v.forward(
    v.check(
      (input) => input.end_time == null || input.end_time > input.start_time,
      "La fin doit être postérieure au début.",
    ),
    ["end_time"],
  ),
);

export const UpdateEntrySchema = v.pipe(
  v.object({
    project_id: v.optional(idNumber),
    description,
    start_time: v.optional(timestamp),
    end_time: v.nullish(timestamp),
    label_ids: v.optional(v.array(idNumber)),
  }),
  v.check(
    (input) => Object.keys(input).length > 0,
    "Au moins un champ doit être fourni.",
  ),
);

export type CreateEntryInput = v.InferOutput<typeof CreateEntrySchema>;
export type UpdateEntryInput = v.InferOutput<typeof UpdateEntrySchema>;
