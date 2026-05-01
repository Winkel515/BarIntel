import type {
	AttemptResult,
	Exercise,
	ExerciseSet,
	SetResult,
	Workout,
} from './types';
import {
	classicLiftNames,
	coreLiftNames,
	isSupportedLiftName,
	liftRatioPairs,
	supportedLiftNames,
	usesRepTracking,
	type CoreLiftName,
	type SupportedLiftName,
} from './supportedLifts';

const chartColors = [
	'#7c3aed',
	'#22c55e',
	'#38bdf8',
	'#f97316',
	'#eab308',
	'#ec4899',
];

type SupportedExercise = Exercise & { name: SupportedLiftName };
type ScoredAttempt = { result: SetResult };

export function createAttempts(reps: number) {
	return Array.from({ length: Math.max(1, reps) }, (_, index) => ({
		rep_number: index + 1,
		result: 'made' as AttemptResult,
	}));
}

export function normalizeAttempts(set: ExerciseSet) {
	const existing = set.attempts ?? [];
	return Array.from({ length: Math.max(1, set.reps) }, (_, index) => ({
		rep_number: index + 1,
		result: existing[index]?.result ?? 'made',
	}));
}

export function cycleAttemptResult(result: AttemptResult): AttemptResult {
	return result === 'made' ? 'missed' : 'made';
}

export function getAttemptSymbols(set: ExerciseSet) {
	return normalizeAttempts(set).map((attempt) =>
		attempt.result === 'made' ? '✓' : '✗',
	);
}

export function getSetSummary(exerciseName: string, set: ExerciseSet) {
	const results = usesRepTracking(exerciseName)
		? getAttemptSymbols(set).join(' ')
		: '';

	return results
		? `${set.weight}kg x ${set.reps} — ${results}`
		: `${set.weight}kg x ${set.reps}`;
}

function getMadeRepCount(exerciseName: string, set: ExerciseSet) {
	if (!usesRepTracking(exerciseName)) {
		return set.reps;
	}

	return normalizeAttempts(set).filter((attempt) => attempt.result === 'made')
		.length;
}

function hasMadeResult(exerciseName: string, set: ExerciseSet) {
	return getMadeRepCount(exerciseName, set) > 0;
}

function getScoredAttempts(
	exerciseName: string,
	set: ExerciseSet,
): ScoredAttempt[] {
	if (!usesRepTracking(exerciseName)) {
		return [{ result: 'made' }];
	}

	return normalizeAttempts(set).map((attempt) => ({
		result: attempt.result as SetResult,
	}));
}

function getSupportedExercises(workout: Workout): SupportedExercise[] {
	return workout.exercises.filter((exercise): exercise is SupportedExercise =>
		isSupportedLiftName(exercise.name),
	);
}

function getLiftSets(
	workouts: Workout[],
	liftNames: readonly SupportedLiftName[] = supportedLiftNames,
) {
	return workouts.flatMap((workout) =>
		getSupportedExercises(workout)
			.filter((exercise) => liftNames.includes(exercise.name))
			.flatMap((exercise) =>
				exercise.sets.map((set) => ({
					date: workout.date,
					exercise: exercise.name as SupportedLiftName,
					set,
				})),
			),
	);
}

export function getTopSet(workout: Workout) {
	const top = getSupportedExercises(workout)
		.flatMap((exercise) =>
			exercise.sets
				.filter((set) => hasMadeResult(exercise.name, set))
				.map((set) => ({
					exercise: exercise.name,
					set,
				})),
		)
		.sort((a, b) => b.set.weight - a.set.weight)[0];

	return top || null;
}

export function getPRs(workouts: Workout[]) {
	const best = Object.fromEntries(
		coreLiftNames.map((lift) => [lift, 0]),
	) as Record<CoreLiftName, number>;

	workouts.forEach((workout) => {
		getSupportedExercises(workout).forEach((exercise) => {
			if (!coreLiftNames.includes(exercise.name as CoreLiftName)) return;
			exercise.sets.forEach((set) => {
				const current = best[exercise.name as CoreLiftName] ?? 0;
				if (hasMadeResult(exercise.name, set) && set.weight > current) {
					best[exercise.name as CoreLiftName] = set.weight;
				}
			});
		});
	});

	return best;
}

export function getTotalVolume(workout: Workout) {
	return getSupportedExercises(workout).reduce((total, exercise) => {
		return (
			total +
			exercise.sets.reduce(
				(sum, set) => sum + set.weight * getMadeRepCount(exercise.name, set),
				0,
			)
		);
	}, 0);
}

export function getWeeklyVolume(workouts: Workout[]) {
	const now = new Date();
	const weekAgo = new Date(now);
	weekAgo.setDate(now.getDate() - 6);

	const daily: Record<string, Record<string, number>> = {};

	workouts.forEach((workout) => {
		const workoutDate = new Date(workout.date);
		if (workoutDate >= weekAgo && workoutDate <= now) {
			const day = workout.date;
			daily[day] ??= {};
			getSupportedExercises(workout).forEach((exercise) => {
				const volume = exercise.sets.reduce(
					(sum, set) => sum + set.weight * getMadeRepCount(exercise.name, set),
					0,
				);
				daily[day][exercise.name] = (daily[day][exercise.name] ?? 0) + volume;
			});
		}
	});

	const days: Record<string, number | string>[] = [];
	for (let i = 6; i >= 0; i -= 1) {
		const day = new Date(now);
		day.setDate(now.getDate() - i);
		const key = day.toISOString().slice(0, 10);
		days.push({
			date: key,
			...Object.fromEntries(
				supportedLiftNames.map((lift) => [lift, daily[key]?.[lift] ?? 0]),
			),
		} as Record<string, number | string>);
	}

	return days;
}

export function getSuccessRate(
	workouts: Workout[],
	liftNames: readonly SupportedLiftName[] = supportedLiftNames,
) {
	const attempts = getLiftSets(workouts, liftNames).flatMap((entry) =>
		getScoredAttempts(entry.exercise, entry.set),
	);

	if (!attempts.length) {
		return 0;
	}

	const made = attempts.filter((attempt) => attempt.result === 'made').length;
	return Math.round((made / attempts.length) * 100);
}

export function getDailySuccess(workouts: Workout[]) {
	const daily: Record<
		string,
		Record<string, { made: number; total: number }>
	> = {};

	workouts.forEach((workout) => {
		const date = workout.date;
		let hasClassic = false;

		getSupportedExercises(workout)
			.filter((exercise) => classicLiftNames.includes(exercise.name))
			.forEach((exercise) => {
				exercise.sets.forEach((set) => {
					const attempts = getScoredAttempts(exercise.name, set);
					const made = attempts.filter(
						(attempt) => attempt.result === 'made',
					).length;
					if (attempts.length > 0) {
						hasClassic = true;
						daily[date] ??= {};
						daily[date][exercise.name] ??= { made: 0, total: 0 };
						daily[date][exercise.name].made += made;
						daily[date][exercise.name].total += attempts.length;
					}
				});
			});

		if (!hasClassic) {
			delete daily[date];
		}
	});

	return Object.entries(daily)
		.map(([date, liftStats]) => ({
			date,
			...Object.fromEntries(
				classicLiftNames.map((lift) => {
					const stats = liftStats[lift];
					return [
						lift,
						stats?.total ? Math.round((stats.made / stats.total) * 100) : 0,
					];
				}),
			),
		}))
		.sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function getTopSetsByLift(workouts: Workout[]) {
	const rows = workouts
		.slice()
		.sort((a, b) => (a.date > b.date ? 1 : -1))
		.map((workout) => {
			const row: Record<string, number | string> = { date: workout.date };
			getSupportedExercises(workout).forEach((exercise) => {
				const top = exercise.sets.reduce(
					(max, set) =>
						hasMadeResult(exercise.name, set) ? Math.max(max, set.weight) : max,
					0,
				);
				if (top > 0) {
					row[exercise.name] = top;
				}
			});
			return row as { date: string } & Record<string, number>;
		});

	return { rows, lifts: supportedLiftNames };
}

export function getLiftRatios(workouts: Workout[]) {
	const prs = getPRs(workouts);
	const ratio = (numerator: number, denominator: number) =>
		numerator && denominator ? Math.round((numerator / denominator) * 100) : 0;

	return [
		...liftRatioPairs.map((pair) => ({
			label: `${pair.numerator} / ${pair.denominator}`,
			value: ratio(prs[pair.numerator], prs[pair.denominator]),
		})),
	];
}

export function getLiftChartColor(index: number) {
	return chartColors[index % chartColors.length];
}
