// Client API typé pour le backend Elysia.

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Project = {
	id: number;
	name: string;
	description: string | null;
};

export type Label = {
	id: number;
	name: string;
	color: string;
};

export type Entry = {
	id: number;
	description: string | null;
	start_time: string;
	end_time: string | null;
	project: Pick<Project, "id" | "name" | "description">;
	labels: Label[];
	created_at: string;
	updated_at: string;
};

/** Corps envoyé pour créer/éditer une entrée. */
export type EntryInput = {
	project_id: number;
	description: string | null;
	start_time: string;
	end_time: string | null;
	label_ids: number[];
};

export type Paginated<T> = {
	data: T[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
};

export type ApiIssue = { path: string; message: string };

/** Erreur renvoyée par l'API, au format { error: { code, message, issues? } }. */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly code?: string,
		readonly issues?: ApiIssue[],
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		headers: { "content-type": "application/json", ...init?.headers },
		...init,
	});

	if (!response.ok) {
		let message = `Erreur ${response.status}`;
		let code: string | undefined;
		let issues: ApiIssue[] | undefined;
		try {
			const body = await response.json();
			if (body?.error) {
				message = body.error.message ?? message;
				code = body.error.code;
				issues = body.error.issues;
			}
		} catch {
			// réponse sans corps JSON exploitable : on garde le message par défaut
		}
		throw new ApiError(response.status, message, code, issues);
	}

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}

export const api = {
	projects: {
		list: () => request<Project[]>("/projects"),
	},
	labels: {
		list: () => request<Label[]>("/labels"),
	},
	entries: {
		list: (page: number, pageSize: number) =>
			request<Paginated<Entry>>(`/entries?page=${page}&pageSize=${pageSize}`),
		get: (id: number) => request<Entry>(`/entries/${id}`),
		create: (input: EntryInput) =>
			request<Entry>("/entries", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		update: (id: number, input: EntryInput) =>
			request<Entry>(`/entries/${id}`, {
				method: "PATCH",
				body: JSON.stringify(input),
			}),
	},
};
