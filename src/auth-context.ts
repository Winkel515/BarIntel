import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthContextValue {
	user: User | null;
	loading: boolean;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
	isConfigured: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
	undefined,
);

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used inside AuthProvider');
	}
	return context;
}
