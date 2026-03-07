"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { MONTHS } from '@/utils/calendar-utils';
import { Agendamento } from './DrawerAgendamento';

interface AgendamentosDisplayProps {
    agendamentos: Agendamento[];
    month: number;
    year: number;
    highlightedDay: number | null;
    onViewAgendamento: (date: string, id?: string) => void;
}

const AgendamentosDisplay: React.FC<AgendamentosDisplayProps> = ({
    agendamentos,
    month,
    year,
    highlightedDay,
    onViewAgendamento
}) => {
    // Sem lógica de deduplicação: useAgendamentos garante estado limpo.
    // Este componente apenas filtra, ordena e renderiza.
    const currentMonthAgendamentos = agendamentos
        .filter(agendamento => {
            const inicio = new Date(agendamento.dataInicio + 'T12:00:00');
            const fim = new Date(agendamento.dataFim + 'T12:00:00');
            const dateStart = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
            const dateEnd = new Date(fim.getFullYear(), fim.getMonth(), 1);
            const current = new Date(year, month, 1);
            return current >= dateStart && current <= dateEnd;
        })
        .sort((a, b) => {
            return new Date(a.dataInicio + 'T12:00:00').getTime() - new Date(b.dataInicio + 'T12:00:00').getTime();
        });

    const isEmpty = currentMonthAgendamentos.length === 0;

    const renderDate = (agendamento: Agendamento) => {
        const dInicio = new Date(agendamento.dataInicio + 'T12:00:00');
        const diaInicio = String(dInicio.getDate()).padStart(2, '0');
        const mesInicioAbbr = (MONTHS[dInicio.getMonth()] || '').substring(0, 3);

        return `${diaInicio} ${mesInicioAbbr.toUpperCase()}`;
    };

    return (
        <div
            className={cn(
                "bg-white rounded-2xl md:rounded-[22px] relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300",
                "border border-blue-400/30 md:border-blue-300/40",
                isEmpty ? "hidden md:flex" : "flex"
            )}
        >
            <div className="relative w-full h-9 md:h-[52px] flex items-center">
                {/* Faixa de fundo com gradiente horizontal equilibrado */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to right, rgba(29,78,216,0.38) 0%, rgba(29,78,216,0.28) 30%, rgba(29,78,216,0.16) 65%, rgba(29,78,216,0.07) 100%)'
                    }}
                />

                {/* Barra lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 z-10 rounded-r-md" />

                {/* Conteúdo do Header */}
                <div className="relative flex items-center justify-between pl-3 pr-2 md:pl-6 md:pr-4 z-20 w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-lg md:text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] select-none">📋</span>
                        <h4 className="font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
                            <span style={{
                                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b5fc0 60%, #4a6fa0 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                AGENDAMENTOS
                            </span>
                        </h4>
                    </div>

                    <div className="flex flex-row md:flex-col items-center justify-center py-[4px] md:py-[4px] px-[12px] md:px-[10px] rounded-[10px] md:rounded-[11px] text-[12px] md:text-[13px] bg-[#3b82f6]/15 text-[#2563eb] leading-[1.1] ml-auto border-[0.5px] border-[#3b82f6]/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)]">
                        <span className="font-bold uppercase tracking-wide">{MONTHS[month]?.substring(0, 3)}</span>
                        <span className="hidden md:inline font-bold text-slate-600 opacity-90">{year}</span>
                        <span className="inline md:hidden font-bold opacity-90 ml-[2px]">/{year}</span>
                    </div>
                </div>
            </div>

            <div className="px-3 md:px-6 pt-0.5 md:pt-3 pb-2 md:pb-5 flex flex-col justify-start flex-1">
                {isEmpty ? (
                    <div className="flex flex-col items-start justify-start pt-3 pb-4 gap-1">
                        <div className="flex items-center gap-2.5 px-0.5 opacity-60">
                            <span className="text-lg md:text-xl filter grayscale contrast-50 select-none">📋</span>
                            <span className="text-[11px] md:text-[12px] font-bold text-gray-400 uppercase tracking-[1px] leading-tight">
                                Nenhum agendamento para este mês
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="relative pl-[18px] before:content-[''] before:absolute before:left-[6px] before:top-0 before:bottom-0 before:w-[2px] before:bg-[#e5e7eb] flex flex-col w-full">
                        {currentMonthAgendamentos.map((agendamento, index) => {
                            const isHighlighted = highlightedDay !== null && (() => {
                                const hoverDate = new Date(year, month, highlightedDay, 12, 0, 0);
                                const dInicio = new Date(agendamento.dataInicio + 'T12:00:00');
                                const dFim = new Date(agendamento.dataFim + 'T12:00:00');
                                return hoverDate >= dInicio && hoverDate <= dFim;
                            })();

                            const emoji = agendamento.tipo.split(' ')[0];
                            const tipoNome = agendamento.tipo.replace(emoji, '').trim();
                            const userName = agendamento.userName ? agendamento.userName.split(' ')[0] : 'Usuário';
                            const dateText = renderDate(agendamento);
                            const hasContinuation = agendamento.dataInicio !== agendamento.dataFim;

                            return (
                                <React.Fragment key={agendamento.id}>
                                    <div
                                        onClick={() => onViewAgendamento(agendamento.dataInicio, agendamento.id)}
                                        className={cn(
                                            "cursor-pointer transition-all duration-150 ease-in-out flex flex-col py-[4px] md:py-[8px] pl-0 hover:bg-[#f8fafc] hover:rounded-[6px] hover:pl-[4px] group w-full active:scale-[0.98] origin-left",
                                            "text-[13px] md:text-[15px] lg:text-[16px] font-medium text-[#1F2937] uppercase tracking-tight leading-[1.6]",
                                            isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md z-20 animate-bounce-twice font-semibold"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-start gap-[8px] w-full relative",
                                            "before:content-[''] before:absolute before:left-[-12px] before:top-[8px] md:before:top-[10px] before:w-[8px] before:h-[8px] before:rounded-full before:bg-[#3b82f6]"
                                        )}>
                                            <span className="bg-[#3b82f6]/15 text-[#2563eb] text-[12px] md:text-[14px] font-bold px-[8px] py-[4px] rounded-[8px] shrink-0 uppercase">
                                                {dateText}
                                            </span>
                                            <span className="flex items-start gap-1 text-[#334155] whitespace-normal">
                                                {emoji && (
                                                    <span className="text-base md:text-lg filter saturate-[1.3] brightness-[1.1] pt-0.5">
                                                        {emoji}
                                                    </span>
                                                )}
                                                <span className="break-words">{tipoNome} - {userName}</span>
                                            </span>
                                        </div>
                                        {hasContinuation && (
                                            <div className="flex w-full mt-2">
                                                <div className="border-b border-dashed border-[#d1d5db] flex-1 ml-[10px]" />
                                            </div>
                                        )}
                                    </div>
                                    {index < currentMonthAgendamentos.length - 1 && (
                                        <div className="h-[1px] my-[1px] md:my-[2px] bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent w-full" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgendamentosDisplay;
