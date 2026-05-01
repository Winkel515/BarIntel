import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailySessionQuality } from '../utils';

interface Props {
	dailyData: DailySessionQuality[];
}

interface HeatmapDay {
	date: string;
	data?: DailySessionQuality;
	isSpacer?: boolean;
}

const rangeDays = 365;
const cellSize = '0.75rem';
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const emptyCellStyle = {
	backgroundColor: 'rgba(15, 23, 42, 0.7)',
	borderColor: 'rgba(30, 41, 59, 0.95)',
};

function getLocalDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
	return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function getRangeDays(dailyData: DailySessionQuality[]): HeatmapDay[] {
	const dataByDate = new Map(dailyData.map((day) => [day.date, day]));
	const today = new Date();

	const days = Array.from({ length: rangeDays }, (_, index) => {
		const date = new Date(today);
		date.setDate(today.getDate() - (rangeDays - 1 - index));
		const key = getLocalDateKey(date);

		return {
			date: key,
			data: dataByDate.get(key),
		};
	});

	if (!days.length) return days;

	const firstDate = new Date(`${days[0].date}T00:00:00`);
	const mondayOffset = (firstDate.getDay() + 6) % 7;
	const spacers = Array.from({ length: mondayOffset }, (_, index) => ({
		date: `spacer-${index}`,
		isSpacer: true,
	}));

	return [...spacers, ...days];
}

function getWeekColumnCount(days: HeatmapDay[]) {
	return Math.max(1, Math.ceil(days.length / 7));
}

function getGradientChannel(start: number, end: number, progress: number) {
	return Math.round(start + (end - start) * progress);
}

function getCellStyle(day?: DailySessionQuality) {
	if (!day) {
		return emptyCellStyle;
	}

	const progress = Math.max(0, Math.min(1, day.score / 100));
	const start = [88, 28, 135];
	const end = [34, 211, 238];
	const red = getGradientChannel(start[0], end[0], progress);
	const green = getGradientChannel(start[1], end[1], progress);
	const blue = getGradientChannel(start[2], end[2], progress);

	return {
		backgroundColor: `rgba(${red}, ${green}, ${blue}, ${0.28 + progress * 0.58})`,
		borderColor: `rgba(${red}, ${green}, ${blue}, ${0.32 + progress * 0.38})`,
		boxShadow:
			day.score >= 75
				? `0 0 14px rgba(${red}, ${green}, ${blue}, 0.22)`
				: undefined,
	};
}

function getCellTitle(day: HeatmapDay) {
	if (day.isSpacer) return '';
	if (!day.data) return `${formatDate(day.date)}: no training`;

	return `${formatDate(day.date)}: ${day.data.score} quality, ${
		day.data.successfulReps
	}/${day.data.totalReps} reps`;
}

function DetailModal({
	day,
	onClose,
}: {
	day: DailySessionQuality;
	onClose: () => void;
}) {
	return (
		<div
			className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center"
			role="dialog"
			aria-modal="true"
			aria-label={`Session quality for ${formatDate(day.date)}`}
			onClick={onClose}
		>
			<div
				className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-2xl shadow-black/50"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-muted">
							{formatDate(day.date)}
						</p>
						<p className="mt-2 text-3xl font-semibold text-white">
							{day.score}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white transition hover:bg-white/20"
						aria-label="Close session details"
					>
						X
					</button>
				</div>

				<div className="mt-5 grid gap-3 sm:grid-cols-2">
					<div className="rounded-2xl bg-white/5 p-3">
						<p className="text-xs uppercase tracking-[0.18em] text-slate-500">
							Hit rate
						</p>
						<p className="mt-1 text-lg font-semibold text-white">
							{Math.round(day.hitRate * 100)}%
						</p>
					</div>
					<div className="rounded-2xl bg-white/5 p-3">
						<p className="text-xs uppercase tracking-[0.18em] text-slate-500">
							Avg intensity
						</p>
						<p className="mt-1 text-lg font-semibold text-white">
							{Math.round(day.avgIntensity * 100)}%
						</p>
					</div>
					<div className="rounded-2xl bg-white/5 p-3">
						<p className="text-xs uppercase tracking-[0.18em] text-slate-500">
							Total reps
						</p>
						<p className="mt-1 text-lg font-semibold text-white">
							{day.totalReps}
						</p>
					</div>
					<div className="rounded-2xl bg-white/5 p-3">
						<p className="text-xs uppercase tracking-[0.18em] text-slate-500">
							Successful reps
						</p>
						<p className="mt-1 text-lg font-semibold text-white">
							{day.successfulReps}
						</p>
					</div>
				</div>

				<div className="mt-4 rounded-2xl bg-white/5 p-3">
					<p className="text-xs uppercase tracking-[0.18em] text-slate-500">
						Lifts
					</p>
					<p className="mt-2 text-sm text-slate-200">
						{day.lifts.length ? day.lifts.join(', ') : 'None'}
					</p>
				</div>
			</div>
		</div>
	);
}

function HoverPreview({ day }: { day: HeatmapDay }) {
	return (
		<div className="pointer-events-none absolute right-0 top-0 z-10 hidden w-64 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur md:block">
			<p className="text-xs uppercase tracking-[0.18em] text-slate-500">
				{formatDate(day.date)}
			</p>
			{day.data ? (
				<>
					<div className="mt-3 flex items-baseline justify-between gap-3">
						<p className="text-2xl font-semibold text-white">
							{day.data.score}
						</p>
						<p className="text-xs uppercase tracking-[0.16em] text-slate-500">
							Quality
						</p>
					</div>
					<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
						<div className="rounded-xl bg-white/5 p-2">
							<p className="text-xs text-slate-500">Hit rate</p>
							<p className="mt-1 font-semibold text-white">
								{Math.round(day.data.hitRate * 100)}%
							</p>
						</div>
						<div className="rounded-xl bg-white/5 p-2">
							<p className="text-xs text-slate-500">Intensity</p>
							<p className="mt-1 font-semibold text-white">
								{Math.round(day.data.avgIntensity * 100)}%
							</p>
						</div>
					</div>
					<p className="mt-3 text-sm text-slate-300">
						{day.data.successfulReps}/{day.data.totalReps} successful reps
					</p>
					<p className="mt-1 truncate text-xs text-slate-500">
						{day.data.lifts.join(', ')}
					</p>
				</>
			) : (
				<p className="mt-3 text-sm text-slate-400">No training logged.</p>
			)}
		</div>
	);
}

export default function SessionQualityHeatmap({ dailyData }: Props) {
	const [selectedDay, setSelectedDay] = useState<DailySessionQuality | null>(
		null,
	);
	const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const days = useMemo(() => getRangeDays(dailyData), [dailyData]);
	const weekColumnCount = useMemo(() => getWeekColumnCount(days), [days]);
	const mobileGridStyle = {
		gridTemplateColumns: `repeat(${weekColumnCount}, ${cellSize})`,
		gridTemplateRows: `repeat(7, ${cellSize})`,
	};
	const desktopGridStyle = {
		gridTemplateColumns: `repeat(${weekColumnCount}, minmax(0, 1fr))`,
		gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
	};
	const mobileWeekdayStyle = {
		gridTemplateRows: `repeat(7, ${cellSize})`,
	};

	useEffect(() => {
		const scroller = scrollRef.current;
		if (!scroller) return;

		requestAnimationFrame(() => {
			scroller.scrollLeft = scroller.scrollWidth;
		});
	}, [days]);

	return (
		<div className="relative min-w-0">
			{hoveredDay && !hoveredDay.isSpacer ? (
				<HoverPreview day={hoveredDay} />
			) : null}

			<div className="flex min-w-0 items-start gap-2 md:hidden">
				<div
					className="grid gap-1 pt-px text-right text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:gap-1.5"
					style={mobileWeekdayStyle}
				>
					{weekdayLabels.map((label) => (
						<span
							key={label}
							className="flex items-center justify-end"
						>
							{label.slice(0, 1)}
						</span>
					))}
				</div>
				<div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto pb-2">
					<div
						className="grid grid-flow-col gap-1 sm:gap-1.5"
						style={mobileGridStyle}
					>
						{days.map((day) => {
							if (day.isSpacer) {
								return <span key={day.date} className="h-3 w-3" />;
							}

							const className = `h-3 w-3 border transition ${
								day.data
									? 'cursor-pointer hover:scale-105 hover:border-white/50'
									: 'cursor-default'
							} rounded-[4px]`;
							const style = getCellStyle(day.data);

							return (
								<button
									key={day.date}
									type="button"
									onClick={() => {
										if (day.data) {
											setSelectedDay(day.data);
										}
									}}
									className={className}
									style={style}
									aria-label={getCellTitle(day)}
									title={getCellTitle(day)}
									onFocus={() => setHoveredDay(day)}
									onBlur={() => setHoveredDay(null)}
								/>
							);
						})}
					</div>
				</div>
			</div>

			<div className="hidden min-w-0 items-start gap-2 md:flex">
				<div className="grid grid-rows-7 gap-1.5 pt-px text-right text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
					{weekdayLabels.map((label) => (
						<span
							key={label}
							className="flex aspect-square items-center justify-end"
						>
							{label.slice(0, 1)}
						</span>
					))}
				</div>
				<div className="min-w-0 flex-1">
					<div
						className="grid grid-flow-col gap-1.5"
						style={desktopGridStyle}
					>
						{days.map((day) => {
							if (day.isSpacer) {
								return <span key={day.date} className="aspect-square w-full" />;
							}

							const className = `aspect-square w-full border transition ${
								day.data
									? 'cursor-pointer hover:scale-105 hover:border-white/50'
									: 'cursor-default'
							} rounded-[4px]`;
							const style = getCellStyle(day.data);

							return (
								<button
									key={day.date}
									type="button"
									onClick={() => {
										if (day.data) {
											setSelectedDay(day.data);
										}
									}}
									className={className}
									style={style}
									aria-label={getCellTitle(day)}
									title={getCellTitle(day)}
									onMouseEnter={() => setHoveredDay(day)}
									onMouseLeave={() => setHoveredDay(null)}
									onFocus={() => setHoveredDay(day)}
									onBlur={() => setHoveredDay(null)}
								/>
							);
						})}
					</div>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
				<span>No training</span>
				<div className="h-3 w-8 rounded border" style={emptyCellStyle} />
				<span>Lower</span>
				{[25, 50, 75, 100].map((score) => (
					<div
						key={score}
						className="h-3 w-8 rounded border"
						style={getCellStyle({
							date: '',
							score,
							hitRate: 0,
							avgIntensity: 0,
							totalReps: 1,
							successfulReps: 0,
							lifts: [],
						})}
					/>
				))}
				<span>Higher</span>
			</div>

			{selectedDay ? (
				<DetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />
			) : null}
		</div>
	);
}
