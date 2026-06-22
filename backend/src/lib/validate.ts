import * as v from "valibot";
import { ValidationError } from "./errors";

/**
 * Valide `input` contre un schéma Valibot.
 * Retourne la valeur typée si OK, sinon lève une ValidationError (422)
 * avec la liste des problèmes au format { path, message }.
 */
export function validate<
  TSchema extends v.GenericSchema<unknown, unknown>,
>(schema: TSchema, input: unknown): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, input, { abortPipeEarly: false });

  if (!result.success) {
    const issues = result.issues.map((issue) => ({
      path: v.getDotPath(issue) ?? "",
      message: issue.message,
    }));
    throw new ValidationError(issues);
  }

  return result.output;
}
