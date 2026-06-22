import * as v from "valibot";

const idNumber = v.pipe(
  v.number("L'identifiant doit être un nombre."),
  v.integer("L'identifiant doit être un entier."),
  v.minValue(1, "L'identifiant doit être positif."),
);

/**
 * Corps de PUT /clock — définit l'état souhaité de l'horloge :
 * - project_id = <id>   -> clock in / switch sur ce projet
 * - project_id = null   -> clock out
 */
export const SetClockSchema = v.object({
  project_id: v.nullable(idNumber),
  label_ids: v.optional(v.array(idNumber), []),
});

export type SetClockInput = v.InferOutput<typeof SetClockSchema>;
