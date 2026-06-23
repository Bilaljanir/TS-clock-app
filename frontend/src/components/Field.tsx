import type { ReactNode } from "react";

/** Libellé + champ + message d'erreur de validation, partagé par les formulaires. */
export function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex-1">
			<span className="mb-1 block text-sm font-medium text-gray-700">
				{label}
			</span>
			{children}
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
}
