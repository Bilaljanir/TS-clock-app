import { ApiError } from "./api";

export type ParsedFormError = {
	fieldErrors: Record<string, string>;
	generalError: string | null;
};
export function parseApiError(error: unknown): ParsedFormError {
	if (error instanceof ApiError && error.issues?.length) {
		const fieldErrors: Record<string, string> = {};
		for (const issue of error.issues) {
			fieldErrors[issue.path || "_"] = issue.message;
		}
		return { fieldErrors, generalError: fieldErrors._ ?? null };
	}

	if (error instanceof ApiError) {
		return { fieldErrors: {}, generalError: error.message };
	}

	return {
		fieldErrors: {},
		generalError: "Une erreur inattendue est survenue.",
	};
}
