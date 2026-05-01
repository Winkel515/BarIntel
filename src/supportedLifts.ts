import type { ExerciseCategory } from './types';

export const supportedLifts = [
	{ name: 'Snatch', category: 'classic', core: true, tracking: 'rep' },
	{ name: 'C&J', category: 'classic', core: true, tracking: 'rep' },
	{ name: 'Front Squat', category: 'strength', core: true, tracking: 'set' },
	{ name: 'Back Squat', category: 'strength', core: true, tracking: 'set' },
	{ name: 'Clean', category: 'variation', core: false, tracking: 'rep' },
	{ name: 'Jerk', category: 'variation', core: false, tracking: 'rep' },
] as const satisfies ReadonlyArray<{
	name: string;
	category: ExerciseCategory;
	core: boolean;
	tracking: 'rep' | 'set';
}>;

export type SupportedLiftName = (typeof supportedLifts)[number]['name'];
export type CoreLiftName = Extract<
	(typeof supportedLifts)[number],
	{ core: true }
>['name'];

export const supportedLiftNames = supportedLifts.map(
	(lift) => lift.name,
) as SupportedLiftName[];

export const coreLiftNames = supportedLifts
	.filter((lift) => lift.core)
	.map((lift) => lift.name) as CoreLiftName[];

export const classicLiftNames = supportedLifts
	.filter((lift) => lift.category === 'classic')
	.map((lift) => lift.name) as SupportedLiftName[];

export const repTrackedLiftNames = supportedLifts
	.filter((lift) => lift.tracking === 'rep')
	.map((lift) => lift.name) as SupportedLiftName[];

export const liftRatioPairs = [
	{ numerator: 'Snatch', denominator: 'C&J' },
	{ numerator: 'C&J', denominator: 'Front Squat' },
	{ numerator: 'Front Squat', denominator: 'Back Squat' },
] as const satisfies ReadonlyArray<{
	numerator: CoreLiftName;
	denominator: CoreLiftName;
}>;

export function normalizeLiftName(name: string) {
	return name === 'Clean & Jerk' ? 'C&J' : name;
}

export function isSupportedLiftName(name: string): name is SupportedLiftName {
	return supportedLifts.some((lift) => lift.name === name);
}

export function getSupportedLift(name: SupportedLiftName) {
	return supportedLifts.find((lift) => lift.name === name)!;
}

export function usesRepTracking(name: string) {
	return isSupportedLiftName(name) && getSupportedLift(name).tracking === 'rep';
}
