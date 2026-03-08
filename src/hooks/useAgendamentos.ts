import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Agendamento } from '@/modules/auth/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastProvider';
import { dedupeById } from '@/utils/dedupeById';
import { agendamentosService } from '@/services/agendamentos';

export const useAgendamentos = (filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}) => {
    const { user } = useAuth();
    const { showSuccessToast, showErrorToast } = useToast();
    const queryClient = useQueryClient();

    const pageSize = filters?.pageSize || 50;
    const page = filters?.page || 0;

    // Query para buscar agendamentos
    const {
        data: agendamentos = [],
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['agendamentos', filters],
        queryFn: async () => {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const data = await agendamentosService.getAll({
                ...filters,
                from,
                to
            });

            return dedupeById(data || []);
        },
    });

    // Mutação para criar
    const createMutation = useMutation({
        mutationFn: async (input: {
            data_inicial: string;
            data_final: string;
            tipo_agendamento: string;
            observacao?: string | null;
        }) => {
            if (!user) throw new Error('Não autenticado');

            const start = new Date(input.data_inicial);
            const end = new Date(input.data_final);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            const dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            return await agendamentosService.create({
                user_id: user.id,
                data_inicial: input.data_inicial,
                data_final: input.data_final,
                dias,
                tipo_agendamento: input.tipo_agendamento,
                observacao: input.observacao || null,
                status: 'pendente',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
            showSuccessToast('Agendamento criado com sucesso!');
        },
        onError: (err: any) => {
            showErrorToast(err.message || 'Erro ao criar agendamento');
        },
    });

    // Mutação para atualizar
    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Agendamento> }) => {
            // Nota: As datas (approved_at, etc) agora são gerenciadas por Triggers no DB.
            // O frontend envia apenas o status.
            return await agendamentosService.update(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
        },
        onError: (err: any) => {
            showErrorToast(err.message || 'Erro ao atualizar agendamento');
        },
    });

    // Mutação para excluir
    const deleteMutation = useMutation({
        mutationFn: (id: string) => agendamentosService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
            showSuccessToast('Agendamento excluído com sucesso!');
        },
        onError: (err: any) => {
            showErrorToast(err.message || 'Erro ao excluir agendamento');
        },
    });

    return {
        agendamentos,
        loading,
        error: error ? (error as any).message : null,
        refetch,
        criar: createMutation.mutateAsync,
        atualizar: updateMutation.mutateAsync,
        excluir: deleteMutation.mutateAsync,
        alterarStatus: (id: string, status: Agendamento['status']) =>
            updateMutation.mutateAsync({ id, updates: { status } }),
    };
};
