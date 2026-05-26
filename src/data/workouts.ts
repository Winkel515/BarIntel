import type { Exercise, Workout } from '../types';
import { supabase } from '../lib/supabase';
import { normalizeLiftName } from '../supportedLifts';

interface WorkoutRow {
	id: string;
	user_id: string;
	name: string | null;
	date: string;
	bodyweight: number | null;
	notes: string | null;
	exercises: unknown;
}

function toWorkout(row: WorkoutRow): Workout {
	const exercises = Array.isArray(row.exercises)
		? (row.exercises as Exercise[]).map((exercise) => ({
				...exercise,
				name: normalizeLiftName(exercise.name),
			}))
		: [];

	return {
		id: row.id,
		userId: row.user_id,
		name: row.name ?? undefined,
		date: row.date,
		bodyweight: row.bodyweight ?? undefined,
		notes: row.notes ?? undefined,
		exercises,
	};
}

export async function listWorkouts(): Promise<Workout[]> {
	if (!supabase) return [];

	const { data, error } = await supabase
		.from('workouts')
		.select('id,user_id,name,date,bodyweight,notes,exercises')
		.order('date', { ascending: false })
		.order('created_at', { ascending: false });

	if (error) throw error;
	return (data ?? []).map((row) => toWorkout(row as WorkoutRow));
}

export async function createWorkout(workout: Workout): Promise<Workout> {
	if (!supabase) {
		throw new Error('Supabase is not configured.');
	}

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError) throw userError;
	if (!user) throw new Error('You must be signed in to save workouts.');

	const { data, error } = await supabase
		.from('workouts')
		.insert({
			id: workout.id,
			user_id: user.id,
			name: workout.name ?? null,
			date: workout.date,
			bodyweight: workout.bodyweight ?? null,
			notes: workout.notes ?? null,
			exercises: workout.exercises,
		})
		.select('id,user_id,name,date,bodyweight,notes,exercises')
		.single();

	if (error) throw error;
	return toWorkout(data as WorkoutRow);
}

export async function updateWorkout(workout: Workout): Promise<Workout> {
	if (!supabase) {
		throw new Error('Supabase is not configured.');
	}

	const { data, error } = await supabase
		.from('workouts')
		.update({
			name: workout.name ?? null,
			date: workout.date,
			bodyweight: workout.bodyweight ?? null,
			notes: workout.notes ?? null,
			exercises: workout.exercises,
		})
		.eq('id', workout.id)
		.select('id,user_id,name,date,bodyweight,notes,exercises')
		.single();

	if (error) throw error;
	return toWorkout(data as WorkoutRow);
}
