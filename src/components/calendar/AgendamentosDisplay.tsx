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
    const currentMonthAgendamentos = agendamentos.filter(agendamento => {
        const inicio = new Date(agendamento.dataInicio + 'T12:00:00');
        const fim = new Date(agendamento.dataFim + 'T12:00:00');

        // Check if the current month/year overlaps with the start and end dates
        const dateStart = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
        const dateEnd = new Date(fim.getFullYear(), fim.getMonth(), 1);
        const current = new Date(year, month, 1);

        return current >= dateStart && current <= dateEnd;
    }).sort((a, b) => {
        return new Date(a.dataInicio + 'T12:00:00').getTime() - new Date(b.dataInicio + 'T12:00:00').getTime();
    });

    const isEmpty = currentMonthAgendamentos.length === 0;

    const renderDate = (agendamento: Agendamento) => {
        const dInicio = new Date(agendamento.dataInicio + 'T12:00:00');
        const dFim = new Date(agendamento.dataFim + 'T12:00:00');
        const diaInicio = String(dInicio.getDate()).padStart(2, '0');

        // Mes abreviado com a primeira letra maíuscula
        const mesInicioAbbr = (MONTHS[dInicio.getMonth()] || '').substring(0, 3);
        const mesInicio = mesInicioAbbr.charAt(0).toUpperCase() + mesInicioAbbr.slice(1).toLowerCase();

        if (agendamento.dataInicio === agendamento.dataFim) {
            return `${diaInicio}/${mesInicio}`;
        } else {
            const diaFim = String(dFim.getDate()).padStart(2, '0');
            const mesFimAbbr = (MONTHS[dFim.getMonth()] || '').substring(0, 3);
            const mesFim = mesFimAbbr.charAt(0).toUpperCase() + mesFimAbbr.slice(1).toLowerCase();

            if (dInicio.getMonth() === dFim.getMonth()) {
                return `${diaInicio} a ${diaFim}/${mesInicio}`;
            }
            return `${diaInicio}/${mesInicio} a ${diaFim}/${mesFim}`;
        }
    };

    return (
        <div className={cn(
            "bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-[22px] border border-blue-500/20 md:border-gray-200/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300",
            isEmpty ? "hidden md:flex" : "flex"
        )}>
            <div className="relative w-full h-9 md:h-[52px] flex items-center">
                {/* Faixa de fundo com gradiente horizontal */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.25] to-transparent pointer-events-none" />

                {/* Barra lateral robusta (no padrão visual de border-l-4) */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 z-10 rounded-r-md" />

                {/* Conteúdo do Header */}
                <div className="relative flex items-center gap-2 px-3 md:px-6 z-20">
                    <span className="text-lg md:text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] select-none">📋</span>
                    <h4 className="font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
                        <span style={{
                            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            AGENDAMENTOS
                        </span>
                    </h4>
                </div>
            </div>

            <div className="px-3 md:px-6 pt-1 md:pt-3 pb-5 flex flex-col justify-start flex-1">
                {isEmpty ? (
                    <div className="flex-1 flex items-center justify-start py-4">
                        <span className="text-[12px] md:text-[14px] lg:text-[15px] text-gray-400 font-normal italic leading-[1.6]">
                            Nenhum agendamento neste mês.
                        </span>
                    </div>
                ) : (
                    currentMonthAgendamentos.map((agendamento) => {
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

                        return (
                            <div
                                key={agendamento.id}
                                onClick={() => onViewAgendamento(agendamento.dataInicio, agendamento.id)}
                                className={cn(
                                    "cursor-pointer transition-all duration-300 ease-in-out flex items-center justify-start gap-2 py-0.5 hover:opacity-80 active:scale-95 origin-left",
                                    "text-[13px] md:text-[14px] lg:text-[15px] font-medium text-[#1F2937] uppercase tracking-tight leading-[1.6]",
                                    isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md py-0.5 px-1 z-20 animate-bounce-twice font-semibold"
                                )}
                            >
                                <span className="font-medium flex items-center gap-1">
                                    <span className={cn(
                                        "font-semibold text-[#1d4ed8]"
                                    )}>
                                        {dateText}
                                    </span>
                                    <span className="text-blue-500/50 mx-0.5 text-[10px]">•</span>
                                    {emoji && (
                                        <span className="text-base md:text-lg filter saturate-[1.3] brightness-[1.1]">
                                            {emoji}
                                        </span>
                                    )}
                                    <span className="text-[#334155]">
                                        {tipoNome} - {userName}
                                    </span>
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AgendamentosDisplay;
