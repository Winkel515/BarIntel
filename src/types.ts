export type SetResult = 'made' | 'missed';
export type AttemptResult = SetResult;

export type ExerciseCategory = 'classic' | 'strength' | 'variation';

export interface ExerciseSet {
	id: string;
	weight: number;
	reps: number;
	result: SetResult;
	attempts?: {
		rep_number: number;
		result: AttemptResult;
	}[];
}

export interface Exercise {
	id: string;
	name: string;
	category: ExerciseCategory;
	sets: ExerciseSet[];
}

export interface Workout {
	id: string;
	userId?: string;
	name?: string;
	date: string;
	bodyweight?: number;
	notes?: string;
	exercises: Exercise[];
}
