import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/modules/auth/types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, nome: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => void;
    isAdmin: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            return data as Profile;
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
            return null;
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!user) return;
        const p = await fetchProfile(user.id);
        setProfile(p);
    }, [user, fetchProfile]);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (!mounted) return;

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                const p = await fetchProfile(currentSession.user.id);
                if (mounted) setProfile(p);
            }

            setLoading(false);
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (!mounted) return;

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
                const p = await fetchProfile(newSession.user.id);
                if (mounted) setProfile(p);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return { error: error.message };
        }

        if (data.user) {
            // Verificar se o usuário está ativo
            const p = await fetchProfile(data.user.id);
            if (p && !p.ativo) {
                await supabase.auth.signOut();
                return { error: 'Sua conta foi desativada. Entre em contato com o administrador.' };
            }
        }

        return { error: null };
    };

    const signUp = async (email: string, password: string, nome: string): Promise<{ error: string | null }> => {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            return { error: error.message };
        }

        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    nome,
                    email,
                    perfil: 'conferente',
                    ativo: true,
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
                return { error: 'Erro ao criar perfil. Tente novamente.' };
            }
        }

        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    // Atualização otimista do profile local (sem refetch)
    const updateProfile = (updates: Partial<Profile>) => {
        setProfile(prev => prev ? { ...prev, ...updates } : prev);
    };

    const isAdmin = profile?.perfil === 'administrador';
    const isAuthenticated = !!session && !!user;

    return (
        <AuthContext.Provider value={{
            session,
            user,
            profile,
            loading,
            signIn,
            signUp,
            signOut,
            refreshProfile,
            updateProfile,
            isAdmin,
            isAuthenticated,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
};
