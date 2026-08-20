import * as v from "valibot";

export const idNumber = v.pipe(
  v.number("L'identifiant doit être un nombre."),
  v.integer("L'identifiant doit être un entier."),
  v.minValue(1, "L'identifiant doit être positif."),
);

export const description = v.nullish(
  v.pipe(
    v.string("La description doit être une chaîne de caractères."),
    v.trim(),
    v.maxLength(2000, "La description ne peut pas dépasser 2000 caractères."),
  ),
);
