import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Exercise, Workout } from '../types';
import { getTotalVolume, getSuccessRate, normalizeAttempts } from '../utils';
import { isSupportedLiftName, usesRepTracking } from '../supportedLifts';

interface Props {
	workouts: Workout[];
}

const formatDate = (date: string) =>
	new Date(date).toLocaleDateString(undefined, {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});

const formatShortDate = (date: string) =>
	new Date(date).toLocaleDateString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	});

function SetTile({
	exercise,
	set,
	setIndex,
}: {
	exercise: Exercise;
	set: Exercise['sets'][number];
	setIndex: number;
}) {
	const tracksAttempts = usesRepTracking(exercise.name);
	const attempts = tracksAttempts ? normalizeAttempts(set) : [];
	const madeCount = attempts.filter((attempt) => attempt.result === 'made').length;

	return (
		<div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
			<div className="flex items-start justify-between gap-3">
				<p className="text-xs uppercase tracking-[0.2em] text-slate-500">
					Set {setIndex + 1}
				</p>
				{tracksAttempts ? (
					<span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
						{madeCount}/{set.reps}
					</span>
				) : null}
			</div>
			<div className="mt-4 flex items-baseline gap-3">
				<p className="text-3xl font-semibold text-white">{set.weight}</p>
				<p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
					kg
				</p>
				<p className="text-slate-700">x</p>
				<p className="text-3xl font-semibold text-white">{set.reps}</p>
				<p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
					reps
				</p>
			</div>
			{tracksAttempts ? (
				<div className="mt-4 flex gap-2">
					{attempts.map((attempt) => {
						const isMade = attempt.result === 'made';

						return (
							<span
								key={attempt.rep_number}
								className={`h-2.5 flex-1 rounded-full ${
									isMade ? 'bg-emerald-400' : 'bg-rose-400'
								}`}
								title={`Rep ${attempt.rep_number}: ${
									isMade ? 'made' : 'missed'
								}`}
							/>
						);
					})}
				</div>
			) : null}
		</div>
	);
}

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
	const totalSets = useMemo(
		() =>
			supportedExercises.reduce(
				(total, exercise) => total + exercise.sets.length,
				0,
			),
		[supportedExercises],
	);

	if (!workout) {
		return (
			<main className="space-y-6 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:pb-16 sm:px-6">
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
		<main className="mx-auto max-w-6xl space-y-6 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:pb-16 sm:px-6">
			<section className="overflow-hidden rounded-3xl border border-slate-800 bg-surface shadow-xl shadow-black/20">
				<div className="border-b border-slate-800 bg-slate-950/70 p-5 sm:p-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p className="text-sm uppercase tracking-[0.24em] text-muted">
								Workout details
							</p>
							<h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
								{workout.name || 'Workout'}
							</h1>
							<p className="mt-2 text-sm text-slate-400">
								{formatDate(workout.date)}
							</p>
						</div>
						<button
							type="button"
							onClick={() => navigate('/history')}
							className="inline-flex items-center justify-center rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
						>
							Back
						</button>
					</div>
				</div>

				<div className="grid gap-px bg-slate-800 sm:grid-cols-4">
					<div className="bg-surface p-5">
						<p className="text-xs uppercase tracking-[0.2em] text-muted">
							Volume
						</p>
						<p className="mt-2 text-2xl font-semibold text-white">
							{getTotalVolume(workout)}
							<span className="ml-1 text-base font-medium text-slate-400">
								kg
							</span>
						</p>
					</div>
					<div className="bg-surface p-5">
						<p className="text-xs uppercase tracking-[0.2em] text-muted">
							Success
						</p>
						<p className="mt-2 text-2xl font-semibold text-white">
							{getSuccessRate([workout])}%
						</p>
					</div>
					<div className="bg-surface p-5">
						<p className="text-xs uppercase tracking-[0.2em] text-muted">
							Work
						</p>
						<p className="mt-2 text-2xl font-semibold text-white">
							{supportedExercises.length}
							<span className="ml-1 text-base font-medium text-slate-400">
								lifts
							</span>
							<span className="mx-2 text-slate-700">/</span>
							{totalSets}
							<span className="ml-1 text-base font-medium text-slate-400">
								sets
							</span>
						</p>
					</div>
					<div className="bg-surface p-5">
						<p className="text-xs uppercase tracking-[0.2em] text-muted">
							Bodyweight
						</p>
						<p className="mt-2 text-2xl font-semibold text-white">
							{workout.bodyweight ? `${workout.bodyweight} kg` : 'None'}
						</p>
					</div>
				</div>
			</section>

			{workout.notes ? (
				<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<p className="text-sm uppercase tracking-[0.24em] text-muted">
						Notes
					</p>
					<p className="mt-3 text-base leading-7 text-slate-200">
						{workout.notes}
					</p>
				</section>
			) : null}

			<section className="space-y-4">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Session work
						</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">
							{formatShortDate(workout.date)}
						</h2>
					</div>
				</div>

				{supportedExercises.length ? (
					supportedExercises.map((exercise, exerciseIndex) => (
						<article
							key={exercise.id}
							className="overflow-hidden rounded-3xl border border-slate-800 bg-surface/80 shadow-xl shadow-black/10"
						>
							<div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-950/50 p-5 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-4">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-sm font-semibold text-accent">
										{exerciseIndex + 1}
									</div>
									<div>
										<p className="text-xs uppercase tracking-[0.22em] text-muted">
											{exercise.category}
										</p>
										<h3 className="mt-1 text-xl font-semibold text-white">
											{exercise.name}
										</h3>
									</div>
								</div>
								<p className="w-fit rounded-full bg-white/5 px-3 py-2 text-sm text-slate-200">
									{exercise.sets.length} sets
								</p>
							</div>

							<div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
								{exercise.sets.length ? (
									exercise.sets.map((set, setIndex) => (
										<SetTile
											key={set.id}
											exercise={exercise}
											set={set}
											setIndex={setIndex}
										/>
									))
								) : (
									<p className="col-span-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-muted">
										No sets logged for this lift.
									</p>
								)}
							</div>
						</article>
					))
				) : (
					<div className="rounded-3xl border border-slate-800 bg-surface/80 p-6 text-sm text-slate-400">
						This workout does not have supported lifts to display.
					</div>
				)}
			</section>
		</main>
	);
}
