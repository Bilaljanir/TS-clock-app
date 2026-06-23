import { useActionState, useState } from "react";
import type { EntryInput, Label, Project } from "../lib/api";
import { type ParsedFormError, parseApiError } from "../lib/formErrors";
import { ErrorMessage } from "./ErrorMessage";
import { Field } from "./Field";

export type EntryFormValues = {
	project_id: number | "";
	description: string;
	start_time: string;
	end_time: string;
	label_ids: number[];
};

type Props = {
	projects: Project[];
	labels: Label[];
	initialValues: EntryFormValues;
	submitLabel: string;
	onSubmit: (input: EntryInput) => Promise<void>;
};

const NO_ERROR: ParsedFormError = { fieldErrors: {}, generalError: null };

function toApiInput(values: EntryFormValues): EntryInput {
	return {
		project_id: Number(values.project_id),
		description: values.description.trim() || null,
		start_time: new Date(values.start_time).toISOString(),
		end_time: values.end_time ? new Date(values.end_time).toISOString() : null,
		label_ids: values.label_ids,
	};
}

export function EntryForm({
	projects,
	labels,
	initialValues,
	submitLabel,
	onSubmit,
}: Props) {
	const [values, setValues] = useState<EntryFormValues>(initialValues);

	const [errors, submitAction, isPending] = useActionState<ParsedFormError>(
		async () => {
			try {
				await onSubmit(toApiInput(values));
				return NO_ERROR;
			} catch (error) {
				return parseApiError(error);
			}
		},
		NO_ERROR,
	);

	function toggleLabel(id: number) {
		setValues((v) => ({
			...v,
			label_ids: v.label_ids.includes(id)
				? v.label_ids.filter((l) => l !== id)
				: [...v.label_ids, id],
		}));
	}

	return (
		<form action={submitAction} className="max-w-lg space-y-5">
			<ErrorMessage error={errors.generalError} />

			<Field label="Projet" error={errors.fieldErrors.project_id}>
				<select
					value={values.project_id}
					onChange={(e) =>
						setValues((v) => ({
							...v,
							project_id: Number(e.target.value) || "",
						}))
					}
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

			<Field label="Description" error={errors.fieldErrors.description}>
				<textarea
					value={values.description}
					onChange={(e) =>
						setValues((v) => ({ ...v, description: e.target.value }))
					}
					rows={3}
					className="w-full rounded border border-gray-300 px-3 py-2"
				/>
			</Field>

			<div className="flex gap-4">
				<Field label="Début" error={errors.fieldErrors.start_time}>
					<input
						type="datetime-local"
						value={values.start_time}
						onChange={(e) =>
							setValues((v) => ({ ...v, start_time: e.target.value }))
						}
						className="w-full rounded border border-gray-300 px-3 py-2"
					/>
				</Field>
				<Field label="Fin (optionnel)" error={errors.fieldErrors.end_time}>
					<input
						type="datetime-local"
						value={values.end_time}
						onChange={(e) =>
							setValues((v) => ({ ...v, end_time: e.target.value }))
						}
						className="w-full rounded border border-gray-300 px-3 py-2"
					/>
				</Field>
			</div>

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
								checked={values.label_ids.includes(label.id)}
								onChange={() => toggleLabel(label.id)}
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

			<button
				type="submit"
				disabled={isPending}
				className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
			>
				{isPending ? "Enregistrement…" : submitLabel}
			</button>
		</form>
	);
}
