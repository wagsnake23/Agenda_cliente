"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Loader2, Filter, Trash2, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { Agendamento } from '@/modules/auth/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 w-[99%] max-w-sm z-10 animate-in zoom-in-95 duration-200">
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
                        className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm 
                                 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-200 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-sm 
                                 shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const AgendamentosPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { agendamentos, loading, excluir, alterarStatus, refetch } = useAgendamentos();

    const [searchParams] = useSearchParams();
    const [filterStatus, setFilterStatus] = useState('');
    const [filterUsuario, setFilterUsuario] = useState(searchParams.get('usuario') || '');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

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
            toast.error('Erro ao excluir agendamento');
        } else {
            toast.success('Agendamento excluído!');
        }
        setDeletingId(null);
        setConfirmDelete(null);
    };

    const handleAlterarStatus = async (id: string, status: Agendamento['status']) => {
        setAlterandoStatusId(id);
        await alterarStatus(id, status);
        setAlterandoStatusId(null);
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
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-3 pb-6 md:py-6">
                    {/* Cabeçalho do Módulo */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
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
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium focus:outline-none focus:border-blue-400 transition-all appearance-none w-full md:w-[180px]"
                            >
                                <option value="">Todos os Status</option>
                                <option value="pendente">Pendente</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="recusado">Recusado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>

                            <select
                                value={filterUsuario}
                                onChange={e => setFilterUsuario(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium focus:outline-none focus:border-blue-400 transition-all appearance-none w-full md:w-[200px]"
                            >
                                <option value="">Todos os Usuários</option>
                                {usuariosUnicos.map(u => (
                                    <option key={u.id} value={u.id}>{u.apelido || u.nome}</option>
                                ))}
                            </select>

                            <select
                                value={filterTipo}
                                onChange={e => setFilterTipo(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium focus:outline-none focus:border-blue-400 transition-all appearance-none w-full md:w-[220px]"
                            >
                                <option value="">Todos os Tipos</option>
                                <option value="🛌 Abonada">🛌 Abonada</option>
                                <option value="🏥 Atestado Médico">🏥 Atestado Médico</option>
                                <option value="⏳ Desconto de Hora">⏳ Desconto de Hora</option>
                                <option value="🩸 Doação de Sangue">🩸 Doação de Sangue</option>
                                <option value="🌤️ Folga Mensal">🌤️ Folga Mensal</option>
                                <option value="🗳️ Folga Eleitoral">🗳️ Folga Eleitoral</option>
                                <option value="🎂 Folga Aniversário">🎂 Folga Aniversário</option>
                                <option value="🏖️ Férias">🏖️ Férias</option>
                                <option value="🏝️ Licença Prêmio">🏝️ Licença Prêmio</option>
                                <option value="😷 Outros">😷 Outros</option>
                            </select>

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
                                                {isAdmin && <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Ações</th>}
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
                                                                    <img src={ag.profiles.foto_url} alt={ag.profiles.nome} className="w-7 h-7 rounded-lg object-cover" />
                                                                ) : (
                                                                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                        <span className="text-blue-600 text-[10px] font-bold">
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
                                                        {isAdmin && (
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    onClick={() => setConfirmDelete(ag.id)}
                                                                    disabled={deletingId === ag.id}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                >
                                                                    {deletingId === ag.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                                </button>
                                                            </td>
                                                        )}
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
                                                        <img src={ag.profiles.foto_url} alt={ag.profiles.nome} className="w-8 h-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                            <User size={14} className="text-blue-500" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-slate-700 text-sm font-bold">{ag.profiles?.nome || 'Usuário'}</p>
                                                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">{ag.tipo_agendamento}</span>
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
                                            {isAdmin && (
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
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
                                                    <button
                                                        onClick={() => setConfirmDelete(ag.id)}
                                                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
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
