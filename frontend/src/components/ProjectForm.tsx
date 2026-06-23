import { useActionState, useState } from "react";
import type { ProjectInput } from "../lib/api";
import { type ParsedFormError, parseApiError } from "../lib/formErrors";
import { ErrorMessage } from "./ErrorMessage";
import { Field } from "./Field";

export type ProjectFormValues = {
	name: string;
	description: string;
};

type Props = {
	initialValues: ProjectFormValues;
	submitLabel: string;
	/** Appelle l'API ; doit lever une ApiError en cas d'échec. */
	onSubmit: (input: ProjectInput) => Promise<void>;
	onCancel?: () => void;
};

const NO_ERROR: ParsedFormError = { fieldErrors: {}, generalError: null };

function toApiInput(values: ProjectFormValues): ProjectInput {
	return {
		name: values.name.trim(),
		description: values.description.trim() || null,
	};
}

export function ProjectForm({
	initialValues,
	submitLabel,
	onSubmit,
	onCancel,
}: Props) {
	const [values, setValues] = useState<ProjectFormValues>(initialValues);

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

	return (
		<form action={submitAction} className="space-y-4">
			<ErrorMessage error={errors.generalError} />

			<Field label="Nom" error={errors.fieldErrors.name}>
				<input
					type="text"
					value={values.name}
					onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
					className="w-full rounded border border-gray-300 px-3 py-2"
				/>
			</Field>

			<Field
				label="Description (optionnel)"
				error={errors.fieldErrors.description}
			>
				<textarea
					value={values.description}
					onChange={(e) =>
						setValues((v) => ({ ...v, description: e.target.value }))
					}
					rows={2}
					className="w-full rounded border border-gray-300 px-3 py-2"
				/>
			</Field>

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={isPending}
					className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{isPending ? "Enregistrement…" : submitLabel}
				</button>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						disabled={isPending}
						className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
					>
						Annuler
					</button>
				)}
			</div>
		</form>
	);
}
