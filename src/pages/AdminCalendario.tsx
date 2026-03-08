"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCalendarEventsContext } from '@/context/CalendarEventsContext';
import { useToast } from '@/contexts/ToastProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
    Plus, Search, Edit2, Trash2,
    Calendar, Loader2, X, Check, RefreshCw, Lock
} from 'lucide-react';
import type { CalendarEvent, CalendarEventType, ColorMode } from '@/hooks/use-calendar-events';
import EmojiPicker from '@/components/EmojiPicker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | CalendarEventType;
type FilterStatus = 'active' | 'inactive' | 'all';

interface EventForm {
    title: string;
    description: string;
    date: string;
    type: CalendarEventType;
    is_fixed: boolean;
    color_mode: ColorMode;
    emoji: string;
    is_active: boolean;
    is_system?: boolean;
}

const EMPTY_FORM: EventForm = {
    title: '',
    description: '',
    date: '',
    type: 'event',
    is_fixed: true,
    color_mode: 'event_only',
    emoji: '',
    is_active: true,
    is_system: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeBadge = (type: CalendarEventType) => {
    if (type === 'holiday') return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 uppercase tracking-wide flex items-center gap-1">🏖️ Feriado</span>;
    if (type === 'birthday') return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 uppercase tracking-wide flex items-center gap-1">🎂 Aniversário</span>;
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide flex items-center gap-1">📝 Evento</span>;
};

const formatDisplayDate = (dateStr: string, isFixed: boolean): string => {
    if (!dateStr) return '-';
    // dateStr always in YYYY-MM-DD format from Supabase
    const [y, m, d] = dateStr.split('-');
    if (isFixed) {
        return `${d}/${m}`;
    }
    return `${d}/${m}/${y}`;
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const AdminCalendario: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin, user, isAuthenticated, loading: authLoading } = useAuth();
    const { refetch } = useCalendarEventsContext();
    const { showSuccessToast, showErrorToast } = useToast();

    const canEdit = (ev: CalendarEvent) => isAdmin || ev.created_by === user?.id;

    // Estado
    const [events, setEvents] = useState<(CalendarEvent & { is_active: boolean })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<EventForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    // Redirecionar se não estiver logado
    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate('/auth', { replace: true });
    }, [isAuthenticated, authLoading, navigate]);

    // Busca todos os eventos (ativos e inativos)
    const fetchAll = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .order('date', { ascending: true });
        if (error) {
            showErrorToast('Erro ao carregar eventos');
        } else {
            const dbEvents = (data || []).map(e => ({ ...e, is_system: false }));
            setEvents(dbEvents as any);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Filtros
    const filtered = events.filter(e => {
        if (filterType !== 'all' && e.type !== filterType) return false;
        if (filterStatus === 'active' && !e.is_active) return false;
        if (filterStatus === 'inactive' && e.is_active) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    // Abrir modal criar
    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    // Abrir modal editar
    const openEdit = (ev: CalendarEvent & { is_active: boolean }) => {
        setEditingId(ev.id);
        setForm({
            title: ev.title,
            description: ev.description || '',
            date: ev.date,
            type: ev.type,
            is_fixed: ev.is_fixed,
            color_mode: ev.color_mode,
            emoji: ev.emoji || '',
            is_active: ev.is_active,
            is_system: (ev as any).is_system || false,
        });
        setModalOpen(true);
    };

    // Regras automáticas de tipo
    const handleTypeChange = (type: CalendarEventType) => {
        setForm(prev => ({
            ...prev,
            type,
            ...(type === 'birthday' ? { is_fixed: true, color_mode: 'event_only' as ColorMode } : {}),
            ...(type === 'holiday' ? { color_mode: 'holiday' as ColorMode } : {}),
        }));
    };

    // Salvar
    const SYSTEM_HOLIDAYS = [
        'Carnaval', 'Quarta-feira de Cinzas', 'Sexta-feira Santa',
        'Páscoa', 'Corpus Christi', 'Dia das Mães', 'Dia dos Pais',
        'Ano Novo', 'Tiradentes', 'Dia do Trabalho', 'Independência do Brasil',
        'Nossa Senhora Aparecida', 'Finados',
        'Proclamação da República', 'Dia da Consciência Negra', 'Natal',
        'Revolução Constitucionalista'
    ];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { showErrorToast('Nome é obrigatório'); return; }
        if (!form.date) { showErrorToast('Data é obrigatória'); return; }

        if (!editingId && SYSTEM_HOLIDAYS.includes(form.title.trim())) {
            showErrorToast('Este feriado é calculado automaticamente pelo sistema.');
            return;
        }

        setSaving(true);
        try {
            if (form.is_system && editingId) {
                // Atualização em memória apenas (não vai pro DB)
                setEvents(prev => prev.map(ev => ev.id === editingId ? { ...ev, emoji: form.emoji.trim() || null } : ev) as any);
                showSuccessToast('Emoji atualizado localmente!');
                setModalOpen(false);
                setSaving(false);
                return;
            }
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                date: form.date,
                type: form.type,
                is_fixed: form.is_fixed,
                color_mode: form.color_mode,
                emoji: form.emoji.trim() || null,
                is_active: form.is_active,
                created_by: editingId ? undefined : user?.id,
            };

            if (editingId) {
                const { error } = await supabase.from('calendar_events').update(payload).eq('id', editingId);
                if (error) throw error;
                showSuccessToast('Evento atualizado!');
            } else {
                const { error } = await supabase.from('calendar_events').insert(payload);
                if (error) throw error;
                showSuccessToast('Evento criado!');
            }

            setModalOpen(false);
            await fetchAll();
            refetch();
        } catch (err: any) {
            showErrorToast(err.message || 'Erro ao salvar evento');
        } finally {
            setSaving(false);
        }
    };

    // Toggle ativo/inativo
    const handleToggle = async (ev: CalendarEvent & { is_active: boolean, is_system?: boolean }) => {
        if (ev.is_system) {
            showErrorToast('Eventos do sistema já são controlados e não podem ser desativados.');
            return;
        }
        if (!canEdit(ev)) {
            showErrorToast('Você não tem permissão para alterar este evento.');
            return;
        }
        setTogglingId(ev.id);
        const { error } = await supabase
            .from('calendar_events')
            .update({ is_active: !ev.is_active })
            .eq('id', ev.id);
        if (error) {
            showErrorToast('Erro ao alterar status');
        } else {
            showSuccessToast(ev.is_active ? 'Evento desativado' : 'Evento ativado');
            await fetchAll();
            refetch();
        }
        setTogglingId(null);
    };

    // Excluir
    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        const evDelete = events.find(e => e.id === confirmDeleteId) as any;
        if (evDelete?.is_system) {
            showErrorToast('O sistema impôe a exclusão de datas móveis vitais.');
            setConfirmDeleteId(null);
            return;
        }
        setDeleting(true);
        const { error } = await supabase.from('calendar_events').delete().eq('id', confirmDeleteId);
        if (error) {
            showErrorToast('Erro ao excluir evento');
        } else {
            showSuccessToast('Evento excluído!');
            setConfirmDeleteId(null);
            await fetchAll();
            refetch();
        }
        setDeleting(false);
    };

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col items-center justify-start p-2 lg:p-0 gap-y-2 overflow-x-hidden md:overflow-visible text-slate-800">
            <Header />

            <div className="w-full lg:pt-[74px]">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-0 sm:pt-6 pb-6">

                    {/* Cabeçalho interno do Módulo */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
                                <span className="text-[1.1em]">📅</span>
                                <span>Feriados e Eventos</span>
                            </h1>
                            <p className="text-slate-500 text-sm mt-0.5 hidden md:block">Gerencie feriados, eventos e aniversariantes exibidos no calendário.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={fetchAll}
                                className="w-11 h-11 flex items-center justify-center shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all shadow-sm hidden md:flex"
                                title="Atualizar"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button
                                onClick={openCreate}
                                className="w-full sm:w-auto shrink-0 whitespace-nowrap h-11 px-6 lg:px-8 flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl font-black uppercase text-sm text-[#0B1221] bg-gradient-to-b from-[#fef08a] to-[#facc15] shadow-[0_4px_0_#eab308] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 cursor-pointer border-none ring-0 outline-none"
                            >
                                <Plus size={16} strokeWidth={3} /> Novo Evento
                            </button>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Busca */}
                            <div className="flex-1 md:flex-[0.6]">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 md:hidden">Buscar por nome</label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                    />
                                </div>
                            </div>

                            {/* Tipo */}
                            <div className="w-full md:flex-[0.25]">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 md:hidden">Tipo de evento</label>
                                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-medium">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg">🏷️ Todos os tipos</SelectItem>
                                        <SelectItem value="holiday" className="rounded-lg">🏖️ Feriado</SelectItem>
                                        <SelectItem value="event" className="rounded-lg">📝 Evento</SelectItem>
                                        <SelectItem value="birthday" className="rounded-lg">🎂 Aniversário</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="w-full md:flex-[0.15]">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 md:hidden">Status</label>
                                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                                    <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-medium">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg">🔎 Todos os status</SelectItem>
                                        <SelectItem value="active" className="rounded-lg">✅ Ativos</SelectItem>
                                        <SelectItem value="inactive" className="rounded-lg">🚫 Inativos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Tabela / Cards */}
                    <div className="mt-6 md:bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm md:overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-blue-600" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Calendar size={48} className="mb-3 opacity-30" />
                                <p className="font-medium">Nenhum evento encontrado</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="text-left px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500 w-14">Emoji</th>
                                                <th className="text-left px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Nome</th>
                                                <th className="text-left px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Data</th>
                                                <th className="text-left px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Tipo</th>
                                                <th className="text-left px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Recorrência</th>
                                                <th className="text-center px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Ativo</th>
                                                <th className="text-right px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filtered.map(ev => (
                                                <tr key={ev.id} className={`transition-colors ${!ev.is_active ? 'opacity-50 bg-slate-50/50' : 'hover:bg-slate-50/50'}`}>
                                                    <td className="px-5 py-3.5 text-2xl">{ev.emoji || '📅'}</td>
                                                    <td className="px-5 py-3.5 font-semibold text-slate-800">{ev.title}</td>
                                                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{formatDisplayDate(ev.date, ev.is_fixed)}</td>
                                                    <td className="px-5 py-3.5">{typeBadge(ev.type)}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${ev.is_fixed ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {ev.is_fixed ? 'Anual' : 'Específica'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <button
                                                            onClick={() => handleToggle(ev)}
                                                            disabled={togglingId === ev.id || !canEdit(ev)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${ev.is_active ? 'bg-green-500' : 'bg-slate-300'} ${!canEdit(ev) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${ev.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {canEdit(ev) ? (
                                                                <>
                                                                    <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Editar">
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    <button onClick={() => setConfirmDeleteId(ev.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all" title="Excluir">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md uppercase font-bold">Somente Leitura</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden space-y-4 pt-2">
                                    {filtered.map(ev => (
                                        <div key={ev.id} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 transition-all ${!ev.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            <div className="grid grid-cols-[55px_1fr_auto] grid-rows-[auto_auto_auto] gap-x-3 gap-y-2 items-center">

                                                {/* EMOJI: Linha 1 e 2, Coluna 1 */}
                                                <div className="row-start-1 row-end-3 col-start-1 flex items-center justify-center bg-slate-50/50 rounded-xl h-full py-1">
                                                    <span className="text-3xl" role="img" aria-label="emoji">
                                                        {ev.emoji || '📅'}
                                                    </span>
                                                </div>

                                                {/* TIPO: Linha 1, Coluna 2 */}
                                                <div className="col-start-2 flex items-center gap-2 flex-wrap self-center">
                                                    {typeBadge(ev.type)}
                                                </div>

                                                {/* TOGGLE: Linha 1, Coluna 3 */}
                                                <div className="col-start-3 justify-self-end">
                                                    <button
                                                        onClick={() => handleToggle(ev)}
                                                        disabled={togglingId === ev.id || !canEdit(ev)}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${ev.is_active ? 'bg-green-500' : 'bg-slate-300'} ${!canEdit(ev) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${ev.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>

                                                {/* NOME: Linha 2, Coluna 2 */}
                                                <div className="col-start-2 col-span-2 min-w-0 self-center">
                                                    <h3 className="font-bold text-slate-800 text-[15px] leading-tight truncate">
                                                        {ev.title}
                                                    </h3>
                                                </div>

                                                {/* DATA (ABAIXO DO EMOJI): Linha 3, Coluna 1 */}
                                                <div className="col-start-1 row-start-3 flex justify-center border-t border-slate-50 pt-1">
                                                    <span className="text-[11px] text-slate-500 font-mono font-bold uppercase tracking-wider leading-none">
                                                        {formatDisplayDate(ev.date, ev.is_fixed)}
                                                    </span>
                                                </div>

                                                {/* ANUAL: Linha 3, Coluna 2 */}
                                                <div className="col-start-2 row-start-3 flex items-center gap-1.5 min-w-0 border-t border-slate-50 pt-1">
                                                    <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${ev.is_fixed ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                        {ev.is_fixed ? 'Anual' : 'Específica'}
                                                    </span>
                                                    {ev.color_mode === 'holiday' && (
                                                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-red-50 text-red-600 border border-red-100 truncate">
                                                            Destaque
                                                        </span>
                                                    )}
                                                </div>

                                                {/* AÇÕES: Linha 3, Coluna 3 */}
                                                <div className="col-start-3 row-start-3 flex gap-1.5 justify-self-end border-t border-slate-50 pt-1">
                                                    {canEdit(ev) ? (
                                                        <>
                                                            <button onClick={() => openEdit(ev)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-90 transition-all shadow-sm border border-blue-100">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => setConfirmDeleteId(ev.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 active:scale-90 transition-all shadow-sm border border-red-100">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 border border-slate-100" title="Somente leitura">
                                                            <Lock size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Contador */}
                    <p className="text-xs text-slate-400 text-right font-medium mt-4">{filtered.length} evento{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Footer exibido apenas em desktop */}
            <Footer className="hidden md:block" />

            {/* ── Modal Criar/Editar ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-1 sm:p-3">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setModalOpen(false)} />
                    <div className="relative bg-white rounded-[24px] shadow-2xl w-[99%] max-w-lg z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0f3c78] to-[#2f80ed]">
                            <h3 className="font-black text-white uppercase tracking-tight text-base">
                                {editingId ? '✏️ Editar Evento' : '➕ Novo Evento'}
                            </h3>
                            <button onClick={() => !saving && setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] text-white shadow-md active:scale-90 transition-all">
                                <X size={18} strokeWidth={3} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                            {/* Nome */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1 block">Nome *</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    disabled={form.is_system}
                                    placeholder="Ex: Natal"
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium disabled:opacity-50 disabled:bg-slate-50"
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1 block">Descrição</label>
                                <input
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Opcional"
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1 block">Tipo *</label>
                                <select
                                    value={form.type}
                                    onChange={e => handleTypeChange(e.target.value as CalendarEventType)}
                                    disabled={form.is_system}
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
                                >
                                    <option value="holiday">🏁 Feriado</option>
                                    <option value="event">📌 Evento</option>
                                    <option value="birthday">🎂 Aniversário</option>
                                </select>
                            </div>

                            {/* Data e formato */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1 block">
                                        {form.is_fixed ? 'Data (MM-DD) *' : 'Data Completa *'}
                                    </label>
                                    {form.is_fixed ? (
                                        <input
                                            value={form.date.slice(5)}
                                            onChange={e => {
                                                const mmdd = e.target.value;
                                                setForm(p => ({ ...p, date: `2000-${mmdd}` }));
                                            }}
                                            placeholder="MM-DD (ex: 12-25)"
                                            pattern="\d{2}-\d{2}"
                                            maxLength={5}
                                            disabled={form.is_system}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono disabled:opacity-50 disabled:bg-slate-50"
                                        />
                                    ) : (
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                            disabled={form.is_system}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1 block">Emoji</label>
                                    <button
                                        type="button"
                                        onClick={() => setEmojiPickerOpen(true)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all flex items-center gap-2 hover:border-blue-400 hover:bg-blue-50 bg-slate-50"
                                    >
                                        {form.emoji ? (
                                            <>
                                                <span className="text-2xl">{form.emoji}</span>
                                                <span className="text-slate-500 text-xs">Clique para trocar</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-slate-300 text-xl">😶</span>
                                                <span className="text-slate-400 text-xs">Clique para escolher</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {form.is_system && (
                                <p className="text-xs text-slate-500 mt-1">
                                    🔒 Feriado móvel calculado automaticamente pelo sistema. A data e tipo não podem ser alterados.
                                </p>
                            )}

                            {/* Checkboxes */}
                            <div className="flex gap-3">
                                <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.is_fixed ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={form.is_fixed}
                                        onChange={e => setForm(p => ({ ...p, is_fixed: e.target.checked, date: '' }))}
                                        disabled={form.type === 'birthday' || form.is_system}
                                        className="w-4 h-4 accent-amber-500"
                                    />
                                    <div>
                                        <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Evento Anual</p>
                                        <p className="text-[10px] text-slate-500">Repete todo ano automaticamente</p>
                                    </div>
                                </label>
                            </div>



                            {/* Botões */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={saving}
                                    className="flex-1 h-12 rounded-xl bg-white text-slate-600 font-bold text-[16px] md:text-base border border-slate-300 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-50 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold text-base shadow-[0_4px_0_#1E3A8A] hover:bg-blue-700 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Emoji Picker ── */}
            <EmojiPicker
                open={emojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
                onSelect={emoji => setForm(p => ({ ...p, emoji }))}
                currentEmoji={form.emoji}
            />

            {/* ── Modal Confirmar Exclusão ── */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-1 md:p-3 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setConfirmDeleteId(null)} />
                    <div className="relative bg-gradient-to-br from-[#F4F9FF] to-[#E6F0FD] rounded-[24px] shadow-2xl border border-blue-100 p-6 w-[99%] md:w-full md:max-w-sm z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center gap-2 mb-4 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-1">
                                <Trash2 size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Excluir Evento</h3>
                        </div>

                        <p className="text-slate-600 font-bold text-sm text-center mb-8 px-2 leading-relaxed">
                            Esta ação não pode ser desfeita. O evento será removido permanentemente do calendário.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deleting}
                                className="flex-1 h-12 rounded-xl bg-white text-slate-600 font-bold text-[16px] md:text-base border border-slate-300 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-50 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-[16px] md:text-base shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : null}
                                {deleting ? 'Aguarde...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCalendario;
