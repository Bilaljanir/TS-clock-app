import { type FormEvent, useState } from "react";
import type { LabelInput } from "../lib/api";
import { parseApiError } from "../lib/formErrors";
import { ErrorMessage } from "./ErrorMessage";
import { Field } from "./Field";

export type LabelFormValues = {
	name: string;
	color: string; // format #RRGGBB
};

type Props = {
	initialValues: LabelFormValues;
	submitLabel: string;
	/** Appelle l'API ; doit lever une ApiError en cas d'échec. */
	onSubmit: (input: LabelInput) => Promise<void>;
	onCancel?: () => void;
};

function toApiInput(values: LabelFormValues): LabelInput {
	return {
		name: values.name.trim(),
		color: values.color,
	};
}

export function LabelForm({
	initialValues,
	submitLabel,
	onSubmit,
	onCancel,
}: Props) {
	const [values, setValues] = useState<LabelFormValues>(initialValues);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [generalError, setGeneralError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setSubmitting(true);
		setFieldErrors({});
		setGeneralError(null);

		try {
			await onSubmit(toApiInput(values));
		} catch (error) {
			const parsed = parseApiError(error);
			setFieldErrors(parsed.fieldErrors);
			setGeneralError(parsed.generalError);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<ErrorMessage error={generalError} />

			<Field label="Nom" error={fieldErrors.name}>
				<input
					type="text"
					value={values.name}
					onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
					className="w-full rounded border border-gray-300 px-3 py-2"
				/>
			</Field>

			<Field label="Couleur" error={fieldErrors.color}>
				<div className="flex items-center gap-3">
					<input
						type="color"
						value={values.color}
						onChange={(e) =>
							setValues((v) => ({ ...v, color: e.target.value }))
						}
						className="h-10 w-14 cursor-pointer rounded border border-gray-300"
					/>
					<input
						type="text"
						value={values.color}
						onChange={(e) =>
							setValues((v) => ({ ...v, color: e.target.value }))
						}
						className="w-32 rounded border border-gray-300 px-3 py-2 font-mono text-sm"
					/>
				</div>
			</Field>

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={submitting}
					className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{submitting ? "Enregistrement…" : submitLabel}
				</button>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
					>
						Annuler
					</button>
				)}
			</div>
		</form>
	);
}
