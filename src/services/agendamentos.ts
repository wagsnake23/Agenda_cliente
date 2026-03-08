import { supabase } from '@/lib/supabase';
import { Agendamento } from '@/modules/auth/types';

export const agendamentosService = {
    async getAll(filters?: {
        userId?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        from?: number;
        to?: number;
    }) {
        let query = supabase
            .from('agendamentos')
            .select(`
        *,
        profiles:user_id (
          id, nome, apelido, email, foto_url, cargo, matricula, perfil
        )
      `)
            .order('data_inicial', { ascending: true });

        if (filters?.userId) query = query.eq('user_id', filters.userId);
        if (filters?.startDate) query = query.gte('data_inicial', filters.startDate);
        if (filters?.endDate) query = query.lte('data_inicial', filters.endDate);
        if (filters?.status) query = query.eq('status', filters.status);

        if (filters?.from !== undefined && filters?.to !== undefined) {
            query = query.range(filters.from, filters.to);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Agendamento[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
        *,
        profiles:user_id (
          id, nome, apelido, email, foto_url, cargo, matricula, perfil
        )
      `)
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as Agendamento;
    },

    async create(payload: Partial<Agendamento>) {
        const { data, error } = await supabase
            .from('agendamentos')
            .insert(payload)
            .select(`
        *,
        profiles:user_id (
          id, nome, apelido, email, foto_url, cargo, matricula, perfil
        )
      `)
            .single();
        if (error) throw error;
        return data as Agendamento;
    },

    async update(id: string, updates: Partial<Agendamento>) {
        const { data, error } = await supabase
            .from('agendamentos')
            .update(updates)
            .eq('id', id)
            .select(`
        *,
        profiles:user_id (
          id, nome, apelido, email, foto_url, cargo, matricula, perfil
        )
      `)
            .single();
        if (error) throw error;
        return data as Agendamento;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
