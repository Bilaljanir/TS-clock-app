import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ClockForm } from "../components/ClockForm";
import { StatusBanner } from "../components/StatusBanner";
import { ErrorMessage } from "../components/ErrorMessage";
import { api } from "../lib/api";

export const Route = createFileRoute("/clock")({
	loader: async () => {
		const [clock, projects, labels] = await Promise.all([
			api.clock.get(),
			api.projects.list(),
			api.labels.list(),
		]);
		return { active: clock.active, projects, labels };
	},
	component: ClockPage,
	pendingComponent: () => <p className="p-8 text-gray-500">Chargement…</p>,
	errorComponent: ({ error }) => (
		<div className="p-8">
			<ErrorMessage error={error} />
		</div>
	),
});

function ClockPage() {
	const { active, projects, labels } = Route.useLoaderData();
	const router = useRouter();

	return (
		<div className="p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Horloge</h1>
				<Link
					to="/entries"
					search={{ page: 1, pageSize: 20 }}
					className="text-sm text-blue-600 underline"
				>
					Voir les entrées →
				</Link>
			</div>

			<StatusBanner active={active} />

			<ClockForm
				key={active?.id ?? "idle"}
				active={active}
				projects={projects}
				labels={labels}
				onSet={async (input) => {
					await api.clock.set(input);
					await router.invalidate({ filter: (route) => route.routeId === Route.id });
				}}
			/>
		</div>
	);
}
