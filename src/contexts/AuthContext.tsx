import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
    const initialized = useRef(false);
    // Controla se a inicialização já terminou — impede race condition com o listener
    const initDone = useRef(false);

    /**
     * Limpeza total de estado local
     */
    const clearAuthState = useCallback(() => {
        setSession(null);
        setUser(null);
        setProfile(null);
    }, []);

    /**
     * Busca perfil do banco de dados de forma segura
     */
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('[Auth] Erro ao buscar perfil:', error.message);
                return null;
            }
            return data as Profile;
        } catch (err) {
            console.error('[Auth] Erro inesperado ao buscar perfil:', err);
            return null;
        }
    }, []);

    /**
     * Sincroniza o estado do React com os dados do Supabase.
     * Garante que user NUNCA seja undefined — sempre null ou User.
     */
    const syncAuthState = useCallback(async (currentSession: Session | null) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] SESSION:', currentSession);
            console.log('[Auth] USER:', currentSession?.user ?? null);
        }

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null; // nunca undefined
        setUser(currentUser);

        if (currentUser) {
            const p = await fetchProfile(currentUser.id);
            setProfile(p);

            // Se usuário estiver inativo, forçar logout
            if (p && !p.ativo) {
                console.warn('[Auth] Usuário inativo detectado. Forçando logout.');
                await supabase.auth.signOut();
                clearAuthState();
            }
        } else {
            setProfile(null);
        }
    }, [fetchProfile, clearAuthState]);

    /**
     * Efeito de inicialização e monitoramento global de sessão.
     * Garante que:
     * 1. getSession() → fonte primária (cache local, sem rede)
     * 2. getUser() → valida token no servidor
     * 3. loading só vira false UMA vez, no finally da initAuth
     * 4. onAuthStateChange NÃO interfere durante a inicialização
     */
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Auth] Evento detectado: ${event}`);
            }

            if (!initDone.current) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Auth] Evento ignorado durante inicialização inicial.');
                }
                return;
            }

            if (event === 'SIGNED_OUT') {
                clearAuthState();
            } else if (
                event === 'SIGNED_IN' ||
                event === 'TOKEN_REFRESHED' ||
                event === 'USER_UPDATED'
            ) {
                await syncAuthState(newSession);
            }
        });

        const initAuth = async () => {
            try {
                setLoading(true);

                // Passo 1: Recuperar sessão do cache local (rápido, sem rede)
                const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('[Auth] Erro ao recuperar sessão local:', sessionError.message);
                    clearAuthState();
                    return;
                }

                if (!currentSession) {
                    // Sem sessão — garantir user = null
                    if (process.env.NODE_ENV === 'development') {
                        console.log('[Auth] Nenhuma sessão ativa. user = null.');
                    }
                    clearAuthState();
                    return;
                }

                // Passo 2: Validar token no servidor (pode fazer refresh automático)
                const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();

                if (userError || !serverUser) {
                    // Token inválido ou expirado e não recuperável
                    console.warn('[Auth] Token inválido no servidor. Limpando sessão...');
                    await supabase.auth.signOut();
                    clearAuthState();
                    return;
                }

                // Passo 3: Sessão válida — buscar dados atualizados e sincronizar
                const { data: { session: freshSession } } = await supabase.auth.getSession();
                await syncAuthState(freshSession);

            } catch (err) {
                console.error('[Auth] Erro crítico na inicialização:', err);
                clearAuthState();
            } finally {
                initDone.current = true;
                setLoading(false);
            }
        };

        initAuth();

        return () => {
            subscription.unsubscribe();
        };
    }, [syncAuthState, clearAuthState]);

    const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth] Tentando login para:', email);
            }
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('[Auth] Erro no signInWithPassword:', error.message);
                return { error: error.message };
            }

            if (data.user) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Auth] Login bem-sucedido:', data.user.id);
                }
                await syncAuthState(data.session);

                const p = await fetchProfile(data.user.id);
                if (p && !p.ativo) {
                    console.warn('[Auth] Usuário desativado, deslogando...');
                    await supabase.auth.signOut();
                    clearAuthState();
                    return { error: 'Sua conta foi desativada. Entre em contato com o administrador.' };
                }
            }

            return { error: null };
        } catch (err: any) {
            console.error('[Auth] Erro crítico no login:', err);
            return { error: err.message || 'Erro inesperado ao entrar' };
        }
    };

    const signUp = async (email: string, password: string, nome: string): Promise<{ error: string | null }> => {
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) return { error: error.message };

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
                    console.error('[Auth] Erro ao criar perfil:', profileError);
                    return { error: 'Erro ao criar perfil. Tente novamente.' };
                }
            }
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Erro ao cadastrar' };
        }
    };

    /**
     * Logout: limpa estado LOCAL imediatamente (sem depender de user.id)
     * e depois chama o Supabase em background.
     */
    const signOut = async () => {
        // Limpar estado imediatamente — não aguardar resposta da rede
        clearAuthState();
        try {
            await supabase.auth.signOut();
        } catch (err) {
            // Estado já foi limpo acima — logout local já aconteceu
            console.error('[Auth] Erro ao notificar Supabase do logout (estado local já limpo):', err);
        }
    };

    const refreshProfile = useCallback(async () => {
        if (!user) return;
        const p = await fetchProfile(user.id);
        setProfile(p);
    }, [user, fetchProfile]);

    const updateProfile = (updates: Partial<Profile>) => {
        setProfile(prev => prev ? { ...prev, ...updates } : prev);
    };

    const isAdmin = profile?.perfil === 'administrador';
    // Usar user?.id garante que nunca é truthy com undefined
    const isAuthenticated = !!user?.id;

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
