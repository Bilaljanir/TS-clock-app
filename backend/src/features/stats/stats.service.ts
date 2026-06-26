import { sql } from "../../db";
import type { StatsQuery } from "./stats.model";

export type ProjectStat = {
  project_id: number;
  name: string;
  total_seconds: number;
};

export type LabelStat = {
  label_id: number;
  name: string;
  color: string;
  total_seconds: number;
};

export type Stats = {
  range: { from: string | null; to: string | null };
  total_seconds: number;
  by_project: ProjectStat[];
  by_label: LabelStat[];
};

type RawStatRow = { total_seconds: string | number } & Record<string, unknown>;

export async function getStats(query: StatsQuery): Promise<Stats> {
  const from = query.from ?? null;
  const to = query.to ?? null;

  const [byProject, byLabel] = await Promise.all([
    sql`
      SELECT
        p.id AS project_id,
        p.name,
        SUM(s.total_seconds)::bigint AS total_seconds
      FROM stats_project_daily s
      JOIN projects p ON p.id = s.project_id
      WHERE (${from}::date IS NULL OR s.day >= ${from}::date)
        AND (${to}::date IS NULL OR s.day <= ${to}::date)
      GROUP BY p.id, p.name
      ORDER BY total_seconds DESC, p.name ASC
    ` as Promise<(RawStatRow & { project_id: number; name: string })[]>,
    sql`
      SELECT
        l.id AS label_id,
        l.name,
        l.color,
        SUM(s.total_seconds)::bigint AS total_seconds
      FROM stats_label_daily s
      JOIN labels l ON l.id = s.label_id
      WHERE (${from}::date IS NULL OR s.day >= ${from}::date)
        AND (${to}::date IS NULL OR s.day <= ${to}::date)
      GROUP BY l.id, l.name, l.color
      ORDER BY total_seconds DESC, l.name ASC
    ` as Promise<(RawStatRow & { label_id: number; name: string; color: string })[]>,
  ]);

  const by_project: ProjectStat[] = byProject.map((r) => ({
    project_id: r.project_id,
    name: r.name,
    total_seconds: Number(r.total_seconds),
  }));

  const by_label: LabelStat[] = byLabel.map((r) => ({
    label_id: r.label_id,
    name: r.name,
    color: r.color,
    total_seconds: Number(r.total_seconds),
  }));

  const total_seconds = by_project.reduce((sum, r) => sum + r.total_seconds, 0);

  return { range: { from, to }, total_seconds, by_project, by_label };
}
export async function refreshStats(): Promise<void> {
  await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY stats_project_daily`;
  await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY stats_label_daily`;
}
