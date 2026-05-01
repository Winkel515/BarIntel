import { useEffect, useMemo, useState } from 'react';
import type { Exercise, Workout } from '../types';
import {
	getSupportedLift,
	supportedLifts,
	usesRepTracking,
	type SupportedLiftName,
} from '../supportedLifts';
import {
	createAttempts,
	cycleAttemptResult,
	getSetSummary,
	normalizeAttempts,
} from '../utils';

const defaultSetDraft = {
	weight: '',
	reps: '',
};

interface Props {
	onSave: (workout: Workout) => Promise<void>;
}

const today = new Date().toISOString().slice(0, 10);

const formatDateForDefault = (dateStr: string) => {
	const date = new Date(dateStr + 'T00:00:00Z');
	return date.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
};

const DRAFT_STORAGE_KEY = 'barintel_logger_draft';

interface DraftState {
	date: string;
	name: string;
	bodyweight: string;
	notes: string;
	workoutExercises: Exercise[];
	setDrafts: Record<string, typeof defaultSetDraft>;
}

const defaultDraftState = (): DraftState => ({
	date: today,
	name: `Workout — ${formatDateForDefault(today)}`,
	bodyweight: '',
	notes: '',
	workoutExercises: [],
	setDrafts: {},
});

const getInitialDraftState = (): DraftState => {
	const fallback = defaultDraftState();
	const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
	if (!stored) return fallback;

	try {
		const draft = JSON.parse(stored) as Partial<DraftState>;

		return {
			date: typeof draft.date === 'string' ? draft.date : fallback.date,
			name: typeof draft.name === 'string' ? draft.name : fallback.name,
			bodyweight:
				typeof draft.bodyweight === 'string'
					? draft.bodyweight
					: fallback.bodyweight,
			notes: typeof draft.notes === 'string' ? draft.notes : fallback.notes,
			workoutExercises: Array.isArray(draft.workoutExercises)
				? draft.workoutExercises
				: fallback.workoutExercises,
			setDrafts:
				draft.setDrafts && typeof draft.setDrafts === 'object'
					? draft.setDrafts
					: fallback.setDrafts,
		};
	} catch {
		return fallback;
	}
};

export default function Logger({ onSave }: Props) {
	const [initialDraft] = useState(getInitialDraftState);
	const [date, setDate] = useState(initialDraft.date);
	const [name, setName] = useState(initialDraft.name);
	const [bodyweight, setBodyweight] = useState(initialDraft.bodyweight);
	const [notes, setNotes] = useState(initialDraft.notes);
	const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>(
		initialDraft.workoutExercises,
	);
	const [setDrafts, setSetDrafts] = useState<
		Record<string, typeof defaultSetDraft>
	>(initialDraft.setDrafts);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState('');

	// Save draft to localStorage whenever it changes
	useEffect(() => {
		const draft: DraftState = {
			date,
			name,
			bodyweight,
			notes,
			workoutExercises,
			setDrafts,
		};
		localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
	}, [date, name, bodyweight, notes, workoutExercises, setDrafts]);

	const hasExercises = workoutExercises.length > 0;
	const nextAvailableLift = supportedLifts.find(
		(lift) => !workoutExercises.some((exercise) => exercise.name === lift.name),
	);
	const sessionTotal = useMemo(
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

	const addExercise = () => {
		const liftName = nextAvailableLift?.name;
		if (!liftName) return;
		if (workoutExercises.some((exercise) => exercise.name === liftName)) return;

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
							sets: exercise.sets.map((set) => {
								if (set.id !== setId) return set;

								return {
									...set,
									attempts: normalizeAttempts(set).map((attempt) =>
										attempt.rep_number !== repNumber
											? attempt
											: {
													...attempt,
													result: cycleAttemptResult(attempt.result),
												},
									),
								};
							}),
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

	const saveWorkout = async () => {
		if (!workoutExercises.length) return;
		setIsSaving(true);
		setSaveError('');
		try {
			await onSave({
				id: crypto.randomUUID(),
				name: name.trim() || undefined,
				date,
				bodyweight: bodyweight ? Number(bodyweight) : undefined,
				notes: notes.trim() || undefined,
				exercises: workoutExercises,
			});
			// Clear draft after successful save
			localStorage.removeItem(DRAFT_STORAGE_KEY);
			// Reset form
			setDate(today);
			setName(`Workout — ${formatDateForDefault(today)}`);
			setBodyweight('');
			setNotes('');
			setWorkoutExercises([]);
			setSetDrafts({});
		} catch (error) {
			setSaveError(
				error instanceof Error ? error.message : 'Unable to save workout.',
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<main className="space-y-6 px-4 pb-28 pt-6 sm:pb-16 sm:px-6">
			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Workout Logger
						</p>
						<h1 className="mt-2">
							<input
								type="text"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder={`Workout — ${formatDateForDefault(date)}`}
								aria-label="Workout name"
								className="-mx-1 block w-full min-w-0 rounded-lg bg-transparent px-1 text-3xl font-semibold text-white outline-none transition placeholder:text-slate-500 hover:bg-white/5 focus:bg-white/5"
							/>
						</h1>
					</div>
					<button
						type="button"
						onClick={saveWorkout}
						className="inline-flex items-center justify-center rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-40"
						disabled={!hasExercises || isSaving}
					>
						{isSaving ? 'Saving...' : 'Save workout'}
					</button>
				</div>
				{saveError ? (
					<p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
						{saveError}
					</p>
				) : null}

				<div className="mt-6 space-y-4">
					<div className="grid min-w-0 gap-4 sm:grid-cols-3">
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
				</div>
			</section>

			<section className="space-y-4">
				{workoutExercises.map((exercise) => (
					<div
						key={exercise.id}
						className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10"
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-2">
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
							</div>
							<div className="flex items-center gap-2 self-start">
								<span className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-300">
									{exercise.sets.length} sets
								</span>
								<button
									type="button"
									onClick={() => deleteExercise(exercise.id)}
									className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white transition hover:bg-white/10"
									aria-label={`Remove ${exercise.name}`}
									title="Remove exercise"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="h-4 w-4"
										aria-hidden="true"
									>
										<path d="M3 6h18" />
										<path d="M8 6V4h8v2" />
										<path d="M19 6l-1 14H6L5 6" />
										<path d="M10 11v5" />
										<path d="M14 11v5" />
									</svg>
								</button>
							</div>
						</div>

						<div className="mt-4 space-y-4">
							{exercise.sets.length ? (
								<div className="overflow-x-auto">
									<table className="min-w-full text-left text-sm text-slate-300">
										<thead>
											<tr className="border-b border-slate-800 text-slate-500">
												<th className="px-3 py-2">Set</th>
												{usesRepTracking(exercise.name) ? (
													<th className="px-3 py-2">Result</th>
												) : null}
												<th className="px-3 py-2">Action</th>
											</tr>
										</thead>
										<tbody>
											{exercise.sets.map((set) => (
												<tr key={set.id} className="border-b border-slate-800">
													<td className="min-w-[170px] px-3 py-2 font-medium text-white">
														{getSetSummary(exercise.name, set)}
													</td>
													{usesRepTracking(exercise.name) ? (
														<td className="px-3 py-2">
															<div className="flex min-w-max gap-2">
																{normalizeAttempts(set).map((attempt) => {
																	const resultClass =
																		attempt.result === 'made'
																			? 'border-green-500/60 bg-green-500/20 text-green-100'
																			: 'border-red-500/60 bg-red-500/20 text-red-100';
																	const symbol =
																		attempt.result === 'made' ? '✓' : '✗';

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
																			className={`h-12 min-w-14 rounded-2xl border px-4 text-base font-bold transition ${resultClass}`}
																			aria-label={`Rep ${attempt.rep_number} result`}
																		>
																			<span className="mr-1 text-xs">
																				{attempt.rep_number}
																			</span>
																			{symbol}
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
					</div>
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
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							Session summary
						</p>
						<h2 className="mt-2 text-xl font-semibold text-white">
							{hasExercises
								? `${sessionTotal} kg total volume`
								: 'Add lifts to start logging'}
						</h2>
					</div>
					<span className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-200">
						{workoutExercises.length} exercises
					</span>
				</div>
			</section>
		</main>
	);
}
