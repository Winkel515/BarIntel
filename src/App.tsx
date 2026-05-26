import { useEffect, useState } from 'react';
import {
	BrowserRouter,
	NavLink,
	Outlet,
	Route,
	Routes,
	Navigate,
} from 'react-router-dom';
import type { Workout } from './types';
import AuthProvider from './AuthProvider';
import { useAuth } from './auth-context';
import { createWorkout, listWorkouts, updateWorkout } from './data/workouts';
import Analysis from './pages/Analysis';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Logger from './pages/Logger';
import Login from './pages/Login';
import WorkoutDetail from './pages/WorkoutDetail';

const navItems = [
	{ label: 'Dashboard', path: '/' },
	{ label: 'Logger', path: '/logger' },
	{ label: 'Analysis', path: '/analysis' },
	{ label: 'History', path: '/history' },
];

function Layout() {
	const { user, signOut } = useAuth();

	return (
		<div className="min-h-screen bg-bg text-text">
			<header className="border-b border-slate-900/80 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.28em] text-muted">
							BarIntel
						</p>
						<h1 className="mt-1 text-2xl font-semibold text-white">
							Olympic weightlifting tracking
						</h1>
					</div>
					<nav className="hidden items-center gap-2 sm:flex">
						{navItems.map((item) => (
							<NavLink
								key={item.path}
								to={item.path}
								className={({ isActive }) =>
									`rounded-3xl px-4 py-2 text-sm font-medium transition ${
										isActive
											? 'bg-slate-800 text-white'
											: 'text-slate-400 hover:text-white'
									}`
								}
								end={item.path === '/'}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
					<p className="hidden max-w-[180px] truncate text-right text-sm text-slate-400 lg:block">
						{user?.email}
					</p>
					<button
						type="button"
						onClick={() => void signOut()}
						className="rounded-3xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
					>
						Logout
					</button>
				</div>
			</header>

			<Outlet />

			<nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-900/80 bg-slate-950/95 px-3 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
					{navItems.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							className={({ isActive }) =>
								`flex-1 rounded-3xl px-3 py-3 text-center text-xs font-semibold transition ${
									isActive
										? 'bg-slate-800 text-white'
										: 'text-slate-400 hover:text-white'
								}`
							}
							end={item.path === '/'}
						>
							{item.label}
						</NavLink>
					))}
				</div>
			</nav>
		</div>
	);
}

function ProtectedRoute() {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg px-4 text-sm text-slate-300">
				Loading your training log...
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
}

function AppRoutes() {
	const { user } = useAuth();
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [loadingWorkouts, setLoadingWorkouts] = useState(false);
	const [workoutError, setWorkoutError] = useState('');

	useEffect(() => {
		if (!user) {
			queueMicrotask(() => {
				setWorkouts([]);
				setWorkoutError('');
				setLoadingWorkouts(false);
			});
			return;
		}

		let active = true;
		queueMicrotask(() => {
			if (!active) return;
			setLoadingWorkouts(true);
			setWorkoutError('');
		});

		listWorkouts()
			.then((loadedWorkouts) => {
				if (!active) return;
				setWorkouts(loadedWorkouts);
			})
			.catch((error) => {
				if (!active) return;
				setWorkoutError(
					error instanceof Error ? error.message : 'Unable to load workouts.',
				);
			})
			.finally(() => {
				if (!active) return;
				setLoadingWorkouts(false);
			});

		return () => {
			active = false;
		};
	}, [user]);

	const handleSaveWorkout = async (workout: Workout) => {
		const savedWorkout = await createWorkout(workout);
		setWorkouts((current) => [savedWorkout, ...current]);
	};

	const handleUpdateWorkout = async (workout: Workout) => {
		const savedWorkout = await updateWorkout(workout);
		setWorkouts((current) =>
			current.map((item) => (item.id === savedWorkout.id ? savedWorkout : item)),
		);
	};

	return (
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route element={<ProtectedRoute />}>
				<Route path="/" element={<Layout />}>
					<Route
						index
						element={
							<Dashboard
								workouts={workouts}
								isLoading={loadingWorkouts}
								error={workoutError}
							/>
						}
					/>
					<Route
						path="logger"
						element={<Logger workouts={workouts} onSave={handleSaveWorkout} />}
					/>
					<Route path="analysis" element={<Analysis workouts={workouts} />} />
					<Route path="history" element={<History workouts={workouts} />} />
					<Route
						path="history/:id"
						element={
							<WorkoutDetail
								workouts={workouts}
								onUpdate={handleUpdateWorkout}
							/>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Route>
			</Route>
		</Routes>
	);
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<AppRoutes />
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
