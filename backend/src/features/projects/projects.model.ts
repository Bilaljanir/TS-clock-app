import * as v from "valibot";

/** Champs réutilisables. */
const name = v.pipe(
  v.string("Le nom doit être une chaîne de caractères."),
  v.trim(),
  v.minLength(1, "Le nom est requis."),
  v.maxLength(255, "Le nom ne peut pas dépasser 255 caractères."),
);

const description = v.nullish(
  v.pipe(
    v.string("La description doit être une chaîne de caractères."),
    v.trim(),
    v.maxLength(2000, "La description ne peut pas dépasser 2000 caractères."),
  ),
);

/** Corps de POST /projects. */
export const CreateProjectSchema = v.object({ name, description });

/** Corps de PATCH /projects/:id — tous les champs optionnels, au moins un requis. */
export const UpdateProjectSchema = v.pipe(
  v.object({
    name: v.optional(name),
    description,
  }),
  v.check(
    (input) => Object.keys(input).length > 0,
    "Au moins un champ doit être fourni.",
  ),
);

export type CreateProjectInput = v.InferOutput<typeof CreateProjectSchema>;
export type UpdateProjectInput = v.InferOutput<typeof UpdateProjectSchema>;
