import { useActionState } from "react";
import { type ClockInput, type Entry, type Label, type Project } from "../lib/api";
import { type ParsedFormError, parseApiError } from "../lib/formErrors";
import { ErrorMessage } from "./ErrorMessage";
import { Field } from "./Field";

type Props = {
	active: Entry | null;
	projects: Project[];
	labels: Label[];
	onSet: (input: ClockInput) => Promise<void>;
};

const NO_ERROR: ParsedFormError = { fieldErrors: {}, generalError: null };

export function ClockForm({ active, projects, labels, onSet }: Props) {
	const [errors, formAction, isPending] = useActionState<
		ParsedFormError,
		FormData
	>(async (_prev, formData) => {
		const intent = formData.get("intent");

		try {
			if (intent === "stop") {
				await onSet({ project_id: null, label_ids: [] });
				return NO_ERROR;
			}

			const projectId = Number(formData.get("project_id")) || null;
			if (projectId === null) {
				return {
					fieldErrors: { project_id: "Choisissez un projet." },
					generalError: null,
				};
			}

			const labelIds = formData.getAll("label_ids").map(Number);
			await onSet({ project_id: projectId, label_ids: labelIds });
			return NO_ERROR;
		} catch (error) {
			return parseApiError(error);
		}
	}, NO_ERROR);

	const saveLabel = active ? "Mettre à jour" : "Pointer l'arrivée";

	return (
		<form action={formAction} className="max-w-lg space-y-5">
			<ErrorMessage error={errors.generalError} />

			<Field label="Projet" error={errors.fieldErrors.project_id}>
				<select
					name="project_id"
					defaultValue={active?.project.id ?? ""}
					className="w-full rounded border border-gray-300 px-3 py-2"
				>
					<option value="">— Choisir un projet —</option>
					{projects.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
			</Field>

			<Field label="Labels" error={errors.fieldErrors.label_ids}>
				<div className="flex flex-wrap gap-3">
					{labels.length === 0 && (
						<span className="text-sm text-gray-400">
							Aucun label disponible.
						</span>
					)}
					{labels.map((label) => (
						<label key={label.id} className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="label_ids"
								value={label.id}
								defaultChecked={active?.labels.some((l) => l.id === label.id) ?? false}
							/>
							<span
								className="h-2 w-2 rounded-full"
								style={{ backgroundColor: label.color }}
							/>
							{label.name}
						</label>
					))}
				</div>
			</Field>

			<div className="flex gap-3">
				<button
					type="submit"
					name="intent"
					value="save"
					disabled={isPending}
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{isPending ? "Enregistrement…" : saveLabel}
				</button>

				{active && (
					<button
						type="submit"
						name="intent"
						value="stop"
						disabled={isPending}
						className="rounded border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
					>
						Pointer la sortie
					</button>
				)}
			</div>
		</form>
	);
}
