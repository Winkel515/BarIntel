import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Workout } from '../types';
import { getSetSummary, getTotalVolume, getSuccessRate } from '../utils';
import { isSupportedLiftName } from '../supportedLifts';

interface Props {
	workouts: Workout[];
}

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString(undefined, {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});

export default function WorkoutDetail({ workouts }: Props) {
	const { id } = useParams();
	const navigate = useNavigate();
	const workout = useMemo(
		() => workouts.find((item) => item.id === id),
		[workouts, id],
	);
	const supportedExercises = useMemo(
		() =>
			workout?.exercises.filter((exercise) =>
				isSupportedLiftName(exercise.name),
			) ?? [],
		[workout],
	);

	if (!workout) {
		return (
			<main className="space-y-6 px-4 pb-16 pt-6 sm:px-6">
				<div className="rounded-3xl border border-slate-800 bg-surface/80 p-6 text-center text-slate-300">
					<p className="text-lg font-semibold text-white">Workout not found</p>
					<button
						type="button"
						onClick={() => navigate('/history')}
						className="mt-4 rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft"
					>
						Back to history
					</button>
				</div>
			</main>
		);
	}

	return (
		<main className="space-y-6 px-4 pb-16 pt-6 sm:px-6">
			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Workout details
						</p>
						<h1 className="mt-2 text-3xl font-semibold text-white">
							{formatDate(workout.date)}
						</h1>
					</div>
					<button
						type="button"
						onClick={() => navigate('/history')}
						className="rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
					>
						Back
					</button>
				</div>

				<div className="mt-5 grid gap-4 sm:grid-cols-3">
					<div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
						<p className="text-sm text-muted">Total volume</p>
						<p className="mt-2 text-2xl font-semibold text-white">
							{getTotalVolume(workout)} kg
						</p>
					</div>
					<div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
						<p className="text-sm text-muted">Success rate</p>
						<p className="mt-2 text-2xl font-semibold text-white">
							{getSuccessRate([workout])}%
						</p>
					</div>
					<div className="rounded-3xl bg-slate-950/80 p-4 text-slate-300">
						<p className="text-sm text-muted">Bodyweight</p>
						<p className="mt-2 text-2xl font-semibold text-white">
							{workout.bodyweight ? `${workout.bodyweight} kg` : 'None'}
						</p>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				{supportedExercises.map((exercise) => (
					<article
						key={exercise.id}
						className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10"
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm uppercase tracking-[0.24em] text-muted">
									{exercise.category}
								</p>
								<h2 className="mt-2 text-xl font-semibold text-white">
									{exercise.name}
								</h2>
							</div>
							<p className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-200">
								{exercise.sets.length} sets
							</p>
						</div>
						<div className="mt-4 space-y-3 overflow-x-auto">
							<table className="min-w-full text-left text-sm text-slate-300">
								<thead>
									<tr className="border-b border-slate-800 text-slate-500">
										<th className="px-3 py-2">Set</th>
									</tr>
								</thead>
								<tbody>
									{exercise.sets.map((set) => (
										<tr key={set.id} className="border-b border-slate-800">
											<td className="px-3 py-2 text-slate-200">
												{getSetSummary(exercise.name, set)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</article>
				))}
			</section>
		</main>
	);
}
