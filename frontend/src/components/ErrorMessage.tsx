import { ApiError } from "../lib/api";

export function ErrorMessage({ error }: { error: unknown }) {
	if (!error) return null;

	let title: string;
	let issues: { path: string; message: string }[] = [];

	if (error instanceof ApiError) {
		title = error.message;
		issues = (error.issues ?? []).filter((i) => i.path && i.path !== "_");
	} else if (error instanceof Error) {
		title = error.message;
	} else if (typeof error === "string") {
		title = error;
	} else {
		title = "Une erreur inattendue est survenue.";
	}

	return (
		<div
			role="alert"
			className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
		>
			<p className="font-medium">{title}</p>
			{issues.length > 0 && (
				<ul className="mt-1 list-inside list-disc">
					{issues.map((issue) => (
						<li key={issue.path}>
							<span className="font-medium">{issue.path}</span> :{" "}
							{issue.message}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
