export interface Profile {
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
}

export interface Agendamento {
    id: string;
    user_id: string;
    data_inicial: string;
    data_final: string;
    dias: number;
    tipo_agendamento: string;
    observacao: string | null;
    status: 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
    created_at: string;
    profiles?: Profile;
}

export type AgendamentoStatus = 'pendente' | 'aprovado' | 'recusado' | 'cancelado';
