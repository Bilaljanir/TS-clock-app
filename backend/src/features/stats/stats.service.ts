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
        SUM(EXTRACT(EPOCH FROM (te.end_time - te.start_time)))::bigint AS total_seconds
      FROM time_entries te
      JOIN projects p ON p.id = te.project_id
      WHERE te.end_time IS NOT NULL
        AND (${from}::date IS NULL OR (te.start_time AT TIME ZONE 'UTC')::date >= ${from}::date)
        AND (${to}::date IS NULL OR (te.start_time AT TIME ZONE 'UTC')::date <= ${to}::date)
      GROUP BY p.id, p.name
      ORDER BY total_seconds DESC, p.name ASC
    ` as Promise<(RawStatRow & { project_id: number; name: string })[]>,
    sql`
      SELECT
        l.id AS label_id,
        l.name,
        l.color,
        SUM(EXTRACT(EPOCH FROM (te.end_time - te.start_time)))::bigint AS total_seconds
      FROM time_entries te
      JOIN time_entry_labels tel ON tel.time_entry_id = te.id
      JOIN labels l ON l.id = tel.label_id
      WHERE te.end_time IS NOT NULL
        AND (${from}::date IS NULL OR (te.start_time AT TIME ZONE 'UTC')::date >= ${from}::date)
        AND (${to}::date IS NULL OR (te.start_time AT TIME ZONE 'UTC')::date <= ${to}::date)
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
