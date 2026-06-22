import { SQL } from "bun";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL n'est pas défini. Copiez .env.example en .env à la racine du projet.",
  );
}

export const sql = new SQL(process.env.DATABASE_URL);
