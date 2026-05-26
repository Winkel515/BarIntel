import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Exercise, Workout } from '../types';
import {
	createAttempts,
	cycleAttemptResult,
	getTotalVolume,
	getSuccessRate,
	normalizeAttempts,
} from '../utils';
import {
	getSupportedLift,
	isSupportedLiftName,
	supportedLifts,
	usesRepTracking,
	type SupportedLiftName,
} from '../supportedLifts';

interface Props {
	workouts: Workout[];
	onUpdate: (workout: Workout) => Promise<void>;
}

const DEFAULT_WORKOUT_NAME = 'Workout';

const defaultSetDraft = {
	weight: '',
	reps: '',
};

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

export default function WorkoutDetail({ workouts, onUpdate }: Props) {
	const { id } = useParams();
	const navigate = useNavigate();
	const workout = useMemo(
		() => workouts.find((item) => item.id === id),
		[workouts, id],
	);
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState('');
	const [date, setDate] = useState('');
	const [bodyweight, setBodyweight] = useState('');
	const [notes, setNotes] = useState('');
	const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
	const [setDrafts, setSetDrafts] = useState<
		Record<string, typeof defaultSetDraft>
	>({});
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState('');
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
	const nextAvailableLift = supportedLifts.find(
		(lift) =>
			!workoutExercises.some((exercise) => exercise.name === lift.name),
	);
	const editableTotal = useMemo(
		() =>
			workoutExercises.reduce(
				(sum, exercise) =>
					sum +
					exercise.sets.reduce((sub, set) => {
						if (!usesRepTracking(exercise.name)) {
							return sub + set.weight * set.reps;
						}

						const madeReps = normalizeAttempts(set).filter(
							(attempt) => attempt.result === 'made',
						).length;
						return sub + set.weight * madeReps;
					}, 0),
				0,
			),
		[workoutExercises],
	);

	const resetEditor = () => {
		if (!workout) return;

		setName(workout.name ?? '');
		setDate(workout.date);
		setBodyweight(
			workout.bodyweight === undefined ? '' : String(workout.bodyweight),
		);
		setNotes(workout.notes ?? '');
		setWorkoutExercises(
			workout.exercises.map((exercise) => ({
				...exercise,
				sets: exercise.sets.map((set) => ({ ...set })),
			})),
		);
		setSetDrafts({});
		setSaveError('');
	};

	const startEditing = () => {
		resetEditor();
		setIsEditing(true);
	};

	const addExercise = () => {
		const liftName = nextAvailableLift?.name;
		if (!liftName) return;

		const lift = getSupportedLift(liftName);
		setWorkoutExercises((current) => [
			...current,
			{
				id: crypto.randomUUID(),
				name: lift.name,
				category: lift.category,
				sets: [],
			},
		]);
	};

	const updateExerciseLift = (exerciseId: string, value: SupportedLiftName) => {
		const lift = getSupportedLift(value);
		setWorkoutExercises((current) =>
			current.map((exercise) =>
				exercise.id !== exerciseId
					? exercise
					: {
							...exercise,
							name: lift.name,
							category: lift.category,
							sets: exercise.sets.map((set) => ({
								...set,
								result: 'made',
								attempts:
									lift.tracking === 'rep' ? normalizeAttempts(set) : undefined,
							})),
						},
			),
		);
	};

	const updateSet = (
		exerciseId: string,
		setId: string,
		field: 'weight' | 'reps',
		value: string,
	) => {
		const numericValue = Number(value);
		if (numericValue < 0) return;

		setWorkoutExercises((current) =>
			current.map((exercise) =>
				exercise.id !== exerciseId
					? exercise
					: {
							...exercise,
							sets: exercise.sets.map((set) => {
								if (set.id !== setId) return set;

								const updatedSet = {
									...set,
									[field]: numericValue,
								};

								return {
									...updatedSet,
									attempts: usesRepTracking(exercise.name)
										? normalizeAttempts(updatedSet)
										: undefined,
								};
							}),
						},
			),
		);
	};

	const addSet = (exerciseId: string) => {
		const draft = setDrafts[exerciseId] || defaultSetDraft;
		const weight = Number(draft.weight);
		const reps = Number(draft.reps);
		if (!weight || !reps) return;

		setWorkoutExercises((current) =>
			current.map((exercise) =>
				exercise.id !== exerciseId
					? exercise
					: {
							...exercise,
							sets: [
								...exercise.sets,
								{
									id: crypto.randomUUID(),
									weight,
									reps,
									result: 'made',
									attempts: usesRepTracking(exercise.name)
										? createAttempts(reps)
										: undefined,
								},
							],
						},
			),
		);
		setSetDrafts((current) => ({
			...current,
			[exerciseId]: defaultSetDraft,
		}));
	};

	const updateAttempt = (
		exerciseId: string,
		setId: string,
		repNumber: number,
	) => {
		setWorkoutExercises((current) =>
			current.map((exercise) =>
				exercise.id !== exerciseId
					? exercise
					: {
							...exercise,
							sets: exercise.sets.map((set) =>
								set.id !== setId
									? set
									: {
											...set,
											attempts: normalizeAttempts(set).map((attempt) =>
												attempt.rep_number !== repNumber
													? attempt
													: {
															...attempt,
															result: cycleAttemptResult(attempt.result),
														},
											),
										},
							),
						},
			),
		);
	};

	const deleteExercise = (exerciseId: string) => {
		setWorkoutExercises((current) =>
			current.filter((exercise) => exercise.id !== exerciseId),
		);
	};

	const deleteSet = (exerciseId: string, setId: string) => {
		setWorkoutExercises((current) =>
			current.map((exercise) =>
				exercise.id !== exerciseId
					? exercise
					: {
							...exercise,
							sets: exercise.sets.filter((set) => set.id !== setId),
						},
			),
		);
	};

	const cancelEditing = () => {
		resetEditor();
		setIsEditing(false);
	};

	const saveWorkout = async () => {
		if (!workout || !workoutExercises.length) return;

		setIsSaving(true);
		setSaveError('');
		try {
			await onUpdate({
				...workout,
				name: name.trim() || DEFAULT_WORKOUT_NAME,
				date,
				bodyweight: bodyweight ? Number(bodyweight) : undefined,
				notes: notes.trim() || undefined,
				exercises: workoutExercises,
			});
			setIsEditing(false);
		} catch (error) {
			setSaveError(
				error instanceof Error ? error.message : 'Unable to update workout.',
			);
		} finally {
			setIsSaving(false);
		}
	};

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

	if (isEditing) {
		return (
			<main className="mx-auto max-w-6xl space-y-6 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:pb-16 sm:px-6">
				<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0 flex-1">
							<p className="text-sm uppercase tracking-[0.24em] text-muted">
								Edit workout
							</p>
							<h1 className="mt-2">
								<input
									type="text"
									value={name}
									onChange={(event) => setName(event.target.value)}
									placeholder={DEFAULT_WORKOUT_NAME}
									aria-label="Workout name"
									className="-mx-1 block w-full min-w-0 rounded-lg bg-transparent px-1 text-3xl font-semibold text-white outline-none transition placeholder:text-slate-500 hover:bg-white/5 focus:bg-white/5"
								/>
							</h1>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={cancelEditing}
								disabled={isSaving}
								className="rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={saveWorkout}
								disabled={!workoutExercises.length || isSaving}
								className="rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSaving ? 'Saving...' : 'Save'}
							</button>
						</div>
					</div>

					{saveError ? (
						<p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
							{saveError}
						</p>
					) : null}

					<div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-3">
						<label className="block min-w-0 space-y-2 text-sm text-slate-300">
							Date
							<input
								type="date"
								value={date}
								onChange={(event) => setDate(event.target.value)}
								className="block w-full min-w-0 max-w-full appearance-none rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-accent"
							/>
						</label>
						<label className="block min-w-0 space-y-2 text-sm text-slate-300">
							Bodyweight
							<input
								type="number"
								step="0.1"
								value={bodyweight}
								onChange={(event) => setBodyweight(event.target.value)}
								placeholder="kg"
								className="block w-full min-w-0 rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-accent"
							/>
						</label>
						<label className="block min-w-0 space-y-2 text-sm text-slate-300">
							Notes
							<input
								type="text"
								value={notes}
								onChange={(event) => setNotes(event.target.value)}
								placeholder="Optional session note"
								className="block w-full min-w-0 rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-accent"
							/>
						</label>
					</div>
				</section>

				<section className="space-y-4">
					{workoutExercises.map((exercise) => (
						<article
							key={exercise.id}
							className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div className="flex flex-wrap gap-2">
									<select
										value={exercise.name}
										onChange={(event) =>
											updateExerciseLift(
												exercise.id,
												event.target.value as SupportedLiftName,
											)
										}
										className="min-w-[160px] rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-accent"
									>
										{supportedLifts.map((lift) => (
											<option
												key={lift.name}
												value={lift.name}
												className="bg-slate-950 text-white"
											>
												{lift.name}
											</option>
										))}
									</select>
									<span className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-300">
										{exercise.category}
									</span>
								</div>
								<button
									type="button"
									onClick={() => deleteExercise(exercise.id)}
									className="rounded-3xl bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
								>
									Delete lift
								</button>
							</div>

							<div className="mt-4 space-y-4">
								{exercise.sets.length ? (
									<div className="overflow-x-auto">
										<table className="min-w-full text-left text-sm text-slate-300">
											<thead>
												<tr className="border-b border-slate-800 text-slate-500">
													<th className="px-3 py-2">Weight</th>
													<th className="px-3 py-2">Reps</th>
													{usesRepTracking(exercise.name) ? (
														<th className="px-3 py-2">Result</th>
													) : null}
													<th className="px-3 py-2">Action</th>
												</tr>
											</thead>
											<tbody>
												{exercise.sets.map((set) => (
													<tr key={set.id} className="border-b border-slate-800">
														<td className="min-w-[120px] px-3 py-2">
															<input
																type="number"
																value={set.weight}
																onChange={(event) =>
																	updateSet(
																		exercise.id,
																		set.id,
																		'weight',
																		event.target.value,
																	)
																}
																className="w-24 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent"
															/>
														</td>
														<td className="min-w-[120px] px-3 py-2">
															<input
																type="number"
																value={set.reps}
																onChange={(event) =>
																	updateSet(
																		exercise.id,
																		set.id,
																		'reps',
																		event.target.value,
																	)
																}
																className="w-24 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent"
															/>
														</td>
														{usesRepTracking(exercise.name) ? (
															<td className="px-3 py-2">
																<div className="flex min-w-max gap-2">
																	{normalizeAttempts(set).map((attempt) => {
																		const isMade = attempt.result === 'made';

																		return (
																			<button
																				key={attempt.rep_number}
																				type="button"
																				onClick={() =>
																					updateAttempt(
																						exercise.id,
																						set.id,
																						attempt.rep_number,
																					)
																				}
																				className={`h-11 min-w-12 rounded-2xl border px-3 text-sm font-bold transition ${
																					isMade
																						? 'border-green-500/60 bg-green-500/20 text-green-100'
																						: 'border-red-500/60 bg-red-500/20 text-red-100'
																				}`}
																				aria-label={`Rep ${attempt.rep_number} result`}
																			>
																				<span className="mr-1 text-xs">
																					{attempt.rep_number}
																				</span>
																				{isMade ? 'M' : 'X'}
																			</button>
																		);
																	})}
																</div>
															</td>
														) : null}
														<td className="px-3 py-2">
															<button
																type="button"
																onClick={() => deleteSet(exercise.id, set.id)}
																className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
															>
																Delete
															</button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<p className="rounded-3xl bg-slate-950/80 px-4 py-4 text-sm text-slate-400">
										No sets yet. Add the first set below.
									</p>
								)}

								<div className="grid gap-3 rounded-3xl border border-slate-700 bg-slate-950/80 p-4 sm:grid-cols-[1fr_1fr]">
									<input
										type="number"
										placeholder="Weight"
										value={setDrafts[exercise.id]?.weight ?? ''}
										onChange={(event) =>
											setSetDrafts((drafts) => ({
												...drafts,
												[exercise.id]: {
													...(drafts[exercise.id] || defaultSetDraft),
													weight: event.target.value,
												},
											}))
										}
										className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
									/>
									<input
										type="number"
										placeholder="Reps"
										value={setDrafts[exercise.id]?.reps ?? ''}
										onChange={(event) =>
											setSetDrafts((drafts) => ({
												...drafts,
												[exercise.id]: {
													...(drafts[exercise.id] || defaultSetDraft),
													reps: event.target.value,
												},
											}))
										}
										className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
									/>
									<button
										type="button"
										onClick={() => addSet(exercise.id)}
										className="col-span-full rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft"
									>
										Add set
									</button>
								</div>
							</div>
						</article>
					))}

					<div className="flex justify-center">
						<button
							type="button"
							onClick={addExercise}
							disabled={!nextAvailableLift}
							className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-3xl border border-slate-700 bg-slate-950/90 px-5 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:w-56"
						>
							<span className="text-xl leading-none text-accent">+</span>
							Add exercise
						</button>
					</div>
				</section>

				<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm uppercase tracking-[0.24em] text-muted">
								Updated summary
							</p>
							<h2 className="mt-2 text-xl font-semibold text-white">
								{editableTotal} kg total volume
							</h2>
						</div>
						<button
							type="button"
							onClick={saveWorkout}
							disabled={!workoutExercises.length || isSaving}
							className="inline-flex w-full items-center justify-center rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
						>
							{isSaving ? 'Saving...' : 'Save changes'}
						</button>
					</div>
				</section>
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
						<div className="flex gap-2">
							<button
								type="button"
								onClick={startEditing}
								className="inline-flex items-center justify-center rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft"
							>
								Edit
							</button>
							<button
								type="button"
								onClick={() => navigate('/history')}
								className="inline-flex items-center justify-center rounded-3xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
							>
								Back
							</button>
						</div>
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
