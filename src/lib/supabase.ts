import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    nome: string;
                    email: string;
                    data_nascimento: string | null;
                    cargo: string | null;
                    matricula: string | null;
                    foto_url: string | null;
                    perfil: 'conferente' | 'administrador';
                    ativo: boolean;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    nome: string;
                    email: string;
                    data_nascimento?: string | null;
                    cargo?: string | null;
                    matricula?: string | null;
                    foto_url?: string | null;
                    perfil?: 'conferente' | 'administrador';
                    ativo?: boolean;
                };
                Update: {
                    nome?: string;
                    email?: string;
                    data_nascimento?: string | null;
                    cargo?: string | null;
                    matricula?: string | null;
                    foto_url?: string | null;
                    perfil?: 'conferente' | 'administrador';
                    ativo?: boolean;
                };
            };
            agendamentos: {
                Row: {
                    id: string;
                    user_id: string;
                    data_inicial: string;
                    data_final: string;
                    dias: number;
                    tipo_agendamento: string;
                    observacao: string | null;
                    status: 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    data_inicial: string;
                    data_final: string;
                    dias: number;
                    tipo_agendamento: string;
                    observacao?: string | null;
                    status?: 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
                };
                Update: {
                    data_inicial?: string;
                    data_final?: string;
                    dias?: number;
                    tipo_agendamento?: string;
                    observacao?: string | null;
                    status?: 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
                };
            };
        };
    };
};
