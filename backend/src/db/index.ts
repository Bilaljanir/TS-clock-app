import { SQL } from "bun";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL n'est pas défini. Copiez .env.example en .env à la racine du projet.",
  );
}

/**
 * Client SQL partagé (Bun.SQL).
 * Utilisation : await sql`SELECT * FROM projects WHERE id = ${id}`
 * Les valeurs interpolées sont paramétrées automatiquement (anti-injection SQL).
 */
export const sql = new SQL(process.env.DATABASE_URL);
