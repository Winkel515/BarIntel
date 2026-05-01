import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SessionQualityHeatmap from '../components/SessionQualityHeatmap';
import type { Workout } from '../types';
import {
	getDailySessionQualityData,
	getPRs,
	getSuccessRate,
	getTotalVolume,
	getWeeklyConsistencySummary,
} from '../utils';

interface Props {
	workouts: Workout[];
	isLoading?: boolean;
	error?: string;
}

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});

const getRecentWorkouts = (workouts: Workout[]) => {
	const now = new Date();
	const weekAgo = new Date(now);
	weekAgo.setDate(now.getDate() - 6);

	return workouts.filter((workout) => {
		const workoutDate = new Date(workout.date);
		return workoutDate >= weekAgo && workoutDate <= now;
	});
};

export default function Dashboard({ workouts }: Props) {
	const sortedWorkouts = useMemo(
		() => workouts.slice().sort((a, b) => (a.date > b.date ? -1 : 1)),
		[workouts],
	);
	const latestWorkout = sortedWorkouts[0];
	const bodyweightEntries = useMemo(
		() =>
			sortedWorkouts.filter(
				(workout) => workout.bodyweight !== undefined,
			),
		[sortedWorkouts],
	);
	const latestBodyweight = bodyweightEntries[0]?.bodyweight;
	const previousBodyweight = bodyweightEntries[1]?.bodyweight;
	const bodyweightDelta =
		latestBodyweight !== undefined && previousBodyweight !== undefined
			? Math.round((latestBodyweight - previousBodyweight) * 10) / 10
			: null;
	const recentWorkouts = useMemo(() => getRecentWorkouts(workouts), [workouts]);

	const prs = useMemo(() => getPRs(workouts), [workouts]);
	const recentSuccessRate = useMemo(
		() => getSuccessRate(recentWorkouts),
		[recentWorkouts],
	);
	const recentVolume = useMemo(
		() =>
			recentWorkouts.reduce(
				(total, workout) => total + getTotalVolume(workout),
				0,
			),
		[recentWorkouts],
	);
	const sessionQualityData = useMemo(
		() => getDailySessionQualityData(workouts),
		[workouts],
	);
	const consistencySummary = useMemo(
		() => getWeeklyConsistencySummary(sessionQualityData),
		[sessionQualityData],
	);

	return (
		<main className="space-y-6 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:pb-16 sm:px-6">
			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/20">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Dashboard
						</p>
						<h1 className="mt-2 text-3xl font-semibold text-white">BarIntel</h1>
					</div>
					<div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-right text-slate-300">
						<p className="text-xs uppercase tracking-[0.24em] text-muted">
							Workout log
						</p>
						<p className="mt-1 text-lg font-medium text-white">
							{workouts.length} sessions
						</p>
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<p className="text-sm text-muted">7-day volume</p>
					<p className="mt-2 text-2xl font-semibold text-white">
						{recentVolume} kg
					</p>
				</div>
				<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<p className="text-sm text-muted">Recent success</p>
					<p className="mt-2 text-2xl font-semibold text-white">
						{recentSuccessRate}%
					</p>
				</div>
				<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<p className="text-sm text-muted">Sessions this week</p>
					<p className="mt-2 text-2xl font-semibold text-white">
						{recentWorkouts.length}
					</p>
				</div>
				<div className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<p className="text-sm text-muted">Latest bodyweight</p>
					<p className="mt-2 text-2xl font-semibold text-white">
						{latestBodyweight !== undefined ? `${latestBodyweight} kg` : 'None'}
					</p>
					{bodyweightDelta !== null ? (
						<p className="mt-1 text-sm text-slate-400">
							{bodyweightDelta > 0 ? '+' : ''}
							{bodyweightDelta} kg from previous
						</p>
					) : null}
				</div>
			</section>

			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<div className="space-y-4">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Training consistency
						</p>
						<p className="mt-3 text-sm text-slate-400">
							Avg quality: {consistencySummary.avgQualityThisWeek}
						</p>
					</div>
					<div className="w-full">
						<SessionQualityHeatmap
							dailyData={sessionQualityData}
						/>
					</div>
				</div>
			</section>

			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Latest session
						</p>
						{latestWorkout ? (
							<>
								<h2 className="mt-2 text-xl font-semibold text-white">
									{latestWorkout.name || 'Workout'}
								</h2>
								<p className="mt-2 text-sm text-slate-400">
									{formatDate(latestWorkout.date)} ·{' '}
									{latestWorkout.exercises.length} exercises ·{' '}
									{getTotalVolume(latestWorkout)} kg
								</p>
							</>
						) : (
							<p className="mt-3 text-sm text-muted">
								No workouts yet. Create your first session in Logger.
							</p>
						)}
					</div>
					{latestWorkout ? (
						<Link
							to={`/history/${latestWorkout.id}`}
							className="inline-flex items-center justify-center rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft"
						>
							View details
						</Link>
					) : null}
				</div>
			</section>

			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							PRs
						</p>
						<h2 className="mt-2 text-xl font-semibold text-white">
							Current top lifts
						</h2>
					</div>
				</div>

				{Object.keys(prs).length ? (
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						{Object.entries(prs)
							.sort((a, b) => b[1] - a[1])
							.slice(0, 6)
							.map(([exercise, weight]) => (
								<div key={exercise} className="rounded-3xl bg-slate-950/80 p-4">
									<p className="text-sm text-muted">{exercise}</p>
									<p className="mt-2 text-xl font-semibold text-white">
										{weight} kg
									</p>
								</div>
							))}
					</div>
				) : (
					<p className="mt-4 text-sm text-muted">
						Your PRs will appear once you save workouts.
					</p>
				)}
			</section>
		</main>
	);
}
