import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Agendamento } from '@/modules/auth/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const useAgendamentos = () => {
    const { user, isAdmin } = useAuth();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Agendamentos públicos: carregados independentemente de login.
    // Não inclui 'user' ou 'isAdmin' como dependências para evitar re-fetch
    // ao restaurar sessão, e garantir exibição mesmo sem autenticação.
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

            setAgendamentos((data as Agendamento[]) || []);
        } catch (err: any) {
            console.error('Error fetching agendamentos:', err);
            setError(err.message || 'Erro ao carregar agendamentos');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Sem dependências de auth — a query é pública

    useEffect(() => {
        fetch();
    }, [fetch]);

    const criar = async (input: {
        data_inicial: string;
        data_final: string;
        tipo_agendamento: string;
        observacao?: string | null;
    }) => {
        if (!user) return { error: 'Não autenticado' };

        const start = new Date(input.data_inicial);
        const end = new Date(input.data_final);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (end < start) {
            return { error: 'Data final não pode ser anterior à data inicial' };
        }

        const dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        try {
            const { data, error: insertError } = await supabase
                .from('agendamentos')
                .insert({
                    user_id: user.id,
                    data_inicial: input.data_inicial,
                    data_final: input.data_final,
                    dias,
                    tipo_agendamento: input.tipo_agendamento,
                    observacao: input.observacao || null,
                    status: 'pendente',
                })
                .select(`
          *,
          profiles:user_id (
            id, nome, apelido, email, foto_url, cargo, matricula, perfil
          )
        `)
                .single();

            if (insertError) throw insertError;

            setAgendamentos(prev => [...prev, data as Agendamento].sort(
                (a, b) => new Date(a.data_inicial).getTime() - new Date(b.data_inicial).getTime()
            ));

            return { error: null, data };
        } catch (err: any) {
            console.error('Error creating agendamento:', err);
            return { error: err.message || 'Erro ao criar agendamento' };
        }
    };

    const atualizar = async (id: string, updates: Partial<Agendamento>) => {
        try {
            // Nova regra de negócio: Se o criador mudar as datas, status volta para pendente
            const { data: currentAg } = await supabase
                .from('agendamentos')
                .select('user_id, status, data_inicial, data_final')
                .eq('id', id)
                .single();

            let finalUpdates = { ...updates };

            if (currentAg && user) {
                const isOwner = currentAg.user_id === user.id;
                const isAdminUser = isAdmin; // isAdmin do hook auth

                // Se as datas mudaram
                const dateChanged = (updates.data_inicial && updates.data_inicial !== currentAg.data_inicial) ||
                    (updates.data_final && updates.data_final !== currentAg.data_final);

                if (dateChanged && isOwner && !isAdminUser) {
                    finalUpdates.status = 'pendente';
                }
            }

            // Injetar data de alteração do status se ele mudou e for aprovado/cancelado/recusado
            if (finalUpdates.status !== undefined && finalUpdates.status !== currentAg?.status) {
                const now = new Date().toISOString();
                if (finalUpdates.status === 'aprovado') {
                    finalUpdates.approved_at = now;
                } else if (finalUpdates.status === 'cancelado') {
                    finalUpdates.cancelled_at = now;
                } else if (finalUpdates.status === 'recusado') {
                    finalUpdates.rejected_at = now;
                }
            }

            const { data, error: updateError } = await supabase
                .from('agendamentos')
                .update(finalUpdates)
                .eq('id', id)
                .select(`
          *,
          profiles:user_id (
            id, nome, apelido, email, foto_url, cargo, matricula, perfil
          )
        `)
                .single();

            if (updateError) throw updateError;

            setAgendamentos(prev =>
                prev.map(a => a.id === id ? (data as Agendamento) : a)
            );

            return { error: null, data };
        } catch (err: any) {
            console.error('Error updating agendamento:', err);
            return { error: err.message || 'Erro ao atualizar agendamento' };
        }
    };

    const excluir = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('agendamentos')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setAgendamentos(prev => prev.filter(a => a.id !== id));
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting agendamento:', err);
            return { error: err.message || 'Erro ao excluir agendamento' };
        }
    };

    const alterarStatus = async (id: string, status: 'pendente' | 'aprovado' | 'recusado' | 'cancelado') => {
        const result = await atualizar(id, { status });
        if (result.error) {
            toast.error('Erro ao alterar status');
        } else {
            toast.success('Status alterado com sucesso!');
        }
        return result;
    };

    return {
        agendamentos,
        loading,
        error,
        refetch: fetch,
        criar,
        atualizar,
        excluir,
        alterarStatus,
    };
};
