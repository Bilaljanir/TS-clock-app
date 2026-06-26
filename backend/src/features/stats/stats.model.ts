import * as v from "valibot";

const dateString = v.pipe(
  v.string("La date doit être une chaîne."),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format AAAA-MM-JJ."),
);


export const StatsQuerySchema = v.pipe(
  v.object({
    from: v.optional(dateString),
    to: v.optional(dateString),
  }),
  v.forward(
    v.check(
      (input) => !input.from || !input.to || input.from <= input.to,
      "La date de début doit être antérieure ou égale à la date de fin.",
    ),
    ["to"],
  ),
);

export type StatsQuery = v.InferOutput<typeof StatsQuerySchema>;
