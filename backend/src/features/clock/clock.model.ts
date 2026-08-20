import * as v from "valibot";
import { idNumber } from "../../lib/schemas";

export const SetClockSchema = v.object({
  project_id: v.nullable(idNumber),
  label_ids: v.optional(v.array(idNumber), []),
});

export type SetClockInput = v.InferOutput<typeof SetClockSchema>;
