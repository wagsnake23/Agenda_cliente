import React from 'react';
import { Loader2, Trash2, Edit2, User, HelpCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/modules/auth/types';
import { STATUS_STYLES } from '@/constants/labels';

interface AgendamentoListProps {
    agendamentos: Agendamento[];
    loading: boolean;
    isAdmin: boolean;
    currentUserId?: string;
    onEdit: (ag: Agendamento) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: Agendamento['status']) => void;
    updatingStatusId: string | null;
}

const AgendamentoList: React.FC<AgendamentoListProps> = ({
    agendamentos,
    loading,
    isAdmin,
    currentUserId,
    onEdit,
    onDelete,
    onUpdateStatus,
    updatingStatusId
}) => {
    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'dd MMM yyyy', { locale: ptBR });
        } catch {
            return dateStr;
        }
    };

    if (loading && agendamentos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Carregando agendamentos...</p>
            </div>
        );
    }

    if (agendamentos.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 flex flex-col items-center text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <HelpCircle size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nenhum agendamento encontrado</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Experimente mudar os filtros de busca.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {agendamentos.map((ag) => {
                const isOwner = currentUserId === ag.user_id;
                const canEdit = isOwner && ag.status === 'pendente';
                const canDelete = isOwner || isAdmin;

                return (
                    <div key={ag.id} className="group relative bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden min-w-[3rem]">
                                    {ag.profiles?.foto_url ? (
                                        <img src={ag.profiles.foto_url} alt={ag.profiles.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-blue-600" size={24} />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-sm sm:text-base tracking-tight leading-tight truncate max-w-[150px]">
                                        {ag.profiles?.nome || 'Usuário'}
                                    </h4>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-none mt-1">
                                        {ag.profiles?.cargo || 'Membro'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${STATUS_STYLES[ag.status]?.className || ''}`}>
                                    {STATUS_STYLES[ag.status]?.label || ag.status}
                                </span>
                                {updatingStatusId === ag.id && (
                                    <Loader2 className="w-3 h-3 text-slate-400 animate-spin mt-1" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                    <span className="text-sm font-black ring-0 select-none">📅</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none mb-1">Período</p>
                                    <p className="text-slate-700 text-xs font-black tracking-tight leading-none uppercase">
                                        {formatDate(ag.data_inicial)} a {formatDate(ag.data_final)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none mb-1">Dias</p>
                                    <p className="text-blue-600 text-sm font-black tracking-tight leading-none">{ag.dias} D</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <span className="text-sm font-black ring-0 select-none">📑</span>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none mb-1">Tipo</p>
                                    <p className="text-slate-700 text-xs font-bold leading-none uppercase">{ag.tipo_agendamento}</p>
                                </div>
                            </div>

                            {ag.observacao && (
                                <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 italic">Observações</p>
                                    <p className="text-slate-600 text-[11px] font-medium leading-tight line-clamp-2 italic">
                                        "{ag.observacao}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                            {isAdmin && ag.status === 'pendente' && (
                                <>
                                    <button
                                        onClick={() => onUpdateStatus(ag.id, 'aprovado')}
                                        className="flex-1 h-9 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_3px_0_#166534] hover:bg-green-700 active:translate-y-[1px] active:shadow-none transition-all"
                                    >
                                        Aprovar
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(ag.id, 'recusado')}
                                        className="flex-1 h-9 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_3px_0_#991B1B] hover:bg-red-700 active:translate-y-[1px] active:shadow-none transition-all"
                                    >
                                        Recusar
                                    </button>
                                </>
                            )}

                            {!isAdmin && ag.status === 'pendente' && isOwner && (
                                <p className="flex-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest italic ml-1">
                                    Aguardando revisão administrativa
                                </p>
                            )}

                            <div className={`flex gap-2 ${isAdmin ? 'ml-auto' : 'w-full justify-end'}`}>
                                {canEdit && (
                                    <button
                                        onClick={() => onEdit(ag)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition-all shadow-sm"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => onDelete(ag.id)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AgendamentoList;
