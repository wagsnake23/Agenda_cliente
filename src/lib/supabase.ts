import { createClient } from '@supabase/supabase-js';

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
                    apelido: string | null;
                    perfil: 'conferente' | 'administrador';
                    escala: string | null;
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
                    apelido?: string | null;
                    perfil?: 'conferente' | 'administrador';
                    escala?: string | null;
                    ativo?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    nome?: string;
                    email?: string;
                    data_nascimento?: string | null;
                    cargo?: string | null;
                    matricula?: string | null;
                    foto_url?: string | null;
                    apelido?: string | null;
                    perfil?: 'conferente' | 'administrador';
                    escala?: string | null;
                    ativo?: boolean;
                    created_at?: string;
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
                    approved_at: string | null;
                    cancelled_at: string | null;
                    rejected_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    data_inicial: string;
                    data_final: string;
                    dias: number;
                    tipo_agendamento: string;
                    observacao?: string | null;
                    status?: 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
                    created_at?: string;
                    approved_at?: string | null;
                    cancelled_at?: string | null;
                    rejected_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    data_inicial?: string;
                    data_final?: string;
                    dias?: number;
                    tipo_agendamento?: string;
                    observacao?: string | null;
                    status?: 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
                    created_at?: string;
                    approved_at?: string | null;
                    cancelled_at?: string | null;
                    rejected_at?: string | null;
                };
            };
            calendar_events: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    date: string;
                    type: string;
                    is_fixed: boolean;
                    is_active: boolean;
                    color_mode: string;
                    emoji: string | null;
                    created_at: string;
                    created_by: string | null;
                };
                Insert: {
                    id?: string;
                    title: string;
                    description?: string | null;
                    date: string;
                    type: string;
                    is_fixed?: boolean;
                    is_active?: boolean;
                    color_mode?: string;
                    emoji?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                };
                Update: {
                    id?: string;
                    title?: string;
                    description?: string | null;
                    date?: string;
                    type?: string;
                    is_fixed?: boolean;
                    is_active?: boolean;
                    color_mode?: string;
                    emoji?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                };
            };
        };
    };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
