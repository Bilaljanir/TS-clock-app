/** Convertit un horodatage ISO en valeur d'<input type="datetime-local"> locale. */
export function toDatetimeLocal(iso: string): string {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

/** Formate un horodatage ISO en date+heure locale (fr-FR). */
export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString("fr-FR", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

/**
 * Durée entre start et end au format "Hh MMm".
 * Renvoie "en cours" si l'entrée n'est pas terminée.
 */
export function formatDuration(start: string, end: string | null): string {
	if (!end) return "en cours";

	const ms = new Date(end).getTime() - new Date(start).getTime();
	const totalMinutes = Math.round(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
