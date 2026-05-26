import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './auth-context';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const getAuthRedirectUrl = () => window.location.origin;

export default function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(isSupabaseConfigured);
	const [authError, setAuthError] = useState('');

	useEffect(() => {
		if (!supabase) return;

		const client = supabase;
		let active = true;

		const initAuth = async () => {
			const { data, error } = await client.auth.getSession();

			if (!active) return;

			if (error) {
				console.error('Failed to get auth session:', error);
				await client.auth.signOut({ scope: 'local' });
				if (!active) return;
				setAuthError('Your saved login expired. Please sign in again.');
				setUser(null);
				setLoading(false);
				return;
			}

			setUser(data.session?.user ?? null);
			setLoading(false);
		};

		initAuth();

		const {
			data: { subscription },
		} = client.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			if (session) {
				setAuthError('');
			}
			setLoading(false);
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			loading,
			authError,
			isConfigured: isSupabaseConfigured,

			signInWithGoogle: async () => {
				if (!supabase) return;

				setAuthError('');
				const { error } = await supabase.auth.signInWithOAuth({
					provider: 'google',
					options: {
						redirectTo: getAuthRedirectUrl(),
					},
				});

				if (error) {
					setAuthError(error.message);
					throw error;
				}
			},

			signOut: async () => {
				if (!supabase) return;

				const { error } = await supabase.auth.signOut();
				if (error) {
					setAuthError(error.message);
					throw error;
				}
				setAuthError('');
			},
		}),
		[user, loading, authError],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
