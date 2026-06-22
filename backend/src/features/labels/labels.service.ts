import { sql } from "../../db";
import { NotFoundError } from "../../lib/errors";
import type { CreateLabelInput, UpdateLabelInput } from "./labels.model";

export type Label = {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export async function listLabels(): Promise<Label[]> {
  return [...((await sql`SELECT * FROM labels ORDER BY name ASC`) as Label[])];
}

export async function getLabel(id: number): Promise<Label> {
  const [label] = (await sql`SELECT * FROM labels WHERE id = ${id}`) as Label[];
  if (!label) throw new NotFoundError(`Label ${id} introuvable.`);
  return label;
}

export async function createLabel(input: CreateLabelInput): Promise<Label> {
  const [label] = (await sql`
    INSERT INTO labels (name, color)
    VALUES (${input.name}, ${input.color})
    RETURNING *
  `) as Label[];

  return label;
}

export async function updateLabel(
  id: number,
  input: UpdateLabelInput,
): Promise<Label> {
  const current = await getLabel(id);

  const name = input.name ?? current.name;
  const color = input.color ?? current.color;

  const [label] = (await sql`
    UPDATE labels
    SET name = ${name}, color = ${color}
    WHERE id = ${id}
    RETURNING *
  `) as Label[];

  return label;
}

/**
 * Supprime un label.
 * Les associations dans time_entry_labels sont retirées automatiquement
 * (ON DELETE CASCADE) ; les entrées de temps concernées sont conservées,
 * elles perdent simplement ce label.
 */
export async function deleteLabel(id: number): Promise<void> {
  await getLabel(id); // lève 404 si absent
  await sql`DELETE FROM labels WHERE id = ${id}`;
}
