"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Agendamento } from '@/modules/auth/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastProvider';
import { dedupeById } from '@/utils/dedupeById';

interface AgendamentosContextType {
    agendamentos: Agendamento[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    criar: (input: { data_inicial: string; data_final: string; tipo_agendamento: string; observacao?: string | null }) => Promise<{ error: string | null; data?: any }>;
    atualizar: (id: string, updates: Partial<Agendamento>) => Promise<{ error: string | null; data?: any }>;
    excluir: (id: string) => Promise<{ error: string | null }>;
    alterarStatus: (id: string, status: 'pendente' | 'aprovado' | 'recusado' | 'cancelado') => Promise<{ error: string | null; data?: any }>;
    setAgendamentos: React.Dispatch<React.SetStateAction<Agendamento[]>>;
}

const AgendamentosContext = createContext<AgendamentosContextType | undefined>(undefined);

export const AgendamentosProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAdmin, checkSession } = useAuth();
    const { showSuccessToast, showErrorToast } = useToast();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('agendamentos')
                .select(`
                    *,
                    profiles:user_id (
                        id, nome, apelido, email, foto_url, cargo, matricula, perfil
                    )
                `)
                .order('data_inicial', { ascending: true });

            if (fetchError) throw fetchError;
            setAgendamentos(dedupeById((data as Agendamento[]) || []));
        } catch (err: any) {
            console.error('Error fetching agendamentos:', err);
            setError(err.message || 'Erro ao carregar agendamentos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    // REALTIME SYNC
    useEffect(() => {
        const channel = supabase.channel("agendamentos-realtime-global");

        async function handleChanges(payload: any) {
            if (payload.eventType === "DELETE") {
                setAgendamentos(prev => prev.filter(a => a.id !== payload.old.id));
                return;
            }

            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                const { data, error } = await supabase
                    .from("agendamentos")
                    .select(`
                        *,
                        profiles:user_id (
                            id, nome, apelido, email, foto_url, cargo, matricula, perfil
                        )
                    `)
                    .eq("id", payload.new.id)
                    .single();

                if (error || !data) return;

                if (payload.eventType === "INSERT") {
                    setAgendamentos(prev =>
                        dedupeById([...prev, data as Agendamento]).sort(
                            (a, b) => new Date(a.data_inicial).getTime() - new Date(b.data_inicial).getTime()
                        )
                    );
                }
                if (payload.eventType === "UPDATE") {
                    setAgendamentos(prev =>
                        dedupeById(prev.map(a => a.id === data.id ? (data as Agendamento) : a))
                    );
                }
            }
        }

        channel
            .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, handleChanges)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const criar = async (input: { data_inicial: string; data_final: string; tipo_agendamento: string; observacao?: string | null }) => {
        const isSessionValid = await checkSession();
        if (!isSessionValid || !user) return { error: 'Sua sessão expirou.' };
        const start = new Date(input.data_inicial);
        const end = new Date(input.data_final);
        start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
        if (end < start) return { error: 'Data final não pode ser anterior à data inicial' };
        const dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        try {
            const { data, error: insertError } = await supabase
                .from('agendamentos')
                .insert({
                    user_id: user.id, data_inicial: input.data_inicial, data_final: input.data_final,
                    dias, tipo_agendamento: input.tipo_agendamento, observacao: input.observacao || null,
                    status: 'pendente',
                })
                .select(`*, profiles:user_id (id, nome, apelido, email, foto_url, cargo, matricula, perfil)`)
                .single();
            if (insertError) throw insertError;
            return { error: null, data };
        } catch (err: any) {
            return { error: err.message || 'Erro ao criar agendamento' };
        }
    };

    const atualizar = async (id: string, updates: Partial<Agendamento>) => {
        const isSessionValid = await checkSession();
        if (!isSessionValid || !user) return { error: 'Sua sessão expirou.' };
        try {
            const { data: currentAg } = await supabase.from('agendamentos').select('user_id, status, data_inicial, data_final').eq('id', id).single();
            let finalUpdates = { ...updates };
            if (currentAg && user) {
                const dateChanged = (updates.data_inicial && updates.data_inicial !== currentAg.data_inicial) || (updates.data_final && updates.data_final !== currentAg.data_final);
                if (dateChanged && currentAg.user_id === user.id && !isAdmin) finalUpdates.status = 'pendente';
            }
            if (finalUpdates.status !== undefined && finalUpdates.status !== currentAg?.status) {
                const now = new Date().toISOString();
                if (finalUpdates.status === 'aprovado') finalUpdates.approved_at = now;
                else if (finalUpdates.status === 'cancelado') finalUpdates.cancelled_at = now;
                else if (finalUpdates.status === 'recusado') finalUpdates.rejected_at = now;
            }
            const { data, error: updateError } = await supabase.from('agendamentos').update(finalUpdates).eq('id', id).select(`*, profiles:user_id (id, nome, apelido, email, foto_url, cargo, matricula, perfil)`).single();
            if (updateError) throw updateError;
            return { error: null, data };
        } catch (err: any) {
            return { error: err.message || 'Erro ao atualizar agendamento' };
        }
    };

    const excluir = async (id: string) => {
        const isSessionValid = await checkSession();
        if (!isSessionValid || !user) return { error: 'Sua sessão expirou.' };
        try {
            const { error: deleteError } = await supabase.from('agendamentos').delete().eq('id', id);
            if (deleteError) throw deleteError;
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Erro ao excluir agendamento' };
        }
    };

    const alterarStatus = async (id: string, status: 'pendente' | 'aprovado' | 'recusado' | 'cancelado') => {
        const result = await atualizar(id, { status });
        if (result.error) showErrorToast('Erro ao alterar status');
        else showSuccessToast('Status alterado com sucesso!');
        return result;
    };

    return (
        <AgendamentosContext.Provider value={{ agendamentos, loading, error, refetch: fetch, criar, atualizar, excluir, alterarStatus, setAgendamentos }}>
            {children}
        </AgendamentosContext.Provider>
    );
};

export const useAgendamentosContext = () => {
    const context = useContext(AgendamentosContext);
    if (context === undefined) throw new Error('useAgendamentosContext must be used within an AgendamentosProvider');
    return context;
};
