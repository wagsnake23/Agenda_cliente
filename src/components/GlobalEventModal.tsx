"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCalendarEventsContext } from '@/context/CalendarEventsContext';
import { useToast } from '@/contexts/ToastProvider';
import { X, Check, Loader2 } from 'lucide-react';
import type { CalendarEvent, CalendarEventType, ColorMode } from '@/hooks/use-calendar-events';
import EmojiPicker from '@/components/EmojiPicker';

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
    is_fixed: false,
    color_mode: 'event_only',
    emoji: '',
    is_active: true,
    is_system: false,
};

const SYSTEM_HOLIDAYS = [
    'Carnaval', 'Quarta-feira de Cinzas', 'Sexta-feira Santa',
    'Páscoa', 'Corpus Christi', 'Dia das Mães', 'Dia dos Pais',
    'Ano Novo', 'Tiradentes', 'Dia do Trabalho', 'Independência do Brasil',
    'Nossa Senhora Aparecida', 'Finados',
    'Proclamação da República', 'Dia da Consciência Negra', 'Natal',
    'Revolução Constitucionalista'
];

const GlobalEventModal = () => {
    const { isAdmin, user, checkSession } = useAuth();
    const { refetch } = useCalendarEventsContext();
    const { showSuccessToast, showErrorToast } = useToast();

    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<EventForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    useEffect(() => {
        const handleOpen = (event: Event) => {
            const customEvent = event as CustomEvent;
            const detail = customEvent.detail || {};
            
            if (detail.mode === 'edit' && detail.event) {
                const ev = detail.event as CalendarEvent;
                setEditingId(ev.id);
                
                let formDate = ev.date;
                if (!ev.is_fixed) {
                    formDate = ev.date.substring(0, 16).replace(' ', 'T');
                }

                setForm({
                    title: ev.title,
                    description: ev.description || '',
                    date: formDate,
                    type: ev.type,
                    is_fixed: ev.is_fixed,
                    color_mode: ev.color_mode,
                    emoji: ev.emoji || '',
                    is_active: ev.is_active,
                    is_system: ev.is_system || false,
                });
            } else {
                setEditingId(null);
                setForm(EMPTY_FORM);
                if (detail.initialDate) {
                    setForm(prev => ({ ...prev, date: detail.initialDate }));
                }
            }
            setIsOpen(true);
        };

        window.addEventListener('open-global-event-modal', handleOpen);
        return () => window.removeEventListener('open-global-event-modal', handleOpen);
    }, []);

    const handleTypeChange = (type: CalendarEventType) => {
        setForm(prev => ({
            ...prev,
            type,
            ...(type === 'birthday' ? { is_fixed: true, color_mode: 'event_only' as ColorMode } : {}),
            ...(type === 'holiday' ? { color_mode: 'holiday' as ColorMode } : {}),
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { showErrorToast('Nome é obrigatório'); return; }
        if (!form.date) { showErrorToast('Data é obrigatória'); return; }

        if (!editingId && SYSTEM_HOLIDAYS.includes(form.title.trim())) {
            showErrorToast('Este feriado é calculado automaticamente pelo sistema.');
            return;
        }

        const session = await checkSession();
        if (!session) {
            showErrorToast('Sua sessão expirou. Por favor, faça login novamente.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                date: form.is_fixed ? (form.date.includes('T') ? form.date.split('T')[0] : form.date) : form.date.replace('T', ' '),
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

            setIsOpen(false);
            refetch();
        } catch (err: any) {
            showErrorToast(err.message || 'Erro ao salvar evento');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-1 sm:p-3">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setIsOpen(false)} />
            <div className="relative bg-white rounded-[24px] shadow-2xl border border-slate-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1.5px_1px_white] w-[99%] max-w-lg z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0f3c78] to-[#2f80ed]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0_2px_0_#93c5fd,inset_0_1.5px_1px_white] border border-blue-200/80 shrink-0">
                            <span className="text-lg drop-shadow-sm">
                                {editingId ? '✏️' : '➕'}
                            </span>
                        </div>
                        <h3 className="font-bold text-white text-[1.05rem] md:text-[1.15rem]">
                            {editingId ? 'Editar Evento' : 'Novo Evento'}
                        </h3>
                    </div>
                    <button
                        onClick={() => !saving && setIsOpen(false)}
                        className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] text-white shadow-lg active:scale-90 transition-all font-black"
                    >
                        <X size={22} strokeWidth={4} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                    <div>
                        <label className="text-[13px] font-semibold text-slate-500 mb-1 block">Nome *</label>
                        <input
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            disabled={form.is_system}
                            placeholder="Ex: Natal"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium disabled:opacity-50 disabled:bg-slate-50"
                        />
                    </div>

                    <div>
                        <label className="text-[13px] font-semibold text-slate-500 mb-1 block">Descrição</label>
                        <input
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Opcional"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-[13px] font-semibold text-slate-500 mb-1 block">Tipo *</label>
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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[13px] font-semibold text-slate-500 mb-1 block">
                                {form.is_fixed ? 'Data (Mês-Dia) *' : 'Data Completa *'}
                            </label>
                            {form.is_fixed ? (
                                <input
                                    value={form.date.slice(5)}
                                    onChange={e => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 0) {
                                            let m = val.slice(0, 2);
                                            if (m.length === 1 && parseInt(m) > 1) { m = '0' + m; val = m + val.slice(1); }
                                            if (m.length === 2) {
                                                if (parseInt(m) > 12) m = '12';
                                                if (parseInt(m) === 0) m = '01';
                                                val = m + val.slice(2);
                                            }
                                            if (val.length > 2) {
                                                let d = val.slice(2, 4);
                                                if (d.length === 1 && parseInt(d) > 3) { d = '0' + d; val = val.slice(0, 2) + d; }
                                                if (d.length === 4) {
                                                    let d2 = val.slice(2, 4);
                                                    if (parseInt(d2) > 31) d2 = '31';
                                                    if (parseInt(d2) === 0) d2 = '01';
                                                    val = val.slice(0, 2) + d2;
                                                }
                                            }
                                        }
                                        let formatted = val.slice(0, 2);
                                        if (val.length > 2) formatted += '-' + val.slice(2, 4);
                                        setForm(p => ({ ...p, date: `2000-${formatted.slice(0, 5)}` }));
                                    }}
                                    placeholder="(Mês-Dia)"
                                    maxLength={5}
                                    disabled={form.is_system}
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono disabled:opacity-50 disabled:bg-slate-50"
                                />
                            ) : (
                                <input
                                    type="datetime-local"
                                    value={form.date}
                                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                    disabled={form.is_system}
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-[13px] font-semibold text-slate-500 mb-1 block">Emoji</label>
                            <button
                                type="button"
                                onClick={() => setEmojiPickerOpen(true)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500 transition-all flex items-center gap-2 hover:border-blue-400 hover:bg-blue-50 bg-slate-50"
                            >
                                {form.emoji ? (
                                    <>
                                        <span className="text-2xl">{form.emoji}</span>
                                        <span className="text-slate-500 text-xs">Trocar</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-slate-300 text-xl">😶</span>
                                        <span className="text-slate-400 text-xs">Escolher</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

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
                                <p className="text-[13px] font-semibold text-slate-700">Evento Anual</p>
                                <p className="text-[10px] text-slate-500">Repete todo ano automaticamente</p>
                            </div>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            disabled={saving}
                            className="flex-1 h-12 rounded-xl bg-white text-slate-600 font-bold text-[17px] border border-slate-300 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-50 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold text-[17px] shadow-[0_4px_0_#1E3A8A] hover:bg-blue-700 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>

            <EmojiPicker
                open={emojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
                onSelect={emoji => setForm(p => ({ ...p, emoji }))}
                currentEmoji={form.emoji}
            />
        </div>
    );
};

export default GlobalEventModal;
