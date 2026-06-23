import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { LabelForm } from "../components/LabelForm";
import { api, type Label } from "../lib/api";

export const Route = createFileRoute("/labels")({
	loader: () => api.labels.list(),
	component: LabelsPage,
	pendingComponent: () => (
		<p className="p-8 text-gray-500">Chargement des labels…</p>
	),
	errorComponent: ({ error }) => (
		<div className="p-8">
			<ErrorMessage error={error} />
		</div>
	),
});

function LabelsPage() {
	const labels = Route.useLoaderData();
	const router = useRouter();

	const [creating, setCreating] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [pageError, setPageError] = useState<unknown>(null);

	async function handleDelete(label: Label) {
		if (!confirm(`Supprimer le label « ${label.name} » ?`)) return;
		setPageError(null);
		try {
			await api.labels.delete(label.id);
			await router.invalidate();
		} catch (error) {
			setPageError(error);
		}
	}

	return (
		<div className="p-8">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Labels</h1>
				{!creating && (
					<button
						type="button"
						onClick={() => {
							setEditingId(null);
							setCreating(true);
						}}
						className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
					>
						+ Nouveau label
					</button>
				)}
			</div>

			<ErrorMessage error={pageError} />

			{creating && (
				<div className="mb-6 rounded-lg border border-gray-200 p-4">
					<h2 className="mb-3 font-semibold">Nouveau label</h2>
					<LabelForm
						initialValues={{ name: "", color: "#3b82f6" }}
						submitLabel="Créer le label"
						onCancel={() => setCreating(false)}
						onSubmit={async (input) => {
							await api.labels.create(input);
							await router.invalidate();
							setCreating(false);
						}}
					/>
				</div>
			)}

			{labels.length === 0 ? (
				<p className="text-gray-500">Aucun label pour le moment.</p>
			) : (
				<ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
					{labels.map((label) => (
						<li key={label.id} className="p-4">
							{editingId === label.id ? (
								<LabelForm
									initialValues={{ name: label.name, color: label.color }}
									submitLabel="Enregistrer"
									onCancel={() => setEditingId(null)}
									onSubmit={async (input) => {
										await api.labels.update(label.id, input);
										await router.invalidate();
										setEditingId(null);
									}}
								/>
							) : (
								<div className="flex items-center justify-between gap-4">
									<span className="inline-flex items-center gap-2 font-medium">
										<span
											className="h-3 w-3 rounded-full"
											style={{ backgroundColor: label.color }}
										/>
										{label.name}
										<span className="font-mono text-xs text-gray-400">
											{label.color}
										</span>
									</span>
									<div className="flex shrink-0 gap-3 text-sm">
										<button
											type="button"
											onClick={() => {
												setCreating(false);
												setEditingId(label.id);
											}}
											className="text-blue-600 hover:underline"
										>
											Modifier
										</button>
										<button
											type="button"
											onClick={() => handleDelete(label)}
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
