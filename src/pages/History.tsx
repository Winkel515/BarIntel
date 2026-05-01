import { useNavigate } from 'react-router-dom';
import type { Workout } from '../types';
import { getTotalVolume, getSuccessRate } from '../utils';
import { isSupportedLiftName } from '../supportedLifts';

interface Props {
	workouts: Workout[];
}

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});

export default function History({ workouts }: Props) {
	const navigate = useNavigate();
	const sorted = workouts.slice().sort((a, b) => (a.date > b.date ? -1 : 1));

	return (
		<main className="space-y-6 px-4 pb-16 pt-6 sm:px-6">
			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<p className="text-sm uppercase tracking-[0.24em] text-muted">
					Workout history
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-white">
					Past sessions
				</h1>
			</section>

			{sorted.length ? (
				<div className="space-y-4">
					{sorted.map((workout) => {
						const success = getSuccessRate([workout]);
						const supportedExerciseCount = workout.exercises.filter(
							(exercise) => isSupportedLiftName(exercise.name),
						).length;
						return (
							<article
								key={workout.id}
								className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10"
							>
								<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<p className="text-sm text-muted">
											{formatDate(workout.date)}
										</p>
										<h2 className="mt-2 text-xl font-semibold text-white">
											{workout.name ??
												`${supportedExerciseCount} supported lifts`}
										</h2>
										<p className="mt-2 text-sm text-slate-400">
											{workout.notes ?? 'No notes'}
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<span className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-200">
											{getTotalVolume(workout)} kg
										</span>
										<span className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-200">
											{success}% success
										</span>
										<button
											type="button"
											onClick={() => navigate(`/history/${workout.id}`)}
											className="rounded-3xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentSoft"
										>
											View
										</button>
									</div>
								</div>
							</article>
						);
					})}
				</div>
			) : (
				<div className="rounded-3xl border border-slate-800 bg-surface/80 p-6 text-sm text-slate-400">
					No workouts found. Log your next training session on the Logger page.
				</div>
			)}
		</main>
	);
}
