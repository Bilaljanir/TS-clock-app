import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ErrorMessage } from "../components/ErrorMessage";
import { api, type LabelStat, type ProjectStat, type StatsFilter } from "../lib/api";
import { formatSeconds } from "../lib/format";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Ne conserve que les dates au format AAAA-MM-JJ, sinon ignore le paramètre. */
function parseDate(value: unknown): string | undefined {
	return typeof value === "string" && DATE_RE.test(value) ? value : undefined;
}

export const Route = createFileRoute("/stats")({
	validateSearch: (search: Record<string, unknown>): StatsFilter => ({
		from: parseDate(search.from),
		to: parseDate(search.to),
	}),
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => api.stats.get(deps),
	component: StatsPage,
	pendingComponent: () => (
		<p className="p-8 text-gray-500">Chargement des statistiques…</p>
	),
	errorComponent: ({ error }) => (
		<div className="p-8">
			<ErrorMessage error={error} />
		</div>
	),
});

function StatsPage() {
	const stats = Route.useLoaderData();
	const { from, to } = Route.useSearch();

	return (
		<div className="p-8">
			<h1 className="mb-1 text-2xl font-bold">Statistiques</h1>
			<p className="mb-6 text-sm text-gray-500">
				Temps total travaillé :{" "}
				<span className="font-semibold text-gray-800">
					{formatSeconds(stats.total_seconds)}
				</span>{" "}
			</p>

			<Filters from={from} to={to} />

			<div className="mt-8 grid gap-8 md:grid-cols-2">
				<StatSection
					title="Par projet"
					rows={stats.by_project.map((r: ProjectStat) => ({
						key: r.project_id,
						name: r.name,
						seconds: r.total_seconds,
					}))}
					empty="Aucune donnée sur cette période."
				/>
				<StatSection
					title="Par label"
					note="Une entrée multi-labels compte sous chaque label."
					rows={stats.by_label.map((r: LabelStat) => ({
						key: r.label_id,
						name: r.name,
						seconds: r.total_seconds,
						color: r.color,
					}))}
					empty="Aucune donnée sur cette période."
				/>
			</div>
		</div>
	);
}

function Filters({ from, to }: StatsFilter) {
	const navigate = useNavigate();

	return (
		<form
			key={`${from ?? ""}-${to ?? ""}`}
			onSubmit={(e) => {
				e.preventDefault();
				const data = new FormData(e.currentTarget);
				navigate({
					to: "/stats",
					search: {
						from: String(data.get("from") || "") || undefined,
						to: String(data.get("to") || "") || undefined,
					},
				});
			}}
			className="flex flex-wrap items-end gap-3"
		>
			<label className="text-sm">
				<span className="mb-1 block font-medium text-gray-700">Du</span>
				<input
					type="date"
					name="from"
					defaultValue={from ?? ""}
					className="rounded border border-gray-300 px-3 py-2"
				/>
			</label>
			<label className="text-sm">
				<span className="mb-1 block font-medium text-gray-700">Au</span>
				<input
					type="date"
					name="to"
					defaultValue={to ?? ""}
					className="rounded border border-gray-300 px-3 py-2"
				/>
			</label>
			<button
				type="submit"
				className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
			>
				Filtrer
			</button>
			{(from || to) && (
				<Link
					to="/stats"
					search={{}}
					className="px-2 py-2 text-sm text-blue-600 underline"
				>
					Réinitialiser
				</Link>
			)}
		</form>
	);
}

type StatRow = { key: number; name: string; seconds: number; color?: string };

function StatSection({
	title,
	note,
	rows,
	empty,
}: {
	title: string;
	note?: string;
	rows: StatRow[];
	empty: string;
}) {
	const max = Math.max(1, ...rows.map((r) => r.seconds));

	return (
		<section>
			<h2 className="text-lg font-semibold">{title}</h2>
			{note && <p className="mb-3 text-xs text-gray-400">{note}</p>}

			{rows.length === 0 ? (
				<p className="mt-3 text-sm text-gray-500">{empty}</p>
			) : (
				<ul className="mt-3 space-y-3">
					{rows.map((row) => (
						<li key={row.key}>
							<div className="mb-1 flex items-center justify-between text-sm">
								<span className="flex items-center gap-2">
									{row.color && (
										<span
											className="h-2.5 w-2.5 rounded-full"
											style={{ backgroundColor: row.color }}
										/>
									)}
									{row.name}
								</span>
								<span className="font-medium tabular-nums text-gray-700">
									{formatSeconds(row.seconds)}
								</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-gray-100">
								<div
									className="h-full rounded-full"
									style={{
										width: `${(row.seconds / max) * 100}%`,
										backgroundColor: row.color ?? "#3b82f6",
									}}
								/>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
