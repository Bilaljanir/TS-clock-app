import { createFileRoute, Link } from "@tanstack/react-router";
import { api, type Entry } from "../lib/api";
import { formatDateTime, formatDuration } from "../lib/format";

type EntriesSearch = {
	page: number;
	pageSize: number;
};

export const Route = createFileRoute("/entries")({
	validateSearch: (search: Record<string, unknown>): EntriesSearch => ({
		page: Math.max(1, Number(search.page) || 1),
		pageSize: Math.min(100, Math.max(1, Number(search.pageSize) || 20)),
	}),
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => api.entries.list(deps.page, deps.pageSize),
	component: EntriesPage,
	pendingComponent: () => (
		<p className="p-8 text-gray-500">Chargement des entrées…</p>
	),
	errorComponent: ({ error }) => (
		<div className="p-8">
			<p className="text-red-600">
				Impossible de charger les entrées : {error.message}
			</p>
			<Link
				to="/entries"
				search={{ page: 1, pageSize: 20 }}
				className="mt-2 inline-block text-blue-600 underline"
			>
				Réessayer
			</Link>
		</div>
	),
});

function EntriesPage() {
	const { data, pagination } = Route.useLoaderData();
	const { pageSize } = Route.useSearch();

	return (
		<div className="p-8">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Entrées de temps</h1>
				<Link
					to="/entries/new"
					className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
				>
					+ Nouvelle entrée
				</Link>
			</div>

			{data.length === 0 ? (
				<p className="text-gray-500">Aucune entrée pour le moment.</p>
			) : (
				<div className="overflow-x-auto rounded-lg border border-gray-200">
					<table className="w-full text-left text-sm">
						<thead className="bg-gray-50 text-gray-600">
							<tr>
								<th className="px-4 py-3 font-medium">Début</th>
								<th className="px-4 py-3 font-medium">Projet</th>
								<th className="px-4 py-3 font-medium">Description</th>
								<th className="px-4 py-3 font-medium">Labels</th>
								<th className="px-4 py-3 font-medium">Durée</th>
								<th className="px-4 py-3 font-medium" />
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{data.map((entry) => (
								<EntryRow key={entry.id} entry={entry} />
							))}
						</tbody>
					</table>
				</div>
			)}

			<Pagination
				page={pagination.page}
				pageSize={pageSize}
				totalPages={pagination.totalPages}
				total={pagination.total}
			/>
		</div>
	);
}

function EntryRow({ entry }: { entry: Entry }) {
	return (
		<tr className="hover:bg-gray-50">
			<td className="whitespace-nowrap px-4 py-3">
				{formatDateTime(entry.start_time)}
			</td>
			<td className="px-4 py-3">{entry.project.name}</td>
			<td className="px-4 py-3 text-gray-600">{entry.description ?? "—"}</td>
			<td className="px-4 py-3">
				<div className="flex flex-wrap gap-1">
					{entry.labels.map((label) => (
						<span
							key={label.id}
							className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs"
						>
							<span
								className="h-2 w-2 rounded-full"
								style={{ backgroundColor: label.color }}
							/>
							{label.name}
						</span>
					))}
				</div>
			</td>
			<td className="whitespace-nowrap px-4 py-3">
				{formatDuration(entry.start_time, entry.end_time)}
			</td>
			<td className="whitespace-nowrap px-4 py-3 text-right">
				<Link
					to="/entries/$entryId/edit"
					params={{ entryId: String(entry.id) }}
					className="text-blue-600 hover:underline"
				>
					Modifier
				</Link>
			</td>
		</tr>
	);
}

function Pagination({
	page,
	pageSize,
	totalPages,
	total,
}: {
	page: number;
	pageSize: number;
	totalPages: number;
	total: number;
}) {
	const linkClass =
		"rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 aria-disabled:pointer-events-none aria-disabled:opacity-40";

	return (
		<div className="mt-4 flex items-center justify-between">
			<p className="text-sm text-gray-500">
				{total} entrée{total > 1 ? "s" : ""} · page {page} / {totalPages}
			</p>
			<div className="flex gap-2">
				<Link
					to="/entries"
					search={{ page: page - 1, pageSize }}
					disabled={page <= 1}
					className={linkClass}
				>
					← Précédent
				</Link>
				<Link
					to="/entries"
					search={{ page: page + 1, pageSize }}
					disabled={page >= totalPages}
					className={linkClass}
				>
					Suivant →
				</Link>
			</div>
		</div>
	);
}
