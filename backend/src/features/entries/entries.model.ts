import * as v from "valibot";

const idNumber = v.pipe(
  v.number("L'identifiant doit être un nombre."),
  v.integer("L'identifiant doit être un entier."),
  v.minValue(1, "L'identifiant doit être positif."),
);

const timestamp = v.pipe(
  v.string("La date/heure doit être une chaîne ISO 8601."),
  v.transform((value) => new Date(value)),
  v.check(
    (date) => !Number.isNaN(date.getTime()),
    "Date/heure invalide (format ISO 8601 attendu).",
  ),
);

const description = v.nullish(
  v.pipe(
    v.string("La description doit être une chaîne de caractères."),
    v.trim(),
    v.maxLength(2000, "La description ne peut pas dépasser 2000 caractères."),
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
