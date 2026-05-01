import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './auth-context';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const isLocalOrPrivateHost = (hostname: string) =>
	hostname === 'localhost' ||
	hostname === '127.0.0.1' ||
	hostname === '[::1]' ||
	hostname.startsWith('192.168.') ||
	hostname.startsWith('10.') ||
	/^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

const getAuthRedirectUrl = () => {
	if (import.meta.env.DEV || isLocalOrPrivateHost(window.location.hostname)) {
		return window.location.origin;
	}

	return import.meta.env.VITE_APP_URL || window.location.origin;
};

export default function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(isSupabaseConfigured);

	useEffect(() => {
		if (!supabase) return;

		const client = supabase; // ✅ fixes TS null issue
		let active = true;

		const initAuth = async () => {
			const { data, error } = await client.auth.getSession();

			if (!active) return;

			if (error) {
				console.error('Failed to get auth session:', error);
			}

			setUser(data.session?.user ?? null);
			setLoading(false);
		};

		initAuth();

		const {
			data: { subscription },
		} = client.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
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
			isConfigured: isSupabaseConfigured,

			signInWithGoogle: async () => {
				if (!supabase) return;

				const { error } = await supabase.auth.signInWithOAuth({
					provider: 'google',
					options: {
						redirectTo: getAuthRedirectUrl(),
					},
				});

				if (error) throw error;
			},

			signOut: async () => {
				if (!supabase) return;

				const { error } = await supabase.auth.signOut();
				if (error) throw error;
			},
		}),
		[user, loading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
