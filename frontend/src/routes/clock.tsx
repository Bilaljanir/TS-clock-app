import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useActionState, useEffect, useState } from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { Field } from "../components/Field";
import {
	api,
	type ClockInput,
	type Entry,
	type Label,
	type Project,
} from "../lib/api";
import { formatDateTime, formatElapsed } from "../lib/format";
import { type ParsedFormError, parseApiError } from "../lib/formErrors";

export const Route = createFileRoute("/clock")({
	loader: async () => {
		const [clock, projects, labels] = await Promise.all([
			api.clock.get(),
			api.projects.list(),
			api.labels.list(),
		]);
		return { active: clock.active, projects, labels };
	},
	component: ClockPage,
	pendingComponent: () => <p className="p-8 text-gray-500">Chargement…</p>,
	errorComponent: ({ error }) => (
		<div className="p-8">
			<ErrorMessage error={error} />
		</div>
	),
});

const NO_ERROR: ParsedFormError = { fieldErrors: {}, generalError: null };

function ClockPage() {
	const { active, projects, labels } = Route.useLoaderData();
	const router = useRouter();

	return (
		<div className="p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Horloge</h1>
				<Link
					to="/entries"
					search={{ page: 1, pageSize: 20 }}
					className="text-sm text-blue-600 underline"
				>
					Voir les entrées →
				</Link>
			</div>

			<StatusBanner active={active} />

			<ClockForm
				key={active?.id ?? "idle"}
				active={active}
				projects={projects}
				labels={labels}
				onSet={async (input) => {
					await api.clock.set(input);
					await router.invalidate({ filter: (route) => route.routeId === Route.id });
				}}
			/>
		</div>
	);
}

function StatusBanner({ active }: { active: Entry | null }) {
	if (!active) {
		return (
			<output className="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
				<span className="h-3 w-3 rounded-full bg-gray-400" />
				<p className="text-sm text-gray-600">
					Vous n'êtes pas pointé pour le moment.
				</p>
			</output>
		);
	}

	return (
		<output className="mb-6 block rounded-lg border border-green-300 bg-green-50 px-4 py-3">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<span className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
					<div>
						<p className="font-medium text-green-900">
							Pointé sur « {active.project.name} »
						</p>
						<p className="text-sm text-green-700">
							Depuis {formatDateTime(active.start_time)}
						</p>
					</div>
				</div>
				<LiveDuration start={active.start_time} />
			</div>

			{active.labels.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1">
					{active.labels.map((label) => (
						<LabelChip key={label.id} label={label} />
					))}
				</div>
			)}
		</output>
	);
}

function LiveDuration({ start }: { start: string }) {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<span className="font-mono text-2xl font-semibold tabular-nums text-green-900">
			{formatElapsed(start, now)}
		</span>
	);
}

function LabelChip({ label }: { label: Label }) {
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-gray-700">
			<span
				className="h-2 w-2 rounded-full"
				style={{ backgroundColor: label.color }}
			/>
			{label.name}
		</span>
	);
}

type ClockFormProps = {
	active: Entry | null;
	projects: Project[];
	labels: Label[];
	onSet: (input: ClockInput) => Promise<void>;
};

function ClockForm({ active, projects, labels, onSet }: ClockFormProps) {
	const [projectId, setProjectId] = useState<number | "">(
		active?.project.id ?? "",
	);
	const [labelIds, setLabelIds] = useState<number[]>(
		() => active?.labels.map((l) => l.id) ?? [],
	);

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

			if (projectId === "") {
				return {
					fieldErrors: { project_id: "Choisissez un projet." },
					generalError: null,
				};
			}

			await onSet({ project_id: projectId, label_ids: labelIds });
			return NO_ERROR;
		} catch (error) {
			return parseApiError(error);
		}
	}, NO_ERROR);

	function toggleLabel(id: number) {
		setLabelIds((ids) =>
			ids.includes(id) ? ids.filter((l) => l !== id) : [...ids, id],
		);
	}

	const saveLabel = active ? "Mettre à jour" : "Pointer l'arrivée";

	return (
		<form action={formAction} className="max-w-lg space-y-5">
			<ErrorMessage error={errors.generalError} />

			<Field label="Projet" error={errors.fieldErrors.project_id}>
				<select
					value={projectId}
					onChange={(e) => setProjectId(Number(e.target.value) || "")}
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
								checked={labelIds.includes(label.id)}
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
