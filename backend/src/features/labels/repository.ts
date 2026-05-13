import sql from "../../db";

export type Label = {
  id: number;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export async function findAll(): Promise<Label[]> {
  return await sql<Label[]>`SELECT * FROM labels ORDER BY created_at DESC`;
}

export async function create(data: {
  name: string;
  color?: string | null;
}): Promise<Label> {
  const [label] = await sql<Label[]>`
    INSERT INTO labels (name, color)
    VALUES (${data.name}, ${data.color ?? null})
    RETURNING *
  `;
  return label;
}

export async function update(
  id: number,
  data: { name?: string; color?: string }
): Promise<Label | null> {
  const [label] = await sql<Label[]>`
    UPDATE labels SET
      name = COALESCE(${data.name ?? null}, name),
      color = COALESCE(${data.color ?? null}, color)
    WHERE id = ${id}
    RETURNING *
  `;
  return label ?? null;
}

export async function remove(id: number): Promise<Label | null> {
  const [label] = await sql<Label[]>`
    DELETE FROM labels WHERE id = ${id}
    RETURNING *
  `;
  return label ?? null;
}