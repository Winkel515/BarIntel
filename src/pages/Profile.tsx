import { useState } from 'react';
import { useAuth } from '../auth-context';

export default function Profile() {
	const { user, signOut } = useAuth();
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleLogout = async () => {
		setError('');
		setLoading(true);
		try {
			await signOut();
		} catch (authError) {
			setError(
				authError instanceof Error ? authError.message : 'Unable to log out.',
			);
			setLoading(false);
		}
	};

	return (
		<main className="space-y-6 px-4 pb-16 pt-6 sm:px-6">
			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<p className="text-sm uppercase tracking-[0.24em] text-muted">
					Profile
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-white">Settings</h1>
			</section>

			<section className="rounded-3xl border border-slate-800 bg-surface/80 p-5 shadow-xl shadow-black/10">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm text-muted">Signed in as</p>
						<p className="mt-2 text-lg font-semibold text-white">
							{user?.email ?? 'Authenticated user'}
						</p>
					</div>
					<button
						type="button"
						onClick={handleLogout}
						disabled={loading}
						className="rounded-3xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Logging out...' : 'Logout'}
					</button>
				</div>

				{error ? (
					<p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
						{error}
					</p>
				) : null}
			</section>
		</main>
	);
}
