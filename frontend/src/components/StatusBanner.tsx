import { useEffect, useState } from "react";
import type { Entry, Label } from "../lib/api";
import { formatDateTime, formatElapsed } from "../lib/format";

type Props = {
	active: Entry | null;
};

export function StatusBanner({ active }: Props) {
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
