import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Loader2, Filter, ChevronLeft, ChevronRight, RefreshCw, User, Search } from 'lucide-react';
import { useToast } from '@/contexts/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { Agendamento } from '@/modules/auth/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DrawerAgendamento, { Agendamento as DrawerAgendamentoType } from '@/components/calendar/DrawerAgendamento';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AgendamentoList from './AgendamentoList';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AgendamentosPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin, user } = useAuth();
    const { showErrorToast, showSuccessToast } = useToast();

    // States for filtering
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterUsuario, setFilterUsuario] = useState<string>('');
    const [filterPeriodo, setFilterPeriodo] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [filterTipo, setFilterTipo] = useState<string>('');
    const [search, setSearch] = useState('');

    const {
        agendamentos,
        loading,
        excluir,
        alterarStatus,
        refetch,
        atualizar
    } = useAgendamentos({
        status: filterStatus || undefined,
        userId: filterUsuario || undefined,
        // Date filtering could be server-side too but keeping it simple for now or fixing in next refactor
    });

    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    // Filtered result (frontend)
    const filtrados = useMemo(() => {
        let result = agendamentos;

        // Frontend Period Filter (if not processed by hook yet)
        if (filterPeriodo) {
            const [year, month] = filterPeriodo.split('-').map(Number);
            result = result.filter(a => {
                const date = parseISO(a.data_inicial);
                return date.getFullYear() === year && (date.getMonth() + 1) === month;
            });
        }

        // Frontend Search Filter (profiles)
        if (search) {
            const term = search.toLowerCase();
            result = result.filter(a =>
                a.profiles?.nome.toLowerCase().includes(term) ||
                a.tipo_agendamento.toLowerCase().includes(term) ||
                (a.observacao?.toLowerCase().includes(term) ?? false)
            );
        }

        return result;
    }, [agendamentos, filterPeriodo, search]);

    const usersOptions = useMemo(() => {
        const map = new Map<string, { nome: string, apelido: string | null }>();
        agendamentos.forEach(a => {
            if (a.profiles?.id) {
                map.set(a.profiles.id, { nome: a.profiles.nome, apelido: a.profiles.apelido || null });
            }
        });
        return Array.from(map.entries()).map(([id, info]) => ({ id, ...info }));
    }, [agendamentos]);

    const handleExcluir = async (id: string) => {
        try {
            await excluir(id);
            setConfirmDelete(null);
        } catch (err) {
            showErrorToast('Erro ao excluir agendamento');
        }
    };

    const handleAlterarStatus = async (id: string, status: Agendamento['status']) => {
        setUpdatingStatusId(id);
        try {
            await alterarStatus(id, status);
            showSuccessToast('Status atualizado com sucesso!');
        } catch (err) {
            showErrorToast('Erro ao atualizar status');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleEdit = (ag: Agendamento) => {
        setAgendamentoParaEditar(ag);
        setIsEditDrawerOpen(true);
    };

    const handleUpdateAgendamento = async (ag: Omit<DrawerAgendamentoType, 'id'> | DrawerAgendamentoType) => {
        if (!agendamentoParaEditar) return;
        try {
            await atualizar({
                id: agendamentoParaEditar.id,
                updates: {
                    data_inicial: ag.dataInicio,
                    data_final: ag.dataFim,
                    tipo_agendamento: ag.tipo,
                    dias: ag.totalDias,
                    observacao: ag.observacao,
                }
            });
            setIsEditDrawerOpen(false);
            setAgendamentoParaEditar(null);
        } catch (err) {
            // Toast handled by hook
        }
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

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col items-center justify-start p-2 lg:p-0 gap-y-2 overflow-x-hidden md:overflow-visible">
            <Header />
            <ConfirmDialog
                open={!!confirmDelete}
                onConfirm={() => confirmDelete && handleExcluir(confirmDelete)}
                onCancel={() => setConfirmDelete(null)}
                title="Confirmar exclusão"
                message="Tem certeza que deseja excluir este agendamento permanentemente?"
            />

            <div className="w-full lg:pt-[74px]">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-0 sm:pt-6 pb-6 md:py-6">

                    {/* Header Layout */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <button onClick={() => navigate(-1)} className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 transition-all shadow-sm">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                        📅 Gestão de Agendamentos
                                    </h2>
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Visualização e Controle Administrativo</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={refetch} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:rotate-180 duration-500">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Filters Dashboard */}
                    <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-100/60 mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">

                            {/* Search */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesquisar</label>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Filtrar card..."
                                        className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Periodo */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mês de Referência</label>
                                <div className="flex items-center gap-1">
                                    <button onClick={handlePreviousMonth} className="w-9 h-11 flex items-center justify-center rounded-l-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <input
                                        type="month"
                                        value={filterPeriodo}
                                        onChange={(e) => setFilterPeriodo(e.target.value)}
                                        className="flex-1 h-11 border-y border-slate-100 bg-white px-2 text-xs font-black uppercase text-center text-slate-700 focus:outline-none"
                                    />
                                    <button onClick={handleNextMonth} className="w-9 h-11 flex items-center justify-center rounded-r-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-700">
                                        <SelectValue placeholder="Todos Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Status</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="recusado">Recusado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Usuario */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
                                <Select value={filterUsuario} onValueChange={setFilterUsuario}>
                                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-700">
                                        <SelectValue placeholder="Todos Usuários" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Usuários</SelectItem>
                                        {usersOptions.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <AgendamentoList
                        agendamentos={filtrados}
                        loading={loading}
                        isAdmin={isAdmin}
                        currentUserId={user?.id}
                        onEdit={handleEdit}
                        onDelete={setConfirmDelete}
                        onUpdateStatus={handleAlterarStatus}
                        updatingStatusId={updatingStatusId}
                    />

                </div>
            </div>

            <Footer />

            <DrawerAgendamento
                isOpen={isEditDrawerOpen}
                onClose={() => {
                    setIsEditDrawerOpen(false);
                    setAgendamentoParaEditar(null);
                }}
                onSubmit={handleUpdateAgendamento}
                agendamento={agendamentoParaEditar ? {
                    id: agendamentoParaEditar.id,
                    dataInicio: agendamentoParaEditar.data_inicial,
                    dataFim: agendamentoParaEditar.data_final,
                    totalDias: agendamentoParaEditar.dias,
                    tipo: agendamentoParaEditar.tipo_agendamento as any,
                    observacao: agendamentoParaEditar.observacao || '',
                    nome: agendamentoParaEditar.profiles?.nome || '',
                } : undefined}
                isEdit={true}
            />
        </div>
    );
};

export default AgendamentosPage;
