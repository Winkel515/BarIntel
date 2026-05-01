import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth-context';

export default function Login() {
	const { user, signInWithGoogle, isConfigured } = useAuth();
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	if (user) {
		return <Navigate to="/" replace />;
	}

	const handleGoogleLogin = async () => {
		setError('');
		setLoading(true);
		try {
			await signInWithGoogle();
		} catch (authError) {
			setError(
				authError instanceof Error
					? authError.message
					: 'Unable to start Google sign in.',
			);
			setLoading(false);
		}
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-text">
			<section className="w-full max-w-md rounded-3xl border border-slate-800 bg-surface/90 p-6 shadow-xl shadow-black/20">
				<p className="text-sm uppercase tracking-[0.24em] text-muted">
					BarIntel
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-white">
					Sign in to your training log
				</h1>
				<p className="mt-3 text-sm leading-6 text-slate-400">
					Your workouts sync to your Supabase account and stay scoped to your
					login.
				</p>

				<button
					type="button"
					onClick={handleGoogleLogin}
					disabled={!isConfigured || loading}
					className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-blue-600">
						G
					</span>
					{loading ? 'Redirecting...' : 'Continue with Google'}
				</button>

				{!isConfigured ? (
					<p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
						Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your
						local env file to enable login.
					</p>
				) : null}

				{error ? (
					<p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
						{error}
					</p>
				) : null}
			</section>
		</main>
	);
}
