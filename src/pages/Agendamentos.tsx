"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Filter, Trash2, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, User, SquarePen } from 'lucide-react';
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
            <div className="relative bg-gradient-to-br from-[#F4F9FF] to-[#E6F0FD] rounded-[24px] shadow-2xl border border-blue-100 p-6 md:p-8 w-[99%] md:w-full md:max-w-md z-10 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center gap-4 mb-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0_4px_0_#93c5fd] border border-blue-200 flex items-center justify-center text-red-600 shrink-0">
                            <Trash2 size={22} strokeWidth={3} />
                        </div>
                        <h3 className="text-[1.35rem] font-black text-slate-800 leading-tight">Confirmar Exclusão</h3>
                    </div>
                </div>

                <p className="text-slate-600 font-bold text-sm text-center mb-8 px-2 leading-relaxed">{message}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl bg-slate-200 text-slate-600 font-bold text-[17px] border border-slate-300 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-300 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-[17px] shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all"
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
        <div className="min-h-screen flex flex-col items-stretch justify-start px-[14px] py-2 lg:p-0 gap-y-2 overflow-x-hidden md:overflow-visible">
            <Header />
            <ConfirmDialog
                open={!!confirmDelete}
                onConfirm={() => confirmDelete && handleExcluir(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
                message="Tem certeza que deseja excluir este agendamento?"
            />

            <section className="w-full lg:w-screen lg:relative lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] pt-0 lg:pt-[82px] pb-0 lg:pb-8 bg-transparent lg:premium-subheader-bg lg:border-t-[3px] lg:border-[#2563eb] lg:shadow-[0_12px_28px_rgba(0,0,0,0.08)] mb-6">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-0 sm:pt-6">
                    {/* Cabeçalho do Módulo */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start gap-3 flex-1">
                            <h2 className="text-[1.2rem] md:text-[1.7rem] font-black tracking-tight flex items-center justify-center md:justify-start gap-3 flex-1 md:flex-none">
                                <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-[#f0f7ff] via-[#e1effe] to-[#dbeafe] rounded-xl md:rounded-2xl border border-blue-200/50 shadow-[inset_0_1.5px_1.5px_white,0_2px_4px_rgba(37,99,235,0.06)] flex items-center justify-center shrink-0">
                                    <span className="text-lg md:text-2xl">📋</span>
                                </div>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-900">Agendamentos</span>
                            </h2>
                        </div>
                        <button
                            onClick={refetch}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl shadow-sm transition-all"
                        >
                            <RefreshCw size={16} /> <span className="hidden md:inline">Recarregar</span>
                        </button>
                    </div>
                </div>
            </section>

            <div className="w-full max-w-[1400px] mx-auto px-0 md:px-8 pb-6">
                {/* Filtros */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-[inset_0_1px_1px_white]">
                            <Filter size={14} className="text-blue-600" />
                        </div>
                        <span className="text-blue-900/70 text-[11px] font-black uppercase tracking-wider">Filtros de Busca</span>
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
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => { setFilterStatus(''); setFilterUsuario(''); setFilterPeriodo(''); setFilterTipo(''); }}
                                    className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
                                >
                                    Limpar
                                </button>

                                {/* Contagem Mobile - Apenas com filtro ativo */}
                                <div className="flex md:hidden ml-auto items-center gap-1.5 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 h-9">
                                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-blue-900/70 text-[10px] font-black uppercase tracking-wider">
                                        {filtrados.length} {filtrados.length !== 1 ? 'itens' : 'item'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Contador Desktop Interno ao Card - Inferior Direita */}
                        <div className="hidden md:flex md:ml-auto items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50 shadow-[0_2px_4px_rgba(37,99,235,0.03)] group transition-all hover:shadow-md h-9">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-blue-900/60 text-[10px] font-black uppercase tracking-wider">
                                {filtrados.length} <span className="opacity-70">agendamento{filtrados.length !== 1 ? 's' : ''}</span>
                            </span>
                        </div>
                    </div>
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
                                        <tr className="bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#1e3a8a] border-b border-blue-400/30 shadow-[0_4px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.1)]">
                                            <th className="px-4 py-4 text-left text-[11px] font-black text-white uppercase tracking-widest">Usuário</th>
                                            <th className="px-4 py-4 text-left text-[11px] font-black text-white uppercase tracking-widest">Período</th>
                                            <th className="px-4 py-4 text-left text-[11px] font-black text-white uppercase tracking-widest">Dias</th>
                                            <th className="px-4 py-4 text-left text-[11px] font-black text-white uppercase tracking-widest">Tipo</th>
                                            <th className="px-4 py-4 text-left text-[11px] font-black text-white uppercase tracking-widest">Status</th>
                                            <th className="px-4 py-4 text-left text-[11px] font-black text-white uppercase tracking-widest">Observação</th>
                                            <th className="px-4 py-4 text-right text-[11px] font-black text-white uppercase tracking-widest">Ações</th>
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
                                                            <Select
                                                                value={ag.status}
                                                                onValueChange={(v) => handleAlterarStatus(ag.id, v as Agendamento['status'])}
                                                                disabled={alterandoStatusId === ag.id}
                                                            >
                                                                <SelectTrigger className={`h-7 px-3 rounded-full text-xs font-bold border cursor-pointer w-32 ${st.className}`}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                                    <SelectItem value="pendente" className="rounded-lg text-xs font-semibold text-yellow-700">⏳ Pendente</SelectItem>
                                                                    <SelectItem value="aprovado" className="rounded-lg text-xs font-semibold text-green-700">✅ Aprovado</SelectItem>
                                                                    <SelectItem value="recusado" className="rounded-lg text-xs font-semibold text-red-700">🚫 Recusado</SelectItem>
                                                                    <SelectItem value="cancelado" className="rounded-lg text-xs font-semibold text-slate-600">✖️ Cancelado</SelectItem>
                                                                </SelectContent>
                                                            </Select>
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
                                                                        className="w-10 h-10 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-blue-50/50"
                                                                        title="Editar Agendamento"
                                                                    >
                                                                        <SquarePen size={18} />
                                                                    </button>
                                                                )}
                                                                {isAdmin && (
                                                                    <button
                                                                        onClick={() => setConfirmDelete(ag.id)}
                                                                        disabled={deletingId === ag.id}
                                                                        className="w-10 h-10 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-red-50/50"
                                                                        title="Excluir"
                                                                    >
                                                                        {deletingId === ag.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
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
                                                    <Select
                                                        value={ag.status}
                                                        onValueChange={(v) => handleAlterarStatus(ag.id, v as Agendamento['status'])}
                                                        disabled={alterandoStatusId === ag.id}
                                                    >
                                                        <SelectTrigger className={`h-7 px-3 rounded-full text-xs font-bold border cursor-pointer w-32 ${st.className}`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                            <SelectItem value="pendente" className="rounded-lg text-xs font-semibold text-yellow-700">⏳ Pendente</SelectItem>
                                                            <SelectItem value="aprovado" className="rounded-lg text-xs font-semibold text-green-700">✅ Aprovado</SelectItem>
                                                            <SelectItem value="recusado" className="rounded-lg text-xs font-semibold text-red-700">🚫 Recusado</SelectItem>
                                                            <SelectItem value="cancelado" className="rounded-lg text-xs font-semibold text-slate-600">✖️ Cancelado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
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
                                                        <SquarePen size={18} />
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
            {/* Footer exibido apenas em desktop */}
            <Footer className="hidden md:block" />
        </div>
    );
};

export default AgendamentosPage;
