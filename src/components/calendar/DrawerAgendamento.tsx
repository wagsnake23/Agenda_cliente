"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, SquarePen, Trash2, User, Calendar as CalendarIcon, Clock } from 'lucide-react';
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
    approvedAt?: string;
    cancelledAt?: string;
    rejectedAt?: string;
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

const ConfirmDialog: React.FC<{
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    message: string;
}> = ({ open, onConfirm, onCancel, message }) => {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-1 md:p-3 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onCancel(); }} />
            <div className="relative bg-gradient-to-br from-[#F4F9FF] to-[#E6F0FD] rounded-[24px] shadow-2xl border border-blue-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1.5px_1px_white] p-6 md:p-8 w-[99%] md:w-full md:max-w-md z-10 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
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
                        onClick={(e) => { e.stopPropagation(); onCancel(); }}
                        className="flex-1 h-12 rounded-xl bg-slate-200 text-slate-600 font-bold text-[17px] border border-slate-300 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-300 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                        className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold text-[17px] shadow-[0_4px_0_#991B1B] hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

interface DrawerAgendamentoProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'view' | 'edit';
    initialDate?: string;
    agendamentoExternoParaEdicao?: Agendamento | null;
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
    variant?: 'drawer' | 'modal';
    onEditRequest?: (ag: Agendamento) => void;
}

const DrawerAgendamento: React.FC<DrawerAgendamentoProps> = ({
    isOpen,
    onClose,
    mode,
    initialDate,
    agendamentoExternoParaEdicao,
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
    variant = 'drawer',
    onEditRequest,
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
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        } else if (mode === 'edit' && agendamentoExternoParaEdicao) {
            setModoEdicao(true);
            setAgendamentoEditando(agendamentoExternoParaEdicao);
            setDataInicio(agendamentoExternoParaEdicao.dataInicio);
            setDataFim(agendamentoExternoParaEdicao.dataFim);
            setTipo(agendamentoExternoParaEdicao.tipo);
            setObservacao(agendamentoExternoParaEdicao.observacao || '');
            setDateRange({
                from: parseISO(agendamentoExternoParaEdicao.dataInicio),
                to: parseISO(agendamentoExternoParaEdicao.dataFim),
            });
        }
    }, [isOpen, mode, initialDate, agendamentoExternoParaEdicao]);

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

    // Efeito para fechar o drawer automaticamente se não houver agendamentos em modo de visualização
    useEffect(() => {
        if (isOpen && mode === 'view' && (!agendamentosNoDia || agendamentosNoDia.length === 0)) {
            onClose();
        }
    }, [isOpen, mode, agendamentosNoDia, onClose]);

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

                if (mode === 'edit') {
                    onClose();
                } else {
                    setModoEdicao(false);
                    setAgendamentoEditando(null);
                }
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
                variant === 'modal' ? "fixed inset-0 z-[200] flex items-center justify-center p-1 sm:p-4" : "w-full z-[60] flex flex-col items-center justify-start p-0",
                variant === 'drawer' && "md:absolute md:top-0 md:left-0 md:h-full md:pointer-events-none md:animate-in md:fade-in md:zoom-in-95 md:duration-300",
                !isOpen && "hidden"
            )}
        >
            {variant === 'modal' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            )}
            <div
                className={cn(
                    "bg-white flex flex-col overflow-hidden",
                    variant === 'modal' 
                        ? "rounded-[24px] shadow-2xl border border-slate-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1.5px_1px_white] w-[99%] md:max-w-[515px] relative z-10 animate-in zoom-in-95 duration-200" 
                        : "rounded-2xl md:rounded-[29px] w-full h-full md:pointer-events-auto border border-[#0F172A]/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.04),0_32px_64px_-12px_rgba(0,0,0,0.08)]"
                )}
                style={variant === 'modal' ? { maxHeight: '95vh' } : {}}
            >
                {/* Header do Drawer */}
                <div className={cn(
                    "flex items-center justify-between shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)] transition-colors duration-300",
                    variant === 'modal'
                        ? (mode === 'create'
                            ? "px-6 md:px-5 py-4 bg-gradient-to-b from-[#facc15] to-[#eab308]"
                            : "px-6 md:px-5 py-4 bg-gradient-to-r from-[#0f3c78] to-[#2f80ed]")
                        : "p-2 md:p-3 bg-[linear-gradient(135deg,#0f3c78,#1f5fa8,#2f80ed)]"
                )}>
                    <div className="flex flex-row items-center gap-2.5 md:gap-3.5 pt-0.5 md:pt-0">
                        {(!modoEdicao && mode !== 'create') ? (
                            <span className="text-lg md:text-xl drop-shadow-sm shrink-0">📋</span>
                        ) : (
                            <div className={cn(
                                "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl shrink-0 transition-all duration-300",
                                mode === 'create' 
                                    ? "bg-yellow-50/90 shadow-[0_2px_0_#facc15/30,inset_0_1.5px_1px_white] border border-yellow-200/50"
                                    : "bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0_2px_0_#93c5fd,inset_0_1.5px_1px_white] border border-blue-200/80"
                            )}>
                                <span className="text-lg md:text-xl drop-shadow-sm">
                                    📝
                                </span>
                            </div>
                        )}

                        <div className="flex flex-col justify-center min-w-0">
                            <h2 className={cn(
                                "font-black leading-tight transition-all",
                                mode === 'create' ? "text-slate-900 text-[1.1rem] md:text-[1.35rem]" : "text-white text-[0.95rem] xs:text-[1.05rem] md:text-[1.25rem] drop-shadow-sm"
                            )}>
                                {modoEdicao ? (
                                    <span>Editar Agendamento</span>
                                ) : mode === 'create' ? (
                                    <span>Novo Agendamento</span>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-x-2">
                                        <span className="opacity-100 md:opacity-90">Agendamentos do dia</span>
                                        <span className="opacity-100 font-extrabold">
                                            {initialDate && (() => {
                                                const d = new Date(initialDate + 'T12:00:00');
                                                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                                return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </h2>
                            {modoEdicao && agendamentoEditando?.createdAt && (
                                <div className={cn(
                                    "font-medium text-left leading-tight mt-0.5",
                                    mode === 'create' ? "text-[#0B1221]/70 text-[10px] md:text-[13px]" : "text-white/80 text-[10px] md:text-[13px]"
                                )}>
                                    Criado em {format(parseISO(agendamentoEditando.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (variant === 'modal' || !modoEdicao) {
                                onClose();
                            } else {
                                setModoEdicao(false);
                                setAgendamentoEditando(null);
                            }
                        }}
                        className={cn(
                            "flex items-center justify-center rounded-full transition-all text-white shadow-lg active:scale-90",
                            variant === 'modal' ? "w-7 h-7 md:w-10 md:h-10 bg-[#E53935] hover:bg-[#C62828]" : (mode === 'create' ? "w-6 h-6 md:w-8 md:h-8 bg-red-500/90 hover:bg-red-600" : "w-7 h-7 md:w-10 md:h-10 bg-[#E53935] hover:bg-[#C62828]")
                        )}
                        title={variant === 'modal' ? "Fechar" : (modoEdicao ? "Voltar" : "Fechar")}
                    >
                        {variant === 'modal' || !modoEdicao ? (
                            <X className="w-4 h-4 md:w-[22px] md:h-[22px]" strokeWidth={4} />
                        ) : (
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={4} />
                        )}
                    </button>
                </div>

                <div className={cn(
                    "flex-1 overflow-y-auto flex flex-col gap-4",
                    variant === 'modal' ? "px-3 py-4 md:px-5 md:py-6" : "px-3 py-4 md:px-[16px] md:pt-3 md:pb-1"
                )}>
                    {mode === 'create' || modoEdicao ? (
                        <div className="flex flex-col gap-0">
                            {/* ESTRUTURA REORGANIZADA: GRID 3 COLUNAS MOBILE | FLEX DESKTOP */}
                            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6 w-full bg-white pb-1 relative">
                                {/* Coluna Esquerda / Principal */}
                                <div className="flex-1 w-full">
                                    {/* Grid Superior: Datas e Avatar (Mobile) | Datas e Dias (Desktop) */}
                                    <div className="grid grid-cols-[1fr_1fr_88px] md:flex md:flex-row gap-x-2 gap-y-2.5 md:gap-3.5 w-full mt-2 md:mt-3 items-start">
                                        {/* Data Inicial */}
                                        <div className="space-y-1.5 min-w-0 md:w-[120px]">
                                            <label className="text-[10px] md:text-[11px] font-semibold text-slate-500 block truncate leading-none transition-all">Data inicial</label>
                                            <Input
                                                type="text"
                                                value={dataInicio ? format(parseISO(dataInicio), 'dd/MM/yyyy') : ''}
                                                readOnly
                                                onKeyDown={(e) => e.preventDefault()}
                                                className={cn(
                                                    "w-full h-10 md:h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium text-slate-700 px-2 md:px-3 cursor-pointer appearance-none bg-white shadow-sm",
                                                    variant === 'modal' ? "text-[13px] md:text-[15px]" : "text-[13px] md:text-sm"
                                                )}
                                                onClick={() => setIsCalendarModalOpen(true)}
                                            />
                                        </div>

                                        {/* Data Final */}
                                        <div className="space-y-1.5 min-w-0 md:w-[120px]">
                                            <label className="text-[10px] md:text-[11px] font-semibold text-slate-500 ml-1 block truncate leading-none transition-all">Data final</label>
                                            <Input
                                                type="text"
                                                value={dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy') : ''}
                                                readOnly
                                                onKeyDown={(e) => e.preventDefault()}
                                                className={cn(
                                                    "w-full h-10 md:h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium text-slate-700 px-2 md:px-3 cursor-pointer appearance-none bg-white shadow-sm",
                                                    variant === 'modal' ? "text-[13px] md:text-[15px]" : "text-[13px] md:text-sm"
                                                )}
                                                onClick={() => setIsCalendarModalOpen(true)}
                                            />
                                        </div>

                                        {/* Avatar no Mobile (3ª Coluna) */}
                                        <div className="flex md:hidden flex-col items-center justify-start shrink-0 justify-self-end transform translate-y-[-10px]">
                                            <div className={cn(
                                                "rounded-xl overflow-hidden shadow-sm border border-black/[0.08] transition-all bg-white",
                                                mode === 'create' ? "w-[88px] h-[88px]" : "w-[84px] h-[84px]"
                                            )}>
                                                {agendamentoEditando?.userPhoto ? (
                                                    <img src={agendamentoEditando.userPhoto} alt={agendamentoEditando.userName} className="w-full h-full object-cover" />
                                                ) : mode === 'create' && profile?.foto_url ? (
                                                    <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                                                        <User className={cn(mode === 'create' ? "size-9" : "size-[32px]")} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center mt-1 min-w-0">
                                                <span className={cn(
                                                    "font-bold text-slate-500 uppercase tracking-tight block truncate w-full",
                                                    mode === 'create' ? "text-[11px]" : "text-[10px]"
                                                )}>
                                                    {agendamentoEditando?.userName?.split(' ')[0] || (mode === 'create' ? (profile?.apelido || profile?.nome?.split(' ')[0] || "Novo") : "Usuário")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Campo Dias (Aparece ao lado das datas em Desktop) */}
                                        <div className="hidden md:block space-y-1.5 w-[70px] shrink-0">
                                            <label className="text-[10px] md:text-[11px] font-semibold text-slate-500 ml-1 block truncate leading-none">Dias</label>
                                            <div className="h-10 md:h-11 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-center shadow-sm">
                                                <span className="text-blue-700 font-extrabold text-sm">{totalDias}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linha 2 Grid Mobile / Flex Desktop */}
                                    <div className="grid grid-cols-[1fr_1fr_88px] md:flex md:flex-row gap-x-2 md:gap-0 w-full md:w-[95%] mt-[-6px] md:mt-4 items-end">
                                        {/* Tipo de Agendamento (Ocupa 2 colunas no mobile) */}
                                        <div className="col-span-2 md:flex-1 space-y-1">
                                            <label className="text-[10px] md:text-[11px] font-semibold text-slate-500 ml-1 block transition-all">Tipo de agendamento</label>
                                            <Select value={tipo} onValueChange={setTipo}>
                                                <SelectTrigger className={cn(
                                                    "h-10 md:h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium text-slate-700",
                                                    variant === 'modal' ? "md:text-[15px]" : "text-sm"
                                                )}>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="z-[350]">
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
                                        <div className="flex md:hidden flex-col items-center justify-center space-y-1 w-[88px] shrink-0">
                                            <label className="text-[10px] font-semibold text-slate-500 block truncate">Qtde. dias</label>
                                            <div className="h-10 w-full rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-center shadow-sm">
                                                <span className="text-blue-700 font-extrabold text-sm">{totalDias}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna Direita (Apenas Desktop): Avatar */}
                                <div className={cn(
                                    "hidden md:flex flex-col items-center justify-center shrink-0 mt-2 md:mt-4",
                                    variant === 'modal' ? "md:ml-auto md:pl-0" : "md:ml-0 md:pl-0"
                                )}>
                                    <div className={cn(
                                        "rounded-2xl overflow-hidden shadow-md border-2 border-white",
                                        mode === 'create' ? "w-[84px] h-[84px] md:w-[120px] md:h-[120px] bg-white" : "w-16 h-16 md:w-[120px] md:h-[120px] ring-4 ring-blue-50/15 bg-white"
                                    )}>
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
                                        <span className={cn(
                                            "font-bold text-slate-500 uppercase tracking-tight block truncate max-w-[100px]",
                                            variant === 'modal' ? "text-[10.5px] md:text-[13px]" : "text-[10px] md:text-[11px]"
                                        )}>
                                            {agendamentoEditando?.userName?.split(' ')[0] || (mode === 'create' ? (profile?.apelido || profile?.nome?.split(' ')[0] || "Novo") : "Usuário")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Linha 3: Observação */}
                            <div className="space-y-1 relative mt-5 md:mt-3">
                                <label className="text-[10px] md:text-[11px] font-semibold text-slate-500 ml-1 block transition-all">Observação</label>
                                <textarea
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value.slice(0, 100))}
                                    placeholder="Alguma observação importante..."
                                    className={cn(
                                        "w-full min-h-[80px] md:min-h-[85px] p-2.5 md:p-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700 resize-none outline-none",
                                        variant === 'modal' ? "text-[13px] md:text-[15px]" : "text-sm"
                                    )}
                                />
                                <div className="absolute bottom-2 right-3 text-[10px] font-bold text-slate-400">
                                    {observacao.length}/100
                                </div>
                            </div>

                            {/* Data de Criação Informativa e Status */}
                            {agendamentoEditando && (
                                <div className="mt-2 md:mt-2 flex flex-col gap-2.5">
                                    {/* Exibir Status Atual do Agendamento e Data da Ação */}
                                    <div className="flex flex-col items-start gap-1 md:gap-2 ml-1">
                                        <div className="flex flex-row items-center gap-2">
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
                                        {(() => {
                                            const s = agendamentoEditando.status?.toLowerCase();
                                            let dateVal = null;
                                            
                                            if (s === 'aprovado' && agendamentoEditando.approvedAt) { dateVal = agendamentoEditando.approvedAt; }
                                            if (s === 'cancelado' && agendamentoEditando.cancelledAt) { dateVal = agendamentoEditando.cancelledAt; }
                                            if (s === 'recusado' && agendamentoEditando.rejectedAt) { dateVal = agendamentoEditando.rejectedAt; }

                                            if (!dateVal) return null;

                                            return (
                                                <div className="flex items-center gap-1.5 text-slate-600 mt-0 md:mt-0.5">
                                                    <span className="text-[13px] md:text-[15px] drop-shadow-sm">🕒</span>
                                                    <span className={cn(
                                                        "font-medium",
                                                        variant === 'modal' ? "text-[13px] md:text-[15px]" : "text-sm"
                                                    )}>
                                                        {format(parseISO(dateVal), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className={cn(
                                "mt-auto pt-3 flex gap-4",
                                variant === 'modal' ? "md:pt-9" : "md:pt-6",
                                modoEdicao ? "flex-row" : "flex-col"
                            )}>
                                {modoEdicao && (
                                    <Button
                                        onClick={() => {
                                            if (mode === 'edit') {
                                                onClose();
                                            } else {
                                                setModoEdicao(false);
                                                setAgendamentoEditando(null);
                                            }
                                        }}
                                        variant="outline"
                                        className="flex-1 h-10.5 md:h-12 rounded-2xl text-[0.9rem] md:text-[1rem] font-black uppercase tracking-wider bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-700 transition-all duration-300 shadow-sm"
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
                                            ? (mode === 'create'
                                                ? "bg-gradient-to-b from-[#facc15] to-[#eab308] text-[#0B1221] shadow-[0_4px_0_#eab308,inset_0_1.5px_1px_rgba(255,255,255,0.4)] hover:brightness-110 active:translate-y-[2px] active:shadow-none"
                                                : "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_4px_0_#1E3A8A,inset_0_1.5px_1px_rgba(255,255,255,0.3)] hover:brightness-110 active:translate-y-[2px] active:shadow-none")
                                            : cn(
                                                "transition-all grayscale-0 opacity-100",
                                                mode === 'create' ? "bg-slate-200 text-slate-500 border border-slate-300 shadow-none" : "bg-slate-100 text-slate-400 border border-slate-200 grayscale opacity-60"
                                            )
                                    )}
                                >
                                    {modoEdicao ? 'Salvar' : 'Agendar'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(!agendamentosNoDia || agendamentosNoDia.length === 0) ? (
                                <div className="py-12 text-center">
                                    <p className="text-slate-400 font-medium italic text-[14px]">Nenhum agendamento para este dia.</p>
                                </div>
                            ) : (
                                agendamentosNoDia.map((agenda) => {
                                    const emoji = agenda.tipo.split(' ')[0];
                                    let tipoNome = agenda.tipo.replace(emoji, '').trim();
                                    const isEventSpecial = agenda.userName === '_SPECIAL_EVENT_';
                                    const displayUserName = isEventSpecial ? 'Evento' : (agenda.userName || "Usuário");

                                    let timeStr = "";
                                    if (isEventSpecial && tipoNome.includes(' - 🕗 ')) {
                                        const parts = tipoNome.split(' - 🕗 ');
                                        tipoNome = parts[0];
                                        timeStr = parts[1];
                                    }

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
                                                "p-1 md:pt-3 md:pb-1.5 md:px-1.5 rounded-2xl border overflow-hidden bg-gradient-to-br from-[#ebf4ff] via-[#f0f7ff] to-[#e1effe] hover:from-[#e1effe] hover:to-[#ebf4ff] transition-all duration-300 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03),0_2px_4px_-2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] group relative cursor-pointer",
                                                isSelected
                                                    ? "border-blue-500 ring-2 ring-blue-200 shadow-lg scale-[1.01] md:scale-[1.02]"
                                                    : "border-white/60 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)]"
                                            )}
                                        >
                                            <div className={cn("grid grid-rows-[auto_auto_auto] gap-x-2 md:gap-x-3.5 gap-y-1 items-center relative", isEventSpecial ? "grid-cols-[65px_1fr] md:grid-cols-[80px_1fr]" : "grid-cols-[65px_1fr_52px_38px] md:grid-cols-[80px_1fr_auto_50px]")}>
                                                {/* COLUNA 1: USUÁRIO */}
                                                <div className="col-start-1 row-start-1 row-span-3 flex flex-col items-center justify-center gap-1 md:gap-1.5 self-stretch my-0.5 -ml-1 md:ml-0">
                                                    <div className="w-[54px] h-[54px] md:w-[78px] md:h-[78px] md:-translate-y-1.5 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm shrink-0">
                                                        {agenda.userPhoto ? (
                                                            <img src={agenda.userPhoto} alt={agenda.userName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                                                                {isEventSpecial ? <span className="text-[1.8rem] md:text-[2.5rem] saturate-150 drop-shadow-sm">{emoji}</span> : <User className="w-4.5 h-4.5 md:w-[22px] md:h-[22px]" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] md:text-[10px] md:-mt-1.5 font-bold text-slate-500 leading-tight text-center break-words max-w-[60px] md:max-w-[70px] uppercase">
                                                        {displayUserName}
                                                    </span>
                                                </div>

                                                {/* COLUNA 2: CONTEÚDO */}
                                                <div className="col-start-2 row-start-1 flex items-center gap-1.5 md:gap-2 py-0.5 -ml-1 md:ml-0 overflow-hidden pr-2 md:pr-0">
                                                    {!isEventSpecial && <span className="text-[1rem] md:text-[1.1rem] drop-shadow-sm leading-none shrink-0">{emoji}</span>}
                                                    <span className={cn("text-[11.5px] md:text-[clamp(12px,0.85vw,13.5px)] font-black text-slate-800 uppercase tracking-tight", isEventSpecial ? "whitespace-normal break-words leading-tight" : "truncate")}>
                                                        {tipoNome}
                                                    </span>
                                                </div>
                                                <div className="col-start-2 row-start-2 flex items-center gap-1 md:gap-1.5 overflow-hidden -ml-1 md:ml-0 mt-0.5">
                                                    <span className="text-[13px] md:text-[14px] leading-none opacity-70 shrink-0">📋</span>
                                                    <span className={cn("text-[12px] md:text-[clamp(13px,0.9vw,14px)] font-bold text-slate-700/80 flex items-center gap-x-1 flex-wrap md:flex-nowrap", isEventSpecial ? "whitespace-normal" : "whitespace-nowrap text-ellipsis")}>
                                                        {renderPeriod()}
                                                        {timeStr ? <span className="ml-[2px] md:ml-[6px] inline-flex items-center gap-[3px] shrink-0">- <span className="text-[13px] md:text-[14px] leading-none saturate-150 drop-shadow-sm ml-[2px]">🕗</span> {timeStr}</span> : null}
                                                    </span>
                                                </div>
                                                {agenda.observacao && (
                                                    <div className="col-start-2 col-span-2 row-start-3 italic text-[9.5px] md:text-[10.5px] text-slate-500 leading-tight py-0.5 pr-1 md:pr-2 break-words -ml-1 md:ml-0">
                                                        "{agenda.observacao}"
                                                    </div>
                                                )}

                                                {/* COLUNA 3: STATUS / DURAÇÃO */}
                                                <div className="col-start-3 row-start-1 justify-self-end py-0.5">
                                                    {!isEventSpecial && (() => {
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
                                                    {!isEventSpecial && (
                                                        <span className="text-[10px] md:text-[clamp(11.5px,0.85vw,12.5px)] font-black text-blue-700 whitespace-nowrap drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                                                            {agenda.totalDias} dias
                                                        </span>
                                                    )}
                                                </div>

                                                {/* COLUNA 4: AÇÕES VERTICAL */}
                                                {!isEventSpecial && profile && (agenda.userId === profile.id || profile.perfil === 'administrador') && (
                                                    <div className="col-start-4 row-start-1 row-span-3 self-stretch border-l border-blue-200/70 bg-gradient-to-b from-[#d9e7fa] to-[#c1d6f0] shadow-[inset_1px_0_2px_rgba(255,255,255,0.8),inset_-3px_-2px_6px_rgba(0,0,50,0.08)] -mt-1 -mb-1 -mr-1 md:-mt-3 md:-mb-1.5 md:-mr-1.5 flex flex-col items-center justify-center gap-0.5 md:gap-1 acoes rounded-r-2xl">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onEditRequest) {
                                                                    onEditRequest(agenda);
                                                                } else {
                                                                    setModoEdicao(true);
                                                                    setAgendamentoEditando(agenda);
                                                                }
                                                            }}
                                                            className="w-8 h-8 md:w-11 md:h-11 flex items-center justify-center rounded-full text-blue-600 hover:text-blue-800 hover:bg-white/60 hover:shadow-sm transition-all group/btn drop-shadow-sm"
                                                            title="Editar"
                                                        >
                                                            <SquarePen className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] group-hover/btn:scale-110 transition-transform" />
                                                        </button>

                                                        <div className="w-[60%] h-[1px] bg-blue-300/40 my-0.5 shadow-[0_1px_0_rgba(255,255,255,0.7)]" />

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmDeleteId(agenda.id);
                                                            }}
                                                            className="w-8 h-8 md:w-11 md:h-11 flex items-center justify-center rounded-full text-[#E53935] hover:text-[#C62828] hover:bg-white/60 hover:shadow-sm transition-all group/btn drop-shadow-sm"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] group-hover/btn:scale-110 transition-transform" />
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
                    <div className="fixed inset-0 z-[300] flex items-center justify-center animate-in fade-in duration-200 pointer-events-auto">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCalendarModalOpen(false)} />
                        <div className="relative bg-[#F8FAFC] rounded-2xl md:rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/60 z-10 flex flex-col animate-in zoom-in-95 duration-200 w-[98%] max-w-[98%] md:w-full md:max-w-[380px] overflow-hidden max-h-[90vh]">
                            <div className="w-full flex justify-between items-center p-4 md:px-5 bg-[linear-gradient(135deg,#0f3c78,#1f5fa8,#2f80ed)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-bold text-white uppercase tracking-[1px] text-sm leading-tight">Selecione o Período</h3>
                                    {dataInicio && (
                                        <div className="mt-1 bg-gradient-to-b from-blue-50/90 to-blue-100/80 border border-blue-200/60 rounded-[10px] py-1 px-3 flex items-center justify-center gap-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1.5px_1px_rgba(255,255,255,1)] w-fit">
                                            <span className="text-[11px] sm:text-[12px] font-black text-blue-800 uppercase tracking-tight">
                                                {format(parseISO(dataInicio), 'dd/MM')}
                                                {dataFim && dataFim !== dataInicio && ` - ${format(parseISO(dataFim), 'dd/MM')}`}
                                                {` • ${totalDias} ${totalDias === 1 ? 'dia' : 'dias'}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsCalendarModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935] hover:bg-[#C62828] transition-all text-white shadow-md active:scale-90"
                                    title="Fechar"
                                >
                                    <X size={18} strokeWidth={4} />
                                </button>
                            </div>
                            <div className="px-2 md:px-5 pt-3 pb-3 flex items-center justify-center w-full">
                                <Calendar
                                    mode="range"
                                    defaultMonth={dateRange?.from || dateRange?.to || new Date()}
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
                                    className="bg-transparent"
                                    classNames={{
                                        months: "flex flex-col sm:flex-row w-full justify-center max-w-full",
                                        month: "w-full flex flex-col",
                                        caption: "order-1 flex justify-center pt-0 relative items-center pb-3 w-full px-1",
                                        caption_label: "font-black text-[0.95rem] uppercase tracking-wider text-blue-800",
                                        nav: "static",
                                        nav_button: "h-8 w-8 flex items-center justify-center rounded-lg bg-[#93C5FD] border border-blue-300/60 text-[#1E3A8A] shadow-[0_3px_0_#60A5FA,inset_0_1px_0_rgba(255,255,255,0.4)] hover:brightness-105 hover:scale-105 transition-all active:translate-y-[2px] active:shadow-none",
                                        nav_button_previous: "absolute left-1/2 -translate-x-[150px] md:-translate-x-[165px] -top-1.5",
                                        nav_button_next: "absolute right-1/2 translate-x-[150px] md:translate-x-[165px] -top-1.5",
                                        table: "order-3 w-[min-content] mx-auto border-separate border-spacing-y-1 border-spacing-x-1 max-w-full",
                                        head_row: "flex w-full justify-center gap-1",
                                        head_cell: "text-[12px] md:text-[13px] font-bold tracking-[0.4px] uppercase flex items-center justify-center rounded-[14px] h-10 w-10 md:h-12 md:w-12 bg-gradient-to-b from-[#F4F6F8] to-[#E6E9ED] text-slate-700 border border-slate-300 shadow-[0_1.5px_0_#cbd5e1,inset_0_1.5px_1px_rgba(255,255,255,0.4)] m-0",
                                        row: "flex w-full justify-center gap-1 group relative",
                                        cell: "h-11 w-10 md:h-[50px] md:w-12 text-center p-0 m-0 relative focus-within:z-20 bg-transparent text-slate-700 first:text-slate-700 last:text-slate-700",
                                        day: "h-10 w-10 md:h-12 md:w-12 p-0 flex items-center justify-center relative rounded-[14px] text-sm md:text-base font-semibold bg-white bg-clip-padding saturate-[1.05] transition-all duration-200 ease-out border border-slate-300 shadow-[0_2px_0_#cbd5e1,inset_0_1.5px_1px_rgba(255,255,255,0.4)] hover:scale-[1.02] hover:brightness-[1.05] cursor-pointer text-inherit outline-none focus-visible:ring-1 focus-visible:ring-blue-400 active:translate-y-[1.5px] active:shadow-none",
                                        day_range_start: "day-range-start !bg-[#93C5FD] !text-[#1e3a8a] !font-bold ring-2 ring-white !shadow-[0_2px_0_#60A5FA,inset_0_1.5px_1px_rgba(255,255,255,0.4)] z-20 !scale-[1.02] active:translate-y-[1.5px] active:shadow-none",
                                        day_range_end: "day-range-end !bg-[#93C5FD] !text-[#1e3a8a] !font-bold ring-2 ring-white !shadow-[0_2px_0_#60A5FA,inset_0_1.5px_1px_rgba(255,255,255,0.4)] z-20 !scale-[1.02] active:translate-y-[1.5px] active:shadow-none",
                                        day_range_middle: "aria-selected:!bg-[#DBEAFE] aria-selected:!text-[#1E3A8A] !shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.05)] font-bold",
                                        day_selected: "font-bold !bg-[#93C5FD] !text-[#1E40AF] !shadow-[0_2px_0_#60A5FA,inset_0_1.5px_1px_rgba(255,255,255,0.4)] active:translate-y-[1.5px] active:shadow-none",
                                        day_today: "ring-2 ring-inset ring-[#C62828] font-black shadow-[0_4px_12px_-4px_rgba(198,40,40,0.25)] z-10",
                                        day_outside: "text-transparent bg-transparent opacity-0 pointer-events-none shadow-none",
                                        day_disabled: "text-slate-300 opacity-50 font-normal grayscale pointer-events-none",
                                    }}
                                    components={{
                                        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                                        IconRight: () => <ChevronRight className="h-4 w-4" />,
                                        DayContent: (props: { date: Date }) => {
                                            const dStr = format(props.date, 'yyyy-MM-dd');
                                            const ags = todosAgendamentos?.filter(a => a.dataInicio <= dStr && a.dataFim >= dStr);
                                            const titleText = ags?.length > 0 ? ags.map(a => `${a.tipo.split(' ')[0]} ${a.userName === '_SPECIAL_EVENT_' ? 'Evento' : (a.userName || 'Usuário')}`).join('\n') : undefined;
                                            return (
                                                <div title={titleText} className="w-full h-full flex flex-col items-center justify-center relative cursor-pointer">
                                                    <span>{props.date.getDate()}</span>
                                                </div>
                                            );
                                        }
                                    }}
                                />
                            </div>

                            {/* Rodapé do Modal com Ações */}
                            <div className="px-5 pb-5 pt-1.5 flex gap-3 bg-[#F8FAFC]">
                                <button
                                    onClick={() => handleSelectRange(undefined)}
                                    className="flex-1 h-11 rounded-xl bg-red-50 text-red-600 font-black text-sm border border-red-100 shadow-sm hover:bg-red-100/50 active:translate-y-[1px] transition-all uppercase tracking-wider"
                                >
                                    Limpar
                                </button>
                                <button
                                    onClick={() => setIsCalendarModalOpen(false)}
                                    disabled={!dataInicio}
                                    className={cn(
                                        "flex-1 h-11 rounded-xl font-black text-sm shadow-md transition-all active:translate-y-[1px] uppercase tracking-wider",
                                        dataInicio
                                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                                            : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
                                    )}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
            {/* Modal de Confirmação de Exclusão */}
            {
                confirmDeleteId && (
                    <ConfirmDialog
                        open={true}
                        onConfirm={() => {
                            if (confirmDeleteId) onDelete?.(confirmDeleteId);
                            setConfirmDeleteId(null);
                        }}
                        onCancel={() => setConfirmDeleteId(null)}
                        message="Deseja realmente excluir este agendamento?"
                    />
                )
            }
        </div >
    );
};

export default DrawerAgendamento;
