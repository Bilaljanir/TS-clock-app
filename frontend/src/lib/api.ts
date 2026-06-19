const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type TimeEntry = {
	id: number;
	project_id: number;
	description: string | null;
	start_time: string;
	end_time: string | null;
	created_at: string;
	updated_at: string;
	project?: { id: number; name: string };
	labels?: { id: number; name: string; color: string | null }[];
};

export type PaginatedTimeEntries = {
	data: TimeEntry[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
};

export async function fetchTimeEntries(
	page: number,
	pageSize: number,
): Promise<PaginatedTimeEntries> {
	const response = await fetch(
		`${API_BASE_URL}/api/time-entries?page=${page}&pageSize=${pageSize}`,
	);

	if (!response.ok) {
		throw new Error(`Failed to load time entries (${response.status})`);
	}

	return response.json();
}
