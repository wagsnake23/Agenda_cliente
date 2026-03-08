import { supabase } from '@/lib/supabase';
import { Profile } from '@/modules/auth/types';

export const profilesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('nome', { ascending: true });
        if (error) throw error;
        return data as Profile[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as Profile;
    },

    async update(id: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();
        if (error) throw error;
        return data as Profile;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async adminCreateUser(payload: any) {
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
            body: payload
        });
        if (error) throw error;
        return data;
    },

    async adminDeleteUser(userId: string) {
        const { data, error } = await supabase.functions.invoke('admin-delete-user', {
            body: { userId }
        });
        if (error) throw error;
        return data;
    },

    async adminResetPassword(userId: string) {
        const { data, error } = await supabase.functions.invoke('reset-password', {
            body: { userId }
        });
        if (error) throw error;
        return data;
    }
};
