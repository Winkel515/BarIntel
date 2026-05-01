import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Line,
	LineChart,
	ResponsiveContainer,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
} from 'recharts';
import type { Workout } from '../types';
import {
	getDailySuccess,
	getLiftChartColor,
	getEstimatedOneRepMaxes,
	getLiftRatios,
	getPRs,
	getTopSetsByLift,
	getWeeklyVolume,
} from '../utils';
import {
	classicLiftNames,
	coreLiftNames,
	supportedLiftNames,
	type SupportedLiftName,
} from '../supportedLifts';

interface Props {
	workouts: Workout[];
}

const formatLabel = (value: string) => value.slice(5);

function toggleLiftSelection(
	selected: SupportedLiftName[],
	lift: SupportedLiftName,
	allLifts: readonly SupportedLiftName[],
) {
	if (selected.length === allLifts.length) {
		return [lift];
	}

	if (selected.includes(lift)) {
		return selected.filter((item) => item !== lift);
	}

	return [...selected, lift];
}

function getFocusLabel(
	selected: SupportedLiftName[],
	allLifts: readonly SupportedLiftName[],
) {
	if (!selected.length) return 'No lifts';
	if (selected.length === allLifts.length) return 'All lifts';
	if (selected.length === 1) return selected[0];
	return `${selected.length} lifts`;
}

function LiftFocusMenu({
	lifts,
	selected,
	onChange,
}: {
	lifts: readonly SupportedLiftName[];
	selected: SupportedLiftName[];
	onChange: (next: SupportedLiftName[]) => void;
}) {
	const allSelected = selected.length === lifts.length;
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsOpen(false);
			}
		};

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen]);

	return (
		<div ref={menuRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((current) => !current)}
				aria-expanded={isOpen}
				className="block w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-left text-sm font-semibold text-white outline-none transition hover:border-slate-500 focus:border-accent sm:w-56"
			>
				{getFocusLabel(selected, lifts)}
			</button>
			{isOpen ? (
				<div className="absolute right-0 z-10 mt-2 grid w-full min-w-56 gap-2 rounded-3xl border border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-black/40">
					<button
						type="button"
						onClick={() => onChange(allSelected ? [] : [...lifts])}
						className={`flex items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
							allSelected
								? 'bg-accent text-white'
								: 'text-slate-300 hover:bg-white/10 hover:text-white'
						}`}
					>
						All lifts
						<span>{allSelected ? 'On' : ''}</span>
					</button>
					{lifts.map((lift) => {
						const isSelected = selected.includes(lift);

						return (
							<button
								key={lift}
								type="button"
								onClick={() =>
									onChange(toggleLiftSelection(selected, lift, lifts))
								}
								className={`flex items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
									isSelected
										? 'bg-accent/20 text-white'
										: 'text-slate-300 hover:bg-white/10 hover:text-white'
								}`}
							>
								{lift}
								<span
									className={`h-2.5 w-2.5 rounded-full ${
										isSelected ? 'bg-accent' : 'bg-slate-700'
									}`}
								/>
							</button>
						);
					})}
				</div>
			) : null}
		</div>
	);
}

export default function Analysis({ workouts }: Props) {
	const [trendLifts, setTrendLifts] = useState<SupportedLiftName[]>([
		...supportedLiftNames,
	]);
	const [volumeLifts, setVolumeLifts] = useState<SupportedLiftName[]>([
		...supportedLiftNames,
	]);
	const [successLifts, setSuccessLifts] = useState<SupportedLiftName[]>([
		...classicLiftNames,
	]);
	const weeklyVolume = useMemo(() => getWeeklyVolume(workouts), [workouts]);
	const successSeries = useMemo(() => getDailySuccess(workouts), [workouts]);
	const topLiftData = useMemo(() => getTopSetsByLift(workouts), [workouts]);
	const prs = useMemo(() => getPRs(workouts), [workouts]);
	const estimatedOneRepMaxes = useMemo(() => getEstimatedOneRepMaxes(workouts), [workouts]);
	const ratios = useMemo(() => getLiftRatios(workouts), [workouts]);
	const hasPRs = useMemo(
		() => Object.values(prs).some((weight) => weight > 0),
		[prs],
	);

	return (
		<main className="space-y-6 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:pb-16 sm:px-6">
			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<p className="text-sm uppercase tracking-[0.24em] text-muted">
					Analysis
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-white">
					Progress charts
				</h1>
			</section>

			<section className="grid gap-6">
				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							PRs
						</p>
						{hasPRs ? (
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								{coreLiftNames.map((lift) => (
									<div key={lift} className="rounded-3xl bg-slate-950/80 p-4">
										<p className="text-sm text-muted">{lift}</p>
										<p className="mt-2 text-xl font-semibold text-white">
											{prs[lift] ? `${prs[lift]} kg` : '-'}
										</p>
									</div>
								))}
							</div>
						) : (
							<p className="mt-4 rounded-3xl bg-slate-950/80 p-6 text-sm text-slate-400">
								Log core lifts to see PRs.
							</p>
						)}
					</div>

					<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Ratios
						</p>
						<div className="mt-4 grid gap-3">
							{ratios.map((ratio) => (
								<div
									key={ratio.label}
									className="flex items-center justify-between gap-3 rounded-3xl bg-slate-950/80 p-4"
								>
									<p className="text-sm text-muted">{ratio.label}</p>
									<p className="text-xl font-semibold text-white">
										{ratio.value ? `${ratio.value}%` : '-'}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>

					<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Estimated 1RM
						</p>
						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							{coreLiftNames.map((lift) => (
								<div key={lift} className="rounded-3xl bg-slate-950/80 p-4">
									<p className="text-sm text-muted">{lift}</p>
									<p className="mt-2 text-xl font-semibold text-white">
										{estimatedOneRepMaxes[lift] ? `${estimatedOneRepMaxes[lift]} kg` : '-'}
									</p>
								</div>
							))}
						</div>
						<p className="mt-4 text-xs text-slate-400">
							Calculated with Epley formula from your best successful set (weight × (1 + reps/30)).
						</p>
					</div>

				<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<p className="text-sm uppercase tracking-[0.24em] text-muted">
								Top set trend
							</p>
						</div>
						<LiftFocusMenu
							lifts={supportedLiftNames}
							selected={trendLifts}
							onChange={setTrendLifts}
						/>
					</div>
					{topLiftData.rows.length ? (
						<div className="h-72">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={topLiftData.rows}>
									<CartesianGrid stroke="#1f2937" vertical={false} />
									<XAxis
										dataKey="date"
										tickFormatter={formatLabel}
										stroke="#94a3b8"
									/>
									<YAxis stroke="#94a3b8" />
									<Tooltip
										contentStyle={{
											backgroundColor: '#090909',
											borderColor: '#2d2d2d',
										}}
										labelFormatter={(value) => `Date: ${value}`}
									/>
									<Legend wrapperStyle={{ color: '#94a3b8' }} />
									{topLiftData.lifts
										.filter((lift) => trendLifts.includes(lift))
										.map((lift, index) => (
										<Line
											key={lift}
											type="monotone"
											dataKey={lift}
											stroke={getLiftChartColor(index)}
											strokeWidth={3}
											dot={false}
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						</div>
					) : (
						<p className="rounded-3xl bg-slate-950/80 p-6 text-sm text-slate-400">
							Log workouts to generate lift progress charts.
						</p>
					)}
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
						<div className="flex flex-col gap-4">
							<p className="text-sm uppercase tracking-[0.24em] text-muted">
								Volume
							</p>
							<LiftFocusMenu
								lifts={supportedLiftNames}
								selected={volumeLifts}
								onChange={setVolumeLifts}
							/>
						</div>
						<div className="mt-5 h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={weeklyVolume}>
									<CartesianGrid stroke="#1f2937" vertical={false} />
									<XAxis
										dataKey="date"
										tickFormatter={formatLabel}
										stroke="#94a3b8"
									/>
									<YAxis stroke="#94a3b8" />
									<Tooltip
										contentStyle={{
											backgroundColor: '#090909',
											borderColor: '#2d2d2d',
										}}
									/>
									<Legend wrapperStyle={{ color: '#94a3b8' }} />
									{supportedLiftNames
										.filter((lift) => volumeLifts.includes(lift))
										.map((lift, index) => (
										<Line
											key={lift}
											type="monotone"
											dataKey={lift}
											stroke={getLiftChartColor(index)}
											strokeWidth={3}
											dot={false}
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
						<div className="flex flex-col gap-4">
							<p className="text-sm uppercase tracking-[0.24em] text-muted">
								Hit rate
							</p>
							<LiftFocusMenu
								lifts={classicLiftNames}
								selected={successLifts}
								onChange={setSuccessLifts}
							/>
						</div>
						<div className="mt-5 h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={successSeries}>
									<CartesianGrid stroke="#1f2937" vertical={false} />
									<XAxis
										dataKey="date"
										tickFormatter={formatLabel}
										stroke="#94a3b8"
									/>
									<YAxis stroke="#94a3b8" unit="%" />
									<Tooltip
										contentStyle={{
											backgroundColor: '#090909',
											borderColor: '#2d2d2d',
										}}
										formatter={(value: number) => `${value}%`}
									/>
									<Legend wrapperStyle={{ color: '#94a3b8' }} />
									{classicLiftNames
										.filter((lift) => successLifts.includes(lift))
										.map((lift, index) => (
										<Line
											key={lift}
											type="monotone"
											dataKey={lift}
											stroke={getLiftChartColor(index)}
											strokeWidth={3}
											dot={false}
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
