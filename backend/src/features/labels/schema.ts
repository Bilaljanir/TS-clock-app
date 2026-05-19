import * as v from "valibot";

export const CreateLabelSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Name is required"), v.maxLength(100)),
  color: v.optional(
    v.nullable(
      v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format"))
    )
  ),
});

export const UpdateLabelSchema = v.object({
  name: v.optional(
    v.pipe(v.string(), v.nonEmpty("Name cannot be empty"), v.maxLength(100))
  ),
  color: v.optional(
    v.nullable(
      v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format"))
    )
  ),
});