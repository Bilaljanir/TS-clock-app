import sql from "../../db";

export type Label = {
  id: number;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export async function findAll(): Promise<Label[]> {
  return await sql`SELECT * FROM labels ORDER BY created_at DESC` as unknown as Label[];
}

export async function create(data: {
  name: string;
  color?: string | null;
}): Promise<Label> {
  const [label] = await sql`
    INSERT INTO labels (name, color)
    VALUES (${data.name}, ${data.color ?? null})
    RETURNING *
  ` as unknown as Label[];
  return label;
}

export async function update(
  id: number,
  data: { name?: string; color?: string }
): Promise<Label | null> {
  const [label] = await sql`
    UPDATE labels SET
      name = COALESCE(${data.name ?? null}, name),
      color = COALESCE(${data.color ?? null}, color)
    WHERE id = ${id}
    RETURNING *
  ` as unknown as Label[];
  return label ?? null;
}

export async function remove(id: number): Promise<Label | null> {
  const [label] = await sql`
    DELETE FROM labels WHERE id = ${id}
    RETURNING *
  ` as unknown as Label[];
  return label ?? null;
}