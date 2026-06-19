import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fetchTimeEntries } from "#/lib/api";

type Search = {
	page: number;
	pageSize: number;
};

export const Route = createFileRoute("/time-entries")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		page: Number(search.page ?? 1),
		pageSize: Number(search.pageSize ?? 20),
	}),
	loaderDeps: ({ search }) => ({
		page: search.page,
		pageSize: search.pageSize,
	}),
	loader: ({ deps }) => fetchTimeEntries(deps.page, deps.pageSize),
	pendingComponent: () => <div className="p-8">Loading entries…</div>,
	errorComponent: ({ error }) => (
		<div className="p-8 text-red-600">
			Failed to load entries: {error.message}
		</div>
	),
	component: TimeEntriesPage,
});

function TimeEntriesPage() {
	const { data, page, pageSize, total, totalPages } = Route.useLoaderData();
	const navigate = useNavigate({ from: Route.fullPath });

	function goToPage(nextPage: number) {
		navigate({ search: (prev) => ({ ...prev, page: nextPage, pageSize }) });
	}

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold">Time Entries</h1>

			{data.length === 0 ? (
				<p className="mt-4 text-gray-500">No time entries yet.</p>
			) : (
				<table className="mt-4 w-full border-collapse text-left">
					<thead>
						<tr className="border-b">
							<th className="p-2">Description</th>
							<th className="p-2">Project</th>
							<th className="p-2">Labels</th>
							<th className="p-2">Start</th>
							<th className="p-2">End</th>
						</tr>
					</thead>
					<tbody>
						{data.map((entry) => (
							<tr key={entry.id} className="border-b">
								<td className="p-2">{entry.description ?? "—"}</td>
								<td className="p-2">{entry.project?.name ?? "—"}</td>
								<td className="p-2">
									{entry.labels?.map((label) => label.name).join(", ") || "—"}
								</td>
								<td className="p-2">
									{new Date(entry.start_time).toLocaleString()}
								</td>
								<td className="p-2">
									{entry.end_time
										? new Date(entry.end_time).toLocaleString()
										: "Running"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			<div className="mt-4 flex items-center gap-4">
				<button
					type="button"
					className="rounded border px-3 py-1 disabled:opacity-50"
					disabled={page <= 1}
					onClick={() => goToPage(page - 1)}
				>
					Previous
				</button>
				<span>
					Page {page} of {Math.max(totalPages, 1)} ({total} entries)
				</span>
				<button
					type="button"
					className="rounded border px-3 py-1 disabled:opacity-50"
					disabled={page >= totalPages}
					onClick={() => goToPage(page + 1)}
				>
					Next
				</button>
			</div>
		</div>
	);
}
