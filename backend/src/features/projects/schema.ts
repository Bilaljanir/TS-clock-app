import * as v from "valibot";

export const CreateProjectSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Name is required"), v.maxLength(255)),
  description: v.optional(v.string()),
});

export const UpdateProjectSchema = v.object({
  name: v.optional(
    v.pipe(v.string(), v.nonEmpty("Name cannot be empty"), v.maxLength(255))
  ),
  description: v.optional(v.string()),
});
