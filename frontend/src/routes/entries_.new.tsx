import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { EntryForm, type EntryFormValues } from "../components/EntryForm";
import { ErrorMessage } from "../components/ErrorMessage";
import { api } from "../lib/api";
import { toDatetimeLocal } from "../lib/format";

export const Route = createFileRoute("/entries_/new")({
	loader: async () => {
		const [projects, labels] = await Promise.all([
			api.projects.list(),
			api.labels.list(),
		]);
		return { projects, labels };
	},
	component: NewEntryPage,
	pendingComponent: () => <p className="p-8 text-gray-500">Chargement…</p>,
	errorComponent: ({ error }) => (
		<div className="p-8">
			<ErrorMessage error={error} />
		</div>
	),
});
function NewEntryPage() {
	const { projects, labels } = Route.useLoaderData();
	const navigate = useNavigate();
	const router = useRouter();

	const initialValues: EntryFormValues = {
		project_id: "",
		description: "",
		start_time: toDatetimeLocal(new Date().toISOString()),
		end_time: "",
		label_ids: [],
	};

	return (
		<div className="p-8">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Nouvelle entrée</h1>
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
				submitLabel="Créer l'entrée"
				onSubmit={async (input) => {
					await api.entries.create(input);
					await router.invalidate();
					navigate({ to: "/entries", search: { page: 1, pageSize: 20 } });
				}}
			/>
		</div>
	);
}