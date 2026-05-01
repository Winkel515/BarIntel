import { useMemo } from 'react';
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
	getLiftRatios,
	getPRs,
	getTopSetsByLift,
	getWeeklyVolume,
} from '../utils';
import { classicLiftNames, coreLiftNames, supportedLiftNames } from '../supportedLifts';

interface Props {
	workouts: Workout[];
}

const formatLabel = (value: string) => value.slice(5);

export default function Analysis({ workouts }: Props) {
	const weeklyVolume = useMemo(() => getWeeklyVolume(workouts), [workouts]);
	const successSeries = useMemo(() => getDailySuccess(workouts), [workouts]);
	const topLiftData = useMemo(() => getTopSetsByLift(workouts), [workouts]);
	const prs = useMemo(() => getPRs(workouts), [workouts]);
	const ratios = useMemo(() => getLiftRatios(workouts), [workouts]);
	const hasPRs = useMemo(
		() => Object.values(prs).some((weight) => weight > 0),
		[prs],
	);

	return (
		<main className="space-y-6 px-4 pb-28 pt-6 sm:pb-16 sm:px-6">
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
						<h2 className="mt-2 text-xl font-semibold text-white">
							Core lift maxes
						</h2>
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
						<h2 className="mt-2 text-xl font-semibold text-white">
							Classic and squat balance
						</h2>
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
					<div className="mb-4 flex items-center justify-between gap-4">
						<div>
							<p className="text-sm uppercase tracking-[0.24em] text-muted">
								Top set trend
							</p>
							<h2 className="mt-2 text-xl font-semibold text-white">
								Lift top load over time
							</h2>
						</div>
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
									{topLiftData.lifts.map((lift, index) => (
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
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Volume
						</p>
						<h2 className="mt-2 text-xl font-semibold text-white">
							Weekly volume
						</h2>
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
									{supportedLiftNames.map((lift, index) => (
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
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Hit rate
						</p>
						<h2 className="mt-2 text-xl font-semibold text-white">
							Snatch and Clean & Jerk success
						</h2>
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
									{classicLiftNames.map((lift, index) => (
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
