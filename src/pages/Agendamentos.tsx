"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Loader2, Filter, Trash2, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, User, Edit2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { Agendamento } from '@/modules/auth/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DrawerAgendamento, { Agendamento as DrawerAgendamentoType } from '@/components/calendar/DrawerAgendamento';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    pendente: {
        label: 'Pendente',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    aprovado: {
        label: 'Aprovado',
        className: 'bg-green-50 text-green-700 border-green-200',
    },
    recusado: {
        label: 'Recusado',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
    cancelado: {
        label: 'Cancelado',
        className: 'bg-gray-50 text-gray-600 border-gray-200',
    },
};

const ConfirmDialog: React.FC<{
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message: string;
}> = ({ open, onConfirm, onCancel, message }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-1 md:p-3">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-gradient-to-br from-[#F4F9FF] to-[#E6F0FD] rounded-[24px] shadow-2xl border border-blue-100 p-6 w-[99%] md:w-full md:max-w-sm z-10 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-1">
                        <Trash2 size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirmar exclusão</h3>
                </div>

                <p className="text-slate-600 font-bold text-sm text-center mb-8 px-2 leading-relaxed">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl bg-white text-slate-600 font-bold text-[16px] md:text-base border border-slate-300 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-50 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-[16px] md:text-base shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        </div>
    );
};

const AgendamentosPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin, profile } = useAuth();
    const { agendamentos, loading, excluir, alterarStatus, refetch, atualizar } = useAgendamentos();
    const { showSuccessToast, showErrorToast } = useToast();

    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<DrawerAgendamentoType | null>(null);

    const [searchParams] = useSearchParams();
    const [filterStatus, setFilterStatus] = useState('');
    const [filterUsuario, setFilterUsuario] = useState(searchParams.get('usuario') || '');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    // Escutar criação global de agendamentos
    React.useEffect(() => {
        const handleCreated = () => refetch();
        window.addEventListener('agendamento-criado', handleCreated);
        return () => window.removeEventListener('agendamento-criado', handleCreated);
    }, [refetch]);

    // Atualizar filtro quando o parâmetro da URL mudar
    React.useEffect(() => {
        const userId = searchParams.get('usuario');

        if (userId) {
            setFilterUsuario(userId);
            setFilterStatus('');
            setFilterPeriodo('');
            setFilterTipo('');
        } else {
            setFilterUsuario('');
            // Se a URL estiver limpa (sem parâmetros), removemos os outros filtros também
            if (searchParams.toString() === '') {
                setFilterStatus('');
                setFilterPeriodo('');
                setFilterTipo('');
            }
        }
    }, [searchParams]);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [alterandoStatusId, setAlterandoStatusId] = useState<string | null>(null);

    const usuariosUnicos = useMemo(() => {
        const map = new Map<string, { nome: string, apelido: string | null }>();
        agendamentos.forEach(a => {
            if (a.profiles?.id) {
                map.set(a.profiles.id, { nome: a.profiles.nome, apelido: a.profiles.apelido || null });
            }
        });
        return Array.from(map.entries()).map(([id, info]) => ({ id, ...info }));
    }, [agendamentos]);

    const filtrados = useMemo(() => {
        return agendamentos.filter(a => {
            if (filterStatus && a.status !== filterStatus) return false;
            if (filterUsuario && a.user_id !== filterUsuario) return false;
            if (filterPeriodo) {
                const inicio = new Date(a.data_inicial);
                const filter = new Date(filterPeriodo);
                const filterEnd = new Date(filterPeriodo);
                filterEnd.setMonth(filterEnd.getMonth() + 1);
                if (inicio < filter || inicio >= filterEnd) return false;
            }
            if (filterTipo && a.tipo_agendamento !== filterTipo) return false;
            return true;
        });
    }, [agendamentos, filterStatus, filterUsuario, filterPeriodo, filterTipo]);

    const handleExcluir = async (id: string) => {
        setDeletingId(id);
        const { error } = await excluir(id);
        if (error) {
            showErrorToast('Erro ao excluir agendamento');
        } else {
            showSuccessToast('Agendamento excluído!');
        }
        setDeletingId(null);
        setConfirmDelete(null);
    };

    const handleAlterarStatus = async (id: string, status: Agendamento['status']) => {
        setAlterandoStatusId(id);
        await alterarStatus(id, status);
        setAlterandoStatusId(null);
    };

    const handleUpdateAgendamento = async (ag: Omit<DrawerAgendamentoType, 'id'> | DrawerAgendamentoType) => {
        if (!agendamentoParaEditar) return;
        await atualizar(agendamentoParaEditar.id, {
            data_inicial: ag.dataInicio,
            data_final: ag.dataFim,
            tipo_agendamento: ag.tipo,
            dias: ag.totalDias,
            observacao: ag.observacao,
        });
        refetch();
        setIsEditDrawerOpen(false);
        setAgendamentoParaEditar(null);
    };

    const handlePreviousMonth = () => {
        const currentDate = filterPeriodo ? new Date(filterPeriodo + '-02') : new Date();
        currentDate.setMonth(currentDate.getMonth() - 1);
        setFilterPeriodo(format(currentDate, 'yyyy-MM'));
    };

    const handleNextMonth = () => {
        const currentDate = filterPeriodo ? new Date(filterPeriodo + '-02') : new Date();
        currentDate.setMonth(currentDate.getMonth() + 1);
        setFilterPeriodo(format(currentDate, 'yyyy-MM'));
    };

    const formatDate = (d: string) => {
        try {
            return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR });
        } catch {
            return d;
        }
    };

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col items-center justify-start p-2 lg:p-0 gap-y-2 overflow-x-hidden md:overflow-visible">
            <Header />
            <ConfirmDialog
                open={!!confirmDelete}
                onConfirm={() => confirmDelete && handleExcluir(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
                message="Tem certeza que deseja excluir este agendamento?"
            />

            <div className="w-full lg:pt-[74px]">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-0 sm:pt-6 pb-6 md:py-6">
                    {/* Cabeçalho do Módulo */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center justify-start gap-3 flex-1">
                            <button
                                onClick={() => navigate(-1)}
                                className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2 flex-1 md:flex-none">
                                📋 Agendamentos
                            </h2>
                        </div>
                        <button
                            onClick={refetch}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl shadow-sm transition-all"
                        >
                            <RefreshCw size={16} /> <span className="hidden md:inline">Recarregar</span>
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter size={14} className="text-blue-600" />
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-wide">Filtros</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="w-full md:w-[180px]">
                                <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                                    <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-blue-500">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg text-sm">🔎 Todos os Status</SelectItem>
                                        <SelectItem value="pendente" className="rounded-lg text-sm text-yellow-600 font-medium">⏳ Pendente</SelectItem>
                                        <SelectItem value="aprovado" className="rounded-lg text-sm text-green-600 font-medium">✅ Aprovado</SelectItem>
                                        <SelectItem value="recusado" className="rounded-lg text-sm text-red-600 font-medium">🚫 Recusado</SelectItem>
                                        <SelectItem value="cancelado" className="rounded-lg text-sm text-slate-500 font-medium">✖️ Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-[200px]">
                                <Select value={filterUsuario || "all"} onValueChange={(v) => setFilterUsuario(v === "all" ? "" : v)}>
                                    <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-blue-500">
                                        <SelectValue placeholder="Usuário" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg text-sm">👤 Todos os Usuários</SelectItem>
                                        {usuariosUnicos.map(u => (
                                            <SelectItem key={u.id} value={u.id} className="rounded-lg text-sm">{u.apelido || u.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-[220px]">
                                <Select value={filterTipo || "all"} onValueChange={(v) => setFilterTipo(v === "all" ? "" : v)}>
                                    <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white text-slate-600 text-sm font-medium focus:ring-2 focus:ring-blue-500">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg text-sm">🏷️ Todos os Tipos</SelectItem>
                                        <SelectItem value="🛌 Abonada" className="rounded-lg text-sm">🛌 Abonada</SelectItem>
                                        <SelectItem value="🏥 Atestado Médico" className="rounded-lg text-sm">🏥 Atestado Médico</SelectItem>
                                        <SelectItem value="⏳ Desconto de Hora" className="rounded-lg text-sm">⏳ Desconto de Hora</SelectItem>
                                        <SelectItem value="🩸 Doação de Sangue" className="rounded-lg text-sm">🩸 Doação de Sangue</SelectItem>
                                        <SelectItem value="🌤️ Folga Mensal" className="rounded-lg text-sm">🌤️ Folga Mensal</SelectItem>
                                        <SelectItem value="🗳️ Folga Eleitoral" className="rounded-lg text-sm">🗳️ Folga Eleitoral</SelectItem>
                                        <SelectItem value="🎂 Folga Aniversário" className="rounded-lg text-sm">🎂 Folga Aniversário</SelectItem>
                                        <SelectItem value="🏖️ Férias" className="rounded-lg text-sm">🏖️ Férias</SelectItem>
                                        <SelectItem value="🏝️ Licença Prêmio" className="rounded-lg text-sm">🏝️ Licença Prêmio</SelectItem>
                                        <SelectItem value="😷 Outros" className="rounded-lg text-sm">😷 Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm w-full md:w-auto">
                                <button
                                    onClick={handlePreviousMonth}
                                    className="h-9 px-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border-r border-slate-100"
                                    title="Mês Anterior"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <input
                                    type="month"
                                    value={filterPeriodo}
                                    onChange={e => setFilterPeriodo(e.target.value)}
                                    className="h-9 px-3 bg-transparent text-slate-600 text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer flex-1"
                                />
                                <button
                                    onClick={handleNextMonth}
                                    className="h-9 px-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border-l border-slate-100"
                                    title="Próximo Mês"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {(filterStatus || filterUsuario || filterPeriodo || filterTipo) && (
                                <button
                                    onClick={() => { setFilterStatus(''); setFilterUsuario(''); setFilterPeriodo(''); setFilterTipo(''); }}
                                    className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contagem */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 text-sm font-medium">
                            {filtrados.length} agendamento{filtrados.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <p className="text-slate-400 text-sm">Carregando agendamentos...</p>
                            </div>
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            <span className="text-4xl mb-3 block">📋</span>
                            <p className="text-slate-400 font-medium">Nenhum agendamento encontrado</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Usuário</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Período</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Dias</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Observação</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtrados.map((ag, i) => {
                                                const st = STATUS_STYLES[ag.status] || STATUS_STYLES.pendente;
                                                return (
                                                    <tr
                                                        key={ag.id}
                                                        className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {ag.profiles?.foto_url ? (
                                                                    <img src={ag.profiles.foto_url} alt={ag.profiles.nome} className="w-8 h-8 rounded-lg object-cover" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                        <span className="text-blue-600 text-xs font-bold">
                                                                            {ag.profiles?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <span className="text-slate-700 text-sm font-medium whitespace-nowrap">
                                                                    {ag.profiles?.apelido || ag.profiles?.nome || '—'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-slate-700 text-sm font-medium">
                                                                {formatDate(ag.data_inicial)}
                                                            </div>
                                                            <div className="text-slate-400 text-xs">
                                                                até {formatDate(ag.data_final)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-bold text-blue-700 text-sm">{ag.dias}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-slate-700 text-sm">{ag.tipo_agendamento}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isAdmin ? (
                                                                <div className="relative">
                                                                    <select
                                                                        value={ag.status}
                                                                        onChange={e => handleAlterarStatus(ag.id, e.target.value as Agendamento['status'])}
                                                                        disabled={alterandoStatusId === ag.id}
                                                                        className={`appearance-none px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer pr-6 ${st.className}`}
                                                                    >
                                                                        <option value="pendente">Pendente</option>
                                                                        <option value="aprovado">Aprovado</option>
                                                                        <option value="recusado">Recusado</option>
                                                                        <option value="cancelado">Cancelado</option>
                                                                    </select>
                                                                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                                                                </div>
                                                            ) : (
                                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.className}`}>
                                                                    {st.label}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-slate-400 text-xs italic">
                                                                {ag.observacao || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {(isAdmin || ag.user_id === profile?.id) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const formattedAgenda = {
                                                                                id: ag.id,
                                                                                userId: ag.user_id,
                                                                                dataInicio: ag.data_inicial,
                                                                                dataFim: ag.data_final,
                                                                                tipo: ag.tipo_agendamento,
                                                                                totalDias: ag.dias,
                                                                                status: ag.status || 'pendente',
                                                                                observacao: ag.observacao || undefined,
                                                                                userName: ag.profiles?.apelido || ag.profiles?.nome || undefined,
                                                                                userPhoto: ag.profiles?.foto_url || undefined,
                                                                                createdAt: ag.created_at,
                                                                                approvedAt: ag.approved_at,
                                                                                cancelledAt: ag.cancelled_at,
                                                                                rejectedAt: ag.rejected_at,
                                                                            };
                                                                            window.dispatchEvent(
                                                                                new CustomEvent('open-global-agendamento-modal', {
                                                                                    detail: { mode: 'edit', agendamento: formattedAgenda }
                                                                                })
                                                                            );
                                                                        }}
                                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                                        title="Editar Agendamento"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                )}
                                                                {isAdmin && (
                                                                    <button
                                                                        onClick={() => setConfirmDelete(ag.id)}
                                                                        disabled={deletingId === ag.id}
                                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                        title="Excluir"
                                                                    >
                                                                        {deletingId === ag.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {filtrados.map(ag => {
                                    const st = STATUS_STYLES[ag.status] || STATUS_STYLES.pendente;
                                    return (
                                        <div key={ag.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {ag.profiles?.foto_url ? (
                                                        <img src={ag.profiles.foto_url} alt={ag.profiles.nome} className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                            <User size={18} className="text-blue-500" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-slate-700 text-sm font-bold">{ag.profiles?.nome || 'Usuário'}</p>
                                                        <span className="text-slate-600 text-[13px] uppercase font-black tracking-tight">{ag.tipo_agendamento}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.className}`}>
                                                    {st.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                                                <span>📅 {formatDate(ag.data_inicial)} → {formatDate(ag.data_final)}</span>
                                                <span className="font-bold text-blue-700">{ag.dias} dias</span>
                                            </div>
                                            {ag.observacao && (
                                                <p className="text-slate-400 text-xs italic mt-2">"{ag.observacao}"</p>
                                            )}
                                            {(isAdmin || ag.user_id === profile?.id) && (
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                    {isAdmin ? (
                                                        <select
                                                            value={ag.status}
                                                            onChange={e => handleAlterarStatus(ag.id, e.target.value as Agendamento['status'])}
                                                            className={`text-xs font-bold border rounded-full px-2 py-0.5 ${st.className}`}
                                                        >
                                                            <option value="pendente">Pendente</option>
                                                            <option value="aprovado">Aprovado</option>
                                                            <option value="recusado">Recusado</option>
                                                            <option value="cancelado">Cancelado</option>
                                                        </select>
                                                    ) : <div />}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const formattedAgenda = {
                                                                    id: ag.id,
                                                                    userId: ag.user_id,
                                                                    dataInicio: ag.data_inicial,
                                                                    dataFim: ag.data_final,
                                                                    tipo: ag.tipo_agendamento,
                                                                    totalDias: ag.dias,
                                                                    status: ag.status || 'pendente',
                                                                    observacao: ag.observacao || undefined,
                                                                    userName: ag.profiles?.apelido || ag.profiles?.nome || undefined,
                                                                    userPhoto: ag.profiles?.foto_url || undefined,
                                                                    createdAt: ag.created_at,
                                                                    approvedAt: ag.approved_at,
                                                                    cancelledAt: ag.cancelled_at,
                                                                    rejectedAt: ag.rejected_at,
                                                                };
                                                                window.dispatchEvent(
                                                                    new CustomEvent('open-global-agendamento-modal', {
                                                                        detail: { mode: 'edit', agendamento: formattedAgenda }
                                                                    })
                                                                );
                                                            }}
                                                            className="flex items-center justify-center p-1.5 px-2.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-blue-100"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => setConfirmDelete(ag.id)}
                                                                className="flex items-center justify-center p-1.5 px-2.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-red-100"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Footer exibido apenas em desktop */}
            <Footer className="hidden md:block" />
        </div >
    );
};

export default AgendamentosPage;
