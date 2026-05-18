import * as v from "valibot";

export const CreateTimeEntrySchema = v.object({
  project_id: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(1, "project_id is required"),
  ),
  description: v.optional(v.string()),
  start_time: v.pipe(
    v.string(),
    v.nonEmpty("start_time is required"),
    v.isoTimestamp("Invalid start_time format"),
  ),
  end_time: v.optional(
    v.pipe(v.string(), v.isoTimestamp("Invalid end_time format")),
  ),
  label_ids: v.optional(
    v.array(v.pipe(v.number(), v.integer(), v.minValue(1))),
  ),
});

export const UpdateTimeEntrySchema = v.object({
  project_id: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  description: v.optional(v.string()),
  start_time: v.optional(
    v.pipe(v.string(), v.isoTimestamp("Invalid start_time format")),
  ),
  end_time: v.optional(
    v.pipe(v.string(), v.isoTimestamp("Invalid end_time format")),
  ),
  label_ids: v.optional(
    v.array(v.pipe(v.number(), v.integer(), v.minValue(1))),
  ),
});