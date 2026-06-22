import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold">Suivi du temps</h1>
			<p className="mt-4 text-gray-600">
				Consultez et gérez vos entrées de temps.
			</p>
			<Link
				to="/entries"
				search={{ page: 1, pageSize: 20 }}
				className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				Voir les entrées
			</Link>
		</div>
	);
}
