import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { EntryForm, type EntryFormValues } from "../components/EntryForm";
import { api } from "../lib/api";
import { toDatetimeLocal } from "../lib/format";

export const Route = createFileRoute("/entries_/$entryId/edit")({
	loader: async ({ params }) => {
		const id = Number(params.entryId);
		const [entry, projects, labels] = await Promise.all([
			api.entries.get(id),
			api.projects.list(),
			api.labels.list(),
		]);
		return { entry, projects, labels };
	},
	component: EditEntryPage,
	pendingComponent: () => <p className="p-8 text-gray-500">Chargement…</p>,
	errorComponent: ({ error }) => (
		<p className="p-8 text-red-600">Erreur : {error.message}</p>
	),
});

function EditEntryPage() {
	const { entry, projects, labels } = Route.useLoaderData();
	const navigate = useNavigate();
	const router = useRouter();

	const initialValues: EntryFormValues = {
		project_id: entry.project.id,
		description: entry.description ?? "",
		start_time: toDatetimeLocal(entry.start_time),
		end_time: entry.end_time ? toDatetimeLocal(entry.end_time) : "",
		label_ids: entry.labels.map((l) => l.id),
	};

	return (
		<div className="p-8">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Modifier l'entrée #{entry.id}</h1>
				<Link
					to="/entries"
					search={{ page: 1, pageSize: 20 }}
					className="text-sm text-blue-600 underline"
				>
					← Retour à la liste
				</Link>
			</div>

			<EntryForm
				projects={projects}
				labels={labels}
				initialValues={initialValues}
				submitLabel="Enregistrer"
				onSubmit={async (input) => {
					await api.entries.update(entry.id, input);
					await router.invalidate();
					navigate({ to: "/entries", search: { page: 1, pageSize: 20 } });
				}}
			/>
		</div>
	);
}
