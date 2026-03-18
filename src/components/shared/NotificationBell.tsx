"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgendamentosContext } from '@/context/AgendamentosContext';
import { useCalendarEventsContext } from '@/context/CalendarEventsContext';

interface NotificationBellProps {
    className?: string;
    iconSize?: number;
    onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className, iconSize = 26, onClick }) => {
    const { agendamentos: agendamentosDB } = useAgendamentosContext();
    const { events: calendarEvents } = useCalendarEventsContext();

    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    // Combinar agendamentos e eventos
    const agendamentosComEventosGerais = useMemo(() => {
        const eventosMapeados = calendarEvents
            .filter(ev => ev.type === 'event' && !ev.is_fixed)
            .map(ev => {
                const datePart = ev.date.includes('T') ? ev.date.split('T')[0] : (ev.date.includes(' ') ? ev.date.split(' ')[0] : ev.date);
                return {
                    id: `evento-${ev.id}`,
                    dataInicio: datePart,
                    dataFim: datePart,
                };
            });

        const agsFormatados = agendamentosDB.map(ag => ({
            id: ag.id,
            dataInicio: ag.data_inicial,
            dataFim: ag.data_final,
        }));

        return [...agsFormatados, ...eventosMapeados];
    }, [agendamentosDB, calendarEvents]);

    const todayAppointmentsCount = useMemo(() => {
        return agendamentosComEventosGerais.filter(ag => ag.dataInicio === todayStr).length;
    }, [agendamentosComEventosGerais, todayStr]);

    return (
        <div
            onClick={(e) => {
                if (todayAppointmentsCount > 0 && onClick) {
                    e.stopPropagation();
                    onClick();
                }
            }}
            className={cn(
                "relative transition-transform",
                todayAppointmentsCount > 0 ? "cursor-pointer hover:scale-110" : "cursor-default opacity-50",
                className
            )}
        >
            <Bell
                size={iconSize}
                color={todayAppointmentsCount > 0 ? "#1e40af" : "#94a3b8"}
                strokeWidth={2.5}
                className={cn(
                    todayAppointmentsCount > 0 && "filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
                )}
            />
            {todayAppointmentsCount > 0 && (
                <span className={cn(
                    "absolute -top-[10px] -right-[10px] text-white text-[11px] font-[900] rounded-full px-[4.5px] py-[0px]",
                    "animate-in zoom-in duration-300 flex items-center justify-center min-w-[20px] h-[20px]",
                    "md:min-w-[23px] md:h-[23px] md:text-[12px] md:-top-[12px] md:-right-[12px]",
                    "bg-[radial-gradient(circle_at_30%_30%,#ff6b6b_0%,#ef4444_60%,#b91c1c_100%)]",
                    "shadow-[0_2px_4.5px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-0.5px_1px_rgba(0,0,0,0.3)]",
                    "border border-red-600/15"
                )}>
                    {todayAppointmentsCount}
                </span>
            )}
        </div>
    );
};

export default NotificationBell;
