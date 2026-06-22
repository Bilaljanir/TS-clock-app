import * as v from "valibot";

/** Paramètre :id d'URL partagé par toutes les features (chaîne -> entier positif). */
export const IdParamSchema = v.object({
  id: v.pipe(
    v.string(),
    v.regex(/^\d+$/, "L'identifiant doit être un entier positif."),
    v.transform(Number),
  ),
});
