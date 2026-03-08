import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Tipo genérico dos dados do perfil para o hook
export interface ProfileData {
    nome: string;
    apelido?: string | null;
    cargo?: string | null;
    matricula?: string | null;
    data_nascimento?: string | null;
    escala?: string | null;
}

interface UseProfileReturn {
    saving: boolean;
    saveProfile: (data: ProfileData) => Promise<{ error: string | null }>;
}

export function useProfile(): UseProfileReturn {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    const saveProfile = async (data: ProfileData): Promise<{ error: string | null }> => {
        if (!user) return { error: 'Usuário não autenticado' };

        setSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    nome: data.nome.trim(),
                    apelido: (data.apelido || '').trim() || null,
                    data_nascimento: data.data_nascimento || null,
                    cargo: (data.cargo || '').trim() || null,
                    matricula: (data.matricula || '').trim() || null,
                    escala: data.escala || null,
                })
                .eq('id', user.id);

            if (error) {
                console.error('[useProfile] Erro ao salvar perfil:', error);
                return { error: error.message || 'Erro ao salvar perfil' };
            }

            return { error: null };
        } catch (err: any) {
            console.error('[useProfile] Erro inesperado:', err);
            return { error: err?.message || 'Erro inesperado ao salvar perfil' };
        } finally {
            // Garante que loading SEMPRE seja finalizado, mesmo em caso de erro
            setSaving(false);
        }
    };

    return { saving, saveProfile };
}
