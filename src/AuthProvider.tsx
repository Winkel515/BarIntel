import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './auth-context';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export default function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(isSupabaseConfigured);

	useEffect(() => {
		if (!supabase) {
			return;
		}

		let active = true;

		const initAuth = async () => {
			const client = supabase;
			if (!client) return;
			const { data } = await client.auth.getSession();
			if (!active) return;
			setUser(data.session?.user ?? null);
			setLoading(false);
		};

		initAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
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
						redirectTo: window.location.origin,
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
		[loading, user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
