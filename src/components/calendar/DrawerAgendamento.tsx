"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, Trash2, User, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface Agendamento {
    id: string;
    userId?: string;
    dataInicio: string;
    dataFim: string;
    tipo: string;
    totalDias: number;
    status: string;
    observacao?: string;
    userName?: string;
    userPhoto?: string;
    createdAt?: string;
}

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
        className: 'bg-gray-50 text-gray-700 border-gray-200',
    }
};

interface DrawerAgendamentoProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'view';
    initialDate?: string;
    agendamentosNoDia?: Agendamento[];
    todosAgendamentos?: Agendamento[];
    onSave: (agendamento: Omit<Agendamento, 'id'>) => void;
    onDelete?: (id: string) => void;
    onUpdate?: (agendamento: Agendamento) => void;
    anchorRef: React.RefObject<HTMLDivElement>;
    selectedPeriod?: { start: string, end: string } | null;
    onSelectPeriod?: (period: { start: string, end: string } | null) => void;
    selectedAgendamentoId?: string | null;
    setSelectedAgendamentoId?: (id: string | null) => void;
}

const DrawerAgendamento: React.FC<DrawerAgendamentoProps> = ({
    isOpen,
    onClose,
    mode,
    initialDate,
    agendamentosNoDia = [],
    todosAgendamentos = [],
    onSave,
    onDelete,
    onUpdate,
    anchorRef,
    selectedPeriod,
    onSelectPeriod,
    selectedAgendamentoId,
    setSelectedAgendamentoId,
}) => {
    const { profile } = useAuth();
    const [dataInicio, setDataInicio] = useState(initialDate || '');
    const [dataFim, setDataFim] = useState(initialDate || '');
    const [tipo, setTipo] = useState<string>('');
    const [totalDias, setTotalDias] = useState(0);
    const [observacao, setObservacao] = useState('');

    // Estado do Range Calendar
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: initialDate ? parseISO(initialDate) : undefined,
        to: initialDate ? parseISO(initialDate) : undefined,
    });
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    // Estados de Edição
    const [modoEdicao, setModoEdicao] = useState(false);
    const [agendamentoEditando, setAgendamentoEditando] = useState<Agendamento | null>(null);

    useEffect(() => {
        if (mode === 'create') {
            setModoEdicao(false);
            setAgendamentoEditando(null);
            setDataInicio(initialDate || '');
            setDataFim(initialDate || '');
            setTipo('');
            setObservacao('');
            setDateRange({
                from: initialDate ? parseISO(initialDate) : undefined,
                to: initialDate ? parseISO(initialDate) : undefined,
            });
        }
    }, [isOpen, mode, initialDate]);

    useEffect(() => {
        if (modoEdicao && agendamentoEditando) {
            setDataInicio(agendamentoEditando.dataInicio);
            setDataFim(agendamentoEditando.dataFim);
            setTipo(agendamentoEditando.tipo);
            setObservacao(agendamentoEditando.observacao || '');
            setDateRange({
                from: parseISO(agendamentoEditando.dataInicio),
                to: parseISO(agendamentoEditando.dataFim),
            });
        }
    }, [modoEdicao, agendamentoEditando]);

    useEffect(() => {
        if (dataInicio && dataFim) {
            const start = new Date(dataInicio);
            const end = new Date(dataFim);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            const diffTime = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setTotalDias(diffDays > 0 ? diffDays : 0);
        } else {
            setTotalDias(0);
        }
    }, [dataInicio, dataFim]);

    // Efeito para scrollar até o agendamento selecionado
    useEffect(() => {
        if (isOpen && selectedAgendamentoId) {
            const element = document.getElementById(`agendamento-${selectedAgendamentoId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [isOpen, selectedAgendamentoId]);

    if (!isOpen) return null;

    const isFormValid = dataInicio && dataFim && tipo && totalDias > 0;

    const handleAgendar = () => {
        if (isFormValid) {
            if (modoEdicao && agendamentoEditando && onUpdate) {
                onUpdate({
                    ...agendamentoEditando,
                    dataInicio,
                    dataFim,
                    tipo,
                    totalDias,
                    observacao: observacao.trim(),
                });
                setModoEdicao(false);
                setAgendamentoEditando(null);
                // Não chama onClose aqui para voltar para a lista (view mode)
            } else {
                onSave({
                    dataInicio,
                    dataFim,
                    tipo,
                    totalDias,
                    status: 'Pendente',
                    observacao: observacao.trim(),
                });
                onClose();
            }
        }
    };

    // Atualiza Datas baseadas na selecao do Range
    const handleSelectRange = (range: DateRange | undefined) => {
        setDateRange(range);
        if (range?.from) {
            const dStr = format(range.from, 'yyyy-MM-dd');
            setDataInicio(dStr);
            if (!range.to) {
                setDataFim(dStr);
            }
        } else {
            setDataInicio('');
            setDataFim('');
        }
        if (range?.to) {
            setDataFim(format(range.to, 'yyyy-MM-dd'));
        }
    };

    // Sincroniza Inputs Manuais para o Calendario
    const updateRangeFromInputs = (inicio: string, fim: string) => {
        if (inicio && fim) {
            setDateRange({
                from: parseISO(inicio),
                to: parseISO(fim),
            });
        }
    };

    return (
        <div
            className={cn(
                "w-full z-[60] flex flex-col items-center justify-start p-0",
                "md:absolute md:top-0 md:left-0 md:h-full md:pointer-events-none md:animate-in md:fade-in md:zoom-in-95 md:duration-300",
                // Removemos o 'hidden md:flex' pois o isDrawerOpen já controla a existência no Calendar.tsx
                // No mobile, ele deve ser visível se isOpen for true
                !isOpen && "hidden"
            )}
        >
            <div
                className={cn(
                    "bg-white rounded-2xl md:rounded-[29px] shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.04),0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-[#0F172A]/[0.05]",
                    "w-full h-full md:pointer-events-auto flex flex-col overflow-hidden"
                )}
            >
                {/* Header do Drawer */}
                <div className="flex items-center justify-between p-2 md:p-3 bg-[linear-gradient(135deg,#0f3c78,#1f5fa8,#2f80ed)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">
                    <h2 className="text-[0.78rem] xs:text-[0.85rem] md:text-[1.1rem] font-bold text-white uppercase tracking-[0.5px] md:tracking-[1px] flex items-center gap-1.5 md:gap-2 whitespace-nowrap">
                        {modoEdicao ? (
                            <>
                                <span className="text-[1.1em] md:text-[1.25em]">📝</span>
                                <span>EDITAR AGENDAMENTO</span>
                            </>
                        ) : mode === 'create' ? (
                            <>
                                <span className="text-[1.1em] md:text-[1.25em]">✨</span>
                                <span>NOVO AGENDAMENTO</span>
                            </>
                        ) : (
                            <>
                                <span className="text-[1.1em] md:text-[1.25em]">📅</span>
                                <span className="opacity-90">AGENDAMENTOS DO DIA</span>
                                <span className="font-black">
                                    {initialDate && (() => {
                                        const d = new Date(initialDate + 'T12:00:00');
                                        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                                        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                                    })()}
                                </span>
                            </>
                        )}
                    </h2>
                    <button
                        onClick={() => {
                            if (modoEdicao) {
                                setModoEdicao(false);
                                setAgendamentoEditando(null);
                            } else {
                                onClose();
                            }
                        }}
                        className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] transition-all text-white shadow-lg active:scale-90"
                        title={modoEdicao ? "Voltar" : "Fechar"}
                    >
                        {modoEdicao ? (
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={4} />
                        ) : (
                            <X className="w-4 h-4 md:w-5 md:h-5" strokeWidth={4} />
                        )}
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 md:pt-3 md:pb-8 flex flex-col gap-4">
                    {mode === 'create' || modoEdicao ? (
                        <div className="flex flex-col gap-0">
                            {/* ESTRUTURA REORGANIZADA: DUAS COLUNAS (ESQUERDA: INPUTS | DIREITA: AVATAR) */}
                            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6 w-full bg-white pb-1 relative">
                                {/* Coluna Esquerda: Stack de Datas e Tipo */}
                                <div className="flex-1 flex flex-col gap-3.5 md:gap-3.5 w-full">
                                    {/* Linha 1: Datas e Avatar (no Mobile) */}
                                    <div className="flex flex-row items-start gap-2.5 md:gap-3.5 w-full mt-2 md:mt-3">
                                        {/* Bloco de Datas: Início e Fim */}
                                        <div className="flex-1 flex items-start gap-2 md:gap-3.5">
                                            {/* Data Inicial */}
                                            <div className="space-y-1.5 flex-1 md:w-[36%] min-w-0">
                                                <div className="flex items-center gap-1.5 ml-1">
                                                    <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase block truncate leading-none">Data Inicial</label>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        type="text"
                                                        value={dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : ''}
                                                        readOnly
                                                        onKeyDown={(e) => e.preventDefault()}
                                                        className="h-10 md:h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium text-slate-700 text-[13px] md:text-sm px-2.5 md:px-3 cursor-pointer flex-1 appearance-none bg-white shadow-sm"
                                                        onClick={() => setIsCalendarModalOpen(true)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Data Final */}
                                            <div className="space-y-1.5 flex-1 md:w-[36%] min-w-0">
                                                <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase ml-1 block truncate leading-none">Data Final</label>
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        type="text"
                                                        value={dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : ''}
                                                        readOnly
                                                        onKeyDown={(e) => e.preventDefault()}
                                                        className="h-10 md:h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium text-slate-700 text-[13px] md:text-sm px-2.5 md:px-3 cursor-pointer flex-1 appearance-none bg-white shadow-sm"
                                                        onClick={() => setIsCalendarModalOpen(true)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Campo Dias (Aparece ao lado das datas em Desktop) */}
                                            <div className="hidden md:block space-y-1.5 w-[70px] shrink-0">
                                                <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase ml-1 block truncate leading-none">Dias</label>
                                                <div className="h-10 md:h-11 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-center shadow-sm">
                                                    <span className="text-blue-700 font-extrabold text-sm">{totalDias}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Avatar no Mobile (Dentro da mesma linha das datas) */}
                                        <div className="flex md:hidden flex-col items-center justify-center shrink-0 w-[68px] -mt-1">
                                            <div className="w-[64px] h-[64px] rounded-xl overflow-hidden shadow-md border-2 border-white ring-4 ring-blue-50/15 bg-white">
                                                {agendamentoEditando?.userPhoto ? (
                                                    <img src={agendamentoEditando.userPhoto} alt={agendamentoEditando.userName} className="w-full h-full object-cover" />
                                                ) : mode === 'create' && profile?.foto_url ? (
                                                    <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                                                        <User className="size-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center mt-1 min-w-0">
                                                <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight block truncate w-full">
                                                    {agendamentoEditando?.userName?.split(' ')[0] || (mode === 'create' ? (profile?.apelido || profile?.nome?.split(' ')[0] || "Novo") : "Usuário")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linha 2 (Mobile): Tipo + Dias | (Desktop): Tipo de Agendamento */}
                                    <div className="flex flex-row items-end gap-2.5 md:gap-0 w-full md:w-[95%] -mt-2.5 md:mt-1.5">
                                        <div className="w-[74%] md:flex-1 space-y-1">
                                            <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase ml-1 block">Tipo de Agendamento</label>
                                            <Select value={tipo} onValueChange={setTipo}>
                                                <SelectTrigger className="h-10 md:h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium text-slate-700">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="🛌 Abonada">🛌 Abonada</SelectItem>
                                                    <SelectItem value="🏥 Atestado Médico">🏥 Atestado Médico</SelectItem>
                                                    <SelectItem value="⏳ Desconto de Hora">⏳ Desconto de Hora</SelectItem>
                                                    <SelectItem value="🩸 Doação de Sangue">🩸 Doação de Sangue</SelectItem>
                                                    <SelectItem value="🌤️ Folga Mensal">🌤️ Folga Mensal</SelectItem>
                                                    <SelectItem value="🗳️ Folga Eleitoral">🗳️ Folga Eleitoral</SelectItem>
                                                    <SelectItem value="🎂 Folga Aniversário">🎂 Folga Aniversário</SelectItem>
                                                    <SelectItem value="🏖️ Férias">🏖️ Férias</SelectItem>
                                                    <SelectItem value="🏝️ Licença Prêmio">🏝️ Licença Prêmio</SelectItem>
                                                    <SelectItem value="😷 Outros">😷 Outros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Campo Dias no Mobile (Ao lado do Tipo) */}
                                        <div className="flex md:hidden flex-col space-y-1 w-[60px] shrink-0 ml-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block truncate">Dias</label>
                                            <div className="h-10 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-center shadow-sm">
                                                <span className="text-blue-700 font-extrabold text-sm">{totalDias}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna Direita (Apenas Desktop): Avatar */}
                                <div className="hidden md:flex flex-col items-center justify-center shrink-0 md:ml-auto md:pl-2 mt-2 md:mt-4">
                                    <div className="w-16 h-16 md:w-[88px] md:h-[88px] rounded-2xl overflow-hidden shadow-md border-2 border-white ring-4 ring-blue-50/15 bg-white transition-transform hover:scale-105">
                                        {agendamentoEditando?.userPhoto ? (
                                            <img src={agendamentoEditando.userPhoto} alt={agendamentoEditando.userName} className="w-full h-full object-cover" />
                                        ) : mode === 'create' && profile?.foto_url ? (
                                            <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                                                <User className="size-9 md:size-11" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center mt-1.5 min-w-0">
                                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-tight block truncate max-w-[85px]">
                                            {agendamentoEditando?.userName?.split(' ')[0] || (mode === 'create' ? (profile?.apelido || profile?.nome?.split(' ')[0] || "Novo") : "Usuário")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Linha 3: Observação */}
                            <div className="space-y-1 relative mt-3 md:mt-4">
                                <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase ml-1 block">Observação</label>
                                <textarea
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value.slice(0, 100))}
                                    placeholder="Alguma observação importante..."
                                    className="w-full min-h-[80px] md:min-h-[90px] p-2.5 md:p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700 text-sm resize-none outline-none"
                                />
                                <div className="absolute bottom-2 right-3 text-[10px] font-bold text-slate-400">
                                    {observacao.length}/100
                                </div>
                            </div>

                            {/* Data de Criação Informativa e Status */}
                            {agendamentoEditando && (
                                <div className="mt-5 flex flex-col gap-2.5">
                                    {/* Exibir Status Atual do Agendamento */}
                                    <div className="flex items-center gap-2 ml-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
                                        {(() => {
                                            const statusKey = (agendamentoEditando.status || 'pendente').toLowerCase();
                                            const style = STATUS_STYLES[statusKey] || STATUS_STYLES.pendente;
                                            return (
                                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-tight shadow-sm border leading-none block text-center min-w-[70px]", style.className)}>
                                                    {style.label}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    {agendamentoEditando.createdAt && (
                                        <div className="flex items-center gap-1.5 text-slate-400 ml-1">
                                            <Clock className="size-3.5" />
                                            <span className="text-[11px] md:text-xs font-normal">
                                                Criado em {format(parseISO(agendamentoEditando.createdAt), "dd MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={cn(
                                "mt-auto pt-3 flex gap-4",
                                modoEdicao ? "flex-row" : "flex-col"
                            )}>
                                {modoEdicao && (
                                    <Button
                                        onClick={() => {
                                            setModoEdicao(false);
                                            setAgendamentoEditando(null);
                                        }}
                                        variant="outline"
                                        className="flex-1 h-10.5 md:h-12 rounded-2xl text-[0.9rem] md:text-[1rem] font-black uppercase tracking-wider border-red-200 text-red-600 hover:text-red-900 hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-sm"
                                    >
                                        Cancelar
                                    </Button>
                                )}
                                <Button
                                    onClick={handleAgendar}
                                    disabled={!isFormValid}
                                    className={cn(
                                        "h-10.5 md:h-12 rounded-2xl text-[0.9rem] md:text-[1rem] font-black uppercase tracking-wider transition-all duration-300",
                                        modoEdicao ? "flex-1" : "w-full",
                                        isFormValid
                                            ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                                            : "bg-slate-100 text-slate-400 border border-slate-200 grayscale opacity-60"
                                    )}
                                >
                                    {modoEdicao ? 'Salvar' : 'Agendar'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {agendamentosNoDia.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-slate-400 font-medium italic text-[14px]">Nenhum agendamento para este dia.</p>
                                </div>
                            ) : (
                                agendamentosNoDia.map((agenda) => {
                                    const emoji = agenda.tipo.split(' ')[0];
                                    const tipoNome = agenda.tipo.replace(emoji, '').trim();

                                    const formatDateAbbr = (dateStr: string, isStart: boolean) => {
                                        const d = new Date(dateStr + 'T12:00:00');
                                        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                                        const day = d.getDate();
                                        const month = months[d.getMonth()];
                                        // Mês inicial minúsculo, final maiúsculo (cap)
                                        const monthFormatted = isStart ? month : month.charAt(0).toUpperCase() + month.slice(1);
                                        return `${day}${monthFormatted}`;
                                    };

                                    const renderPeriod = () => {
                                        if (agenda.dataInicio === agenda.dataFim) {
                                            const d = new Date(agenda.dataInicio + 'T12:00:00');
                                            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                            return `${d.getDate()}${months[d.getMonth()]}${d.getFullYear()}`;
                                        }
                                        const start = formatDateAbbr(agenda.dataInicio, true);
                                        const end = formatDateAbbr(agenda.dataFim, false);
                                        const year = new Date(agenda.dataFim + 'T12:00:00').getFullYear();
                                        return `${start} - ${end}${year}`;
                                    };

                                    const isSelected = (selectedPeriod?.start === agenda.dataInicio && selectedPeriod?.end === agenda.dataFim) ||
                                        (selectedAgendamentoId === agenda.id);

                                    const handleCardClick = () => {
                                        if (setSelectedAgendamentoId) {
                                            setSelectedAgendamentoId(agenda.id);
                                        }
                                        if (onSelectPeriod) {
                                            onSelectPeriod({ start: agenda.dataInicio, end: agenda.dataFim });
                                        }
                                    };

                                    return (
                                        <div
                                            key={agenda.id}
                                            id={`agendamento-${agenda.id}`}
                                            onClick={handleCardClick}
                                            className={cn(
                                                "p-2.5 md:p-3 rounded-2xl border bg-gradient-to-br from-[#ebf4ff] via-[#f0f7ff] to-[#e1effe] hover:from-[#e1effe] hover:to-[#ebf4ff] transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03),0_2px_4px_-2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] group relative cursor-pointer",
                                                isSelected
                                                    ? "border-blue-500 ring-2 ring-blue-200 shadow-lg scale-[1.01] md:scale-[1.02]"
                                                    : "border-white/60 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)]"
                                            )}
                                        >
                                            <div className="grid grid-cols-[65px_1fr_52px_38px] md:grid-cols-[80px_1fr_auto_50px] grid-rows-[auto_auto_auto] gap-x-2 md:gap-x-3.5 gap-y-1 items-center relative">
                                                {/* COLUNA 1: USUÁRIO */}
                                                <div className="col-start-1 row-start-1 row-span-3 flex flex-col items-center justify-center gap-1 md:gap-1.5 self-stretch my-0.5 -ml-2 md:-ml-1.5">
                                                    <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm shrink-0">
                                                        {agenda.userPhoto ? (
                                                            <img src={agenda.userPhoto} alt={agenda.userName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                                                                <User className="w-4.5 h-4.5 md:w-[22px] md:h-[22px]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 leading-tight text-center break-words max-w-[60px] md:max-w-[70px] uppercase">
                                                        {agenda.userName || "Usuário"}
                                                    </span>
                                                </div>

                                                {/* COLUNA 2: CONTEÚDO */}
                                                <div className="col-start-2 row-start-1 flex items-center gap-1.5 md:gap-2 overflow-hidden py-0.5 -ml-2 md:ml-0">
                                                    <span className="text-[1rem] md:text-[1.1rem] drop-shadow-sm leading-none shrink-0">{emoji}</span>
                                                    <span className="text-[11.5px] md:text-[clamp(12px,0.85vw,13.5px)] font-black text-slate-800 uppercase tracking-tight truncate">
                                                        {tipoNome}
                                                    </span>
                                                </div>
                                                <div className="col-start-2 row-start-2 flex items-center gap-1 md:gap-1.5 overflow-hidden -ml-2 md:ml-0">
                                                    <span className="text-[11px] md:text-[12px] leading-none opacity-70">📅</span>
                                                    <span className="text-[10.5px] md:text-[clamp(11px,0.85vw,12px)] font-bold text-slate-700/80 whitespace-nowrap text-ellipsis block">
                                                        {renderPeriod()}
                                                    </span>
                                                </div>
                                                {agenda.observacao && (
                                                    <div className="col-start-2 col-span-2 row-start-3 italic text-[9.5px] md:text-[10.5px] text-slate-500 leading-tight py-0.5 pr-1 md:pr-2 break-words -ml-2 md:ml-0">
                                                        "{agenda.observacao}"
                                                    </div>
                                                )}

                                                {/* COLUNA 3: STATUS / DURAÇÃO */}
                                                <div className="col-start-3 row-start-1 justify-self-end py-0.5">
                                                    {(() => {
                                                        const statusKey = (agenda.status || 'pendente').toLowerCase();
                                                        const style = STATUS_STYLES[statusKey] || STATUS_STYLES.pendente;
                                                        return (
                                                            <span className={cn("px-1 md:px-2 py-0.5 rounded-full text-[8.5px] md:text-[9.5px] font-bold uppercase tracking-tight shadow-sm border leading-none block text-center min-w-[60px]", style.className)}>
                                                                {style.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="col-start-3 row-start-2 justify-self-end flex items-center">
                                                    <span className="text-[10px] md:text-[clamp(11.5px,0.85vw,12.5px)] font-black text-blue-700 whitespace-nowrap drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                                                        {agenda.totalDias} dias
                                                    </span>
                                                </div>

                                                {/* COLUNA 4: AÇÕES VERTICAL */}
                                                {profile && (agenda.userId === profile.id || profile.perfil === 'administrador') && (
                                                    <div className="col-start-4 row-start-1 row-span-3 self-stretch border-l border-black/[0.06] bg-slate-50/40 -my-2.5 md:-my-3 -mr-2.5 md:-mr-3 flex flex-col items-center justify-center gap-0 acoes rounded-r-2xl">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setModoEdicao(true);
                                                                setAgendamentoEditando(agenda);
                                                            }}
                                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group/btn"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 md:w-[15px] md:h-[15px] group-hover/btn:scale-110 transition-transform" />
                                                        </button>

                                                        <div className="w-[50%] h-[1px] bg-black/[0.06] my-0.5" />

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Deseja realmente excluir este agendamento?')) {
                                                                    onDelete?.(agenda.id);
                                                                }
                                                            }}
                                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-all group/btn"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 md:w-[15px] md:h-[15px] group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Centralizado do Calendário */}
            {
                isCalendarModalOpen && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200 pointer-events-auto">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCalendarModalOpen(false)} />
                        <div className="relative bg-white rounded-2xl md:rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 z-10 flex flex-col animate-in zoom-in-95 duration-200 w-[98%] max-w-[98%] md:w-full md:max-w-[380px] overflow-hidden max-h-[90vh]">
                            <div className="w-full flex justify-between items-center p-4 md:px-5 bg-[linear-gradient(135deg,#0f3c78,#1f5fa8,#2f80ed)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">
                                <h3 className="font-bold text-white uppercase tracking-[1px] text-sm">Selecione o Período</h3>
                                <button
                                    onClick={() => setIsCalendarModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] transition-all text-white shadow-md active:scale-90"
                                    title="Fechar"
                                >
                                    <X size={18} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="px-4 md:px-5 pt-3 pb-3 flex items-center justify-center w-full">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={handleSelectRange}
                                    showOutsideDays={false}
                                    locale={ptBR}
                                    modifiers={{
                                        agendado: (date: Date) => {
                                            const dStr = format(date, 'yyyy-MM-dd');
                                            return todosAgendamentos?.some(a => a.dataInicio <= dStr && a.dataFim >= dStr);
                                        }
                                    }}
                                    modifiersClassNames={{
                                        agendado: "after:content-[''] after:absolute after:bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-blue-500 after:rounded-full font-bold relative text-blue-800 bg-blue-50"
                                    }}
                                    className="bg-white"
                                    classNames={{
                                        months: "flex flex-col sm:flex-row w-full justify-center max-w-full",
                                        month: "w-full flex flex-col",
                                        caption: "order-1 flex justify-center pt-0 relative items-center pb-2",
                                        caption_label: "font-black text-[0.95rem] uppercase tracking-wider text-slate-800",
                                        nav: "space-x-1 flex items-center bg-slate-50 rounded-lg p-0.5 shadow-sm border border-slate-100",
                                        nav_button: "h-7 w-7 bg-transparent p-0 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center rounded-md hover:bg-slate-200/50",
                                        nav_button_previous: "absolute left-0",
                                        nav_button_next: "absolute right-0",
                                        table: "order-3 w-[min-content] mx-auto border-separate border-spacing-y-1.5 border-spacing-x-1 max-w-full",
                                        head_row: "flex w-full justify-center gap-1",
                                        head_cell: "text-[12px] md:text-[13px] font-bold tracking-[0.4px] uppercase flex items-center justify-center rounded-[13px] h-10 w-10 md:h-12 md:w-12 bg-gradient-to-b from-[#F4F6F8] to-[#E6E9ED] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.08)] text-slate-700 first:text-slate-700 last:text-slate-700 m-0",
                                        row: "flex w-full justify-center gap-1 group relative",
                                        cell: "h-10 w-10 md:h-12 md:w-12 text-center p-0 m-0 relative focus-within:z-20 bg-transparent text-slate-700 first:text-slate-700 last:text-slate-700",
                                        day: "h-10 w-10 md:h-12 md:w-12 p-0 flex items-center justify-center relative rounded-[13px] text-sm md:text-base font-semibold bg-white bg-clip-padding saturate-[1.05] transition-all duration-200 ease-out border border-slate-200 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:brightness-[1.05] cursor-pointer text-inherit outline-none focus-visible:ring-1 focus-visible:ring-blue-400",
                                        day_range_start: "day-range-start !bg-[#93C5FD] !text-[#1e3a8a] !font-bold ring-2 ring-white !shadow-[0_2px_8px_rgba(59,130,246,0.3)] z-20 !scale-[1.02]",
                                        day_range_end: "day-range-end !bg-[#93C5FD] !text-[#1e3a8a] !font-bold ring-2 ring-white !shadow-[0_2px_8px_rgba(59,130,246,0.3)] z-20 !scale-[1.02]",
                                        day_range_middle: "aria-selected:!bg-[#DBEAFE] aria-selected:!text-[#1E3A8A] !shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.05)] font-bold",
                                        day_selected: "font-bold !bg-[#93C5FD] !text-[#1E40AF]",
                                        day_today: "ring-2 ring-inset ring-[#C62828] font-black shadow-[0_4px_12px_-4px_rgba(198,40,40,0.25)] z-10",
                                        day_outside: "text-transparent bg-transparent opacity-0 pointer-events-none shadow-none",
                                        day_disabled: "text-slate-300 opacity-50 font-normal grayscale pointer-events-none",
                                    }}
                                    components={{
                                        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                                        IconRight: () => <ChevronRight className="h-4 w-4" />,
                                        Footer: () => {
                                            const rInicio = dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : 'XX/XX/XXXX';
                                            const rFim = dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : '—';
                                            return (
                                                <div className="w-full mt-2 mb-1 md:mb-0 bg-slate-50/80 border border-slate-200/80 rounded-[12px] py-2 px-3 sm:px-4 flex flex-wrap sm:flex-nowrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-1 shadow-sm mx-auto max-w-[320px] sm:max-w-full">
                                                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap">
                                                        <span>Inicial:</span>
                                                        <strong className="text-[#1E40AF] font-semibold">{rInicio}</strong>
                                                    </div>
                                                    <span className="text-slate-300 hidden sm:block">|</span>
                                                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap">
                                                        <span>Final:</span>
                                                        <strong className="text-[#1E40AF] font-semibold">{rFim}</strong>
                                                    </div>
                                                    <span className="text-slate-300 hidden sm:block">|</span>
                                                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap">
                                                        <span>Total:</span>
                                                        <strong className="text-[#1E40AF] font-semibold">{totalDias} {totalDias === 1 ? 'dia' : 'dias'}</strong>
                                                    </div>
                                                </div>
                                            );
                                        },
                                        DayContent: (props: { date: Date }) => {
                                            const dStr = format(props.date, 'yyyy-MM-dd');
                                            const ags = todosAgendamentos?.filter(a => a.dataInicio <= dStr && a.dataFim >= dStr);
                                            const titleText = ags?.length > 0 ? ags.map(a => `${a.tipo.split(' ')[0]} ${a.userName || 'Usuário'}`).join('\n') : undefined;
                                            return (
                                                <div title={titleText} className="w-full h-full flex flex-col items-center justify-center relative cursor-pointer">
                                                    <span>{props.date.getDate()}</span>
                                                </div>
                                            );
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default DrawerAgendamento;
