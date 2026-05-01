import { useMemo } from 'react';
import type { Workout } from '../types';
import { getPRs, getSuccessRate, getTopSet, getTotalVolume } from '../utils';

interface Props {
	workouts: Workout[];
}

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});

export default function Dashboard({ workouts }: Props) {
	const latestWorkout = useMemo(() => {
		return workouts.slice().sort((a, b) => (a.date > b.date ? -1 : 1))[0];
	}, [workouts]);

	const prs = useMemo(() => getPRs(workouts), [workouts]);
	const successRate = useMemo(() => getSuccessRate(workouts), [workouts]);

	return (
		<main className="space-y-6 px-4 pb-16 pt-6 sm:px-6">
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

			<section className="grid gap-4 sm:grid-cols-2">
				<article className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<p className="text-sm uppercase tracking-[0.24em] text-muted">
						Last workout
					</p>
					{latestWorkout ? (
						<div className="mt-4 space-y-3">
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="text-sm text-muted">
										{formatDate(latestWorkout.date)}
									</p>
									<h2 className="mt-1 text-xl font-semibold text-white">
										{latestWorkout.exercises.length} exercises
									</h2>
								</div>
								<span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
									{latestWorkout.bodyweight
										? `${latestWorkout.bodyweight}kg`
										: 'No BW'}
								</span>
							</div>
							<div className="rounded-3xl bg-slate-950/80 p-4 text-sm text-slate-300">
								<p className="font-medium text-white">Top set</p>
								{getTopSet(latestWorkout) ? (
									<p className="mt-2 text-base leading-6">
										{getTopSet(latestWorkout)?.exercise}{' '}
										{getTopSet(latestWorkout)?.set.weight}kg x{' '}
										{getTopSet(latestWorkout)?.set.reps}
									</p>
								) : (
									<p className="mt-2 text-sm text-muted">
										Add a set in the logger to track progress.
									</p>
								)}
							</div>
						</div>
					) : (
						<p className="mt-3 text-sm text-muted">
							No workouts yet. Create your first session in Logger.
						</p>
					)}
				</article>

				<article className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<p className="text-sm uppercase tracking-[0.24em] text-muted">
						Stats
					</p>
					<div className="mt-4 grid gap-3">
						<div className="rounded-3xl bg-slate-950/80 p-4">
							<p className="text-sm text-muted">7-day volume</p>
							<p className="mt-2 text-2xl font-semibold text-white">
								{latestWorkout ? `${getTotalVolume(latestWorkout)} kg` : '0 kg'}
							</p>
						</div>
						<div className="rounded-3xl bg-slate-950/80 p-4">
							<p className="text-sm text-muted">Success rate</p>
							<p className="mt-2 text-2xl font-semibold text-white">
								{successRate}%
							</p>
						</div>
					</div>
				</article>
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
