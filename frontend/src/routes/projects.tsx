import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { ProjectForm } from "../components/ProjectForm";
import { api, type Project } from "../lib/api";

export const Route = createFileRoute("/projects")({
	loader: () => api.projects.list(),
	component: ProjectsPage,
	pendingComponent: () => (
		<p className="p-8 text-gray-500">Chargement des projets…</p>
	),
	errorComponent: ({ error }) => (
		<div className="p-8">
			<ErrorMessage error={error} />
		</div>
	),
});

function ProjectsPage() {
	const projects = Route.useLoaderData();
	const router = useRouter();

	const [creating, setCreating] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [pageError, setPageError] = useState<unknown>(null);

	async function handleDelete(project: Project) {
		if (!confirm(`Supprimer le projet « ${project.name} » ?`)) return;
		setPageError(null);
		try {
			await api.projects.delete(project.id);
			await router.invalidate();
		} catch (error) {
			setPageError(error);
		}
	}

	return (
		<div className="p-8">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Projets</h1>
				{!creating && (
					<button
						type="button"
						onClick={() => {
							setEditingId(null);
							setCreating(true);
						}}
						className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
					>
						+ Nouveau projet
					</button>
				)}
			</div>

			<ErrorMessage error={pageError} />

			{creating && (
				<div className="mb-6 rounded-lg border border-gray-200 p-4">
					<h2 className="mb-3 font-semibold">Nouveau projet</h2>
					<ProjectForm
						initialValues={{ name: "", description: "" }}
						submitLabel="Créer le projet"
						onCancel={() => setCreating(false)}
						onSubmit={async (input) => {
							await api.projects.create(input);
							await router.invalidate();
							setCreating(false);
						}}
					/>
				</div>
			)}
			{projects.length === 0 ? (
				<p className="text-gray-500">Aucun projet pour le moment.</p>
			) : (
				<ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
					{projects.map((project) => (
						<li key={project.id} className="p-4">
							{editingId === project.id ? (
								<ProjectForm
									initialValues={{
										name: project.name,
										description: project.description ?? "",
									}}
									submitLabel="Enregistrer"
									onCancel={() => setEditingId(null)}
									onSubmit={async (input) => {
										await api.projects.update(project.id, input);
										await router.invalidate();
										setEditingId(null);
									}}
								/>
							) : (
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="font-medium">{project.name}</p>
										{project.description && (
											<p className="mt-0.5 text-sm text-gray-500">
												{project.description}
											</p>
										)}
									</div>
									<div className="flex shrink-0 gap-3 text-sm">
										<button
											type="button"
											onClick={() => {
												setCreating(false);
												setEditingId(project.id);
											}}
											className="text-blue-600 hover:underline"
										>
											Modifier
										</button>
										<button
											type="button"
											onClick={() => handleDelete(project)}
											className="text-red-600 hover:underline"
										>
											Supprimer
										</button>
									</div>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
