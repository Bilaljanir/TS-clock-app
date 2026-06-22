import * as v from "valibot";

const name = v.pipe(
  v.string("Le nom doit être une chaîne de caractères."),
  v.trim(),
  v.minLength(1, "Le nom est requis."),
  v.maxLength(100, "Le nom ne peut pas dépasser 100 caractères."),
);

const color = v.pipe(
  v.string("La couleur doit être une chaîne de caractères."),
  v.regex(/^#[0-9a-fA-F]{6}$/, "La couleur doit être au format hexadécimal #RRGGBB."),
);

/** Corps de POST /labels — couleur optionnelle (#000000 par défaut). */
export const CreateLabelSchema = v.object({
  name,
  color: v.optional(color, "#000000"),
});

/** Corps de PATCH /labels/:id — tous les champs optionnels, au moins un requis. */
export const UpdateLabelSchema = v.pipe(
  v.object({
    name: v.optional(name),
    color: v.optional(color),
  }),
  v.check(
    (input) => Object.keys(input).length > 0,
    "Au moins un champ doit être fourni.",
  ),
);

export type CreateLabelInput = v.InferOutput<typeof CreateLabelSchema>;
export type UpdateLabelInput = v.InferOutput<typeof UpdateLabelSchema>;
