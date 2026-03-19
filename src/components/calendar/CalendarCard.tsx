"use client";

import React from 'react';
import { useCalendarData } from '@/hooks/use-calendar-data';
import CalendarGrid from './CalendarGrid';
import { MONTHS, getSeasonDataForDate } from '@/utils/calendar-utils';
import { cn } from '@/lib/utils';
import type { CalendarMode } from '@/hooks/use-calendar-mode';
import type { CalendarEvent } from '@/hooks/use-calendar-events';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CalendarCardProps {
    month: number;
    year: number;
    today: Date;
    onDayClick: (day: number) => void;
    goToToday: () => void;
    formatToday: () => string;
    isCenter?: boolean;
    position?: 'left' | 'right' | 'center' | 'far';
    agendamentos?: any[];
    onViewAgendamento?: (date: string, id?: string) => void;
    onOpenCreateDrawer?: () => void;
    selectedPeriod?: { start: string, end: string } | null;
    calendarEvents?: CalendarEvent[];
}

const CalendarCard: React.FC<CalendarCardProps> = ({
    month,
    year,
    today,
    onDayClick,
    goToToday,
    formatToday,
    isCenter = false,
    position = 'center',
    agendamentos = [],
    onViewAgendamento,
    onOpenCreateDrawer,
    selectedPeriod,
    calendarEvents = [],
}) => {
    const { calendarData, todayDayOfWeek, todayColors, isCurrentMonthAndYear } = useCalendarData({
        month,
        year,
        today,
        mode: 'adm',
        calendarEvents,
    });

    const [isDesktopState, setIsDesktopState] = React.useState(false);

    React.useEffect(() => {
        const checkIsDesktop = () => {
            setIsDesktopState(window.innerWidth >= 1024);
        };
        checkIsDesktop();
        window.addEventListener('resize', checkIsDesktop);
        return () => window.removeEventListener('resize', checkIsDesktop);
    }, []);

    const getSeasonData = (m: number, y: number) => {
        const now = new Date();
        const isCurrentMonth = now.getMonth() === m && now.getFullYear() === y;
        const targetDay = isCurrentMonth ? now.getDate() : 15;

        const seasonInfo = getSeasonDataForDate(m, targetDay);

        const gradients: Record<string, { bg: string, text: string, border: string }> = {
            'Primavera': {
                bg: 'linear-gradient(to bottom, #fff5f8, #ffe4e6)',
                text: '#be185d',
                border: '#fbcfe8'
            },
            'Verão': {
                bg: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)',
                text: '#166534',
                border: '#bbf7d0'
            },
            'Outono': {
                bg: 'linear-gradient(to bottom, #fff7ed, #ffedd5)',
                text: '#9a3412',
                border: '#fed7aa'
            },
            'Inverno': {
                bg: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)',
                text: '#075985',
                border: '#bae6fd'
            }
        };

        const style = gradients[seasonInfo.name] || gradients['Primavera'];

        return {
            name: seasonInfo.name,
            emoji: seasonInfo.emoji,
            style
        };
    };

    const season = getSeasonData(month, year);

    const seasonImages: Record<string, string> = {
        "VERÃO": "/season/verao.webp",
        "OUTONO": "/season/outono.webp",
        "INVERNO": "/season/inverno.webp",
        "PRIMAVERA": "/season/primavera.webp"
    };

    const bgImage = seasonImages[season.name.toUpperCase()] || seasonImages["PRIMAVERA"];

    return (
        <div
            className={cn(
                "w-full transition-all duration-500 ease-out flex flex-col",
                "px-2 py-2 md:px-8 md:pt-4 md:pb-8",
                "md:bg-white backdrop-blur-sm md:backdrop-blur-none opacity-100",
                "antialiased [font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] [contain:paint]",
                // Efeito 3D Mobile Premium (Unificado e Interno)
                "border-[0.5px] border-blue-400/25 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),inset_0_-1px_3px_rgba(0,0,0,0.05)]",
                // Efeito 3D Desktop (REMOCK OUTER SHADOW/BLUR ONLY)
                "md:border-[0.5px] md:border-slate-300/80 md:shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(0,0,0,0.06)]",
                "rounded-2xl md:rounded-[29px] bg-clip-padding",
                "relative group/card overflow-hidden"
            )}
            style={{
                background: !isDesktopState ? 'linear-gradient(to bottom, #fcfcfc, #f1f5f9)' : 'white'
            }}
        >
            {/* Brilho superior sutil */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none opacity-50 z-20" />

            <div
                className={cn(
                    "hidden md:flex justify-between items-start",
                    "md:-mx-8 md:-mt-4 md:px-8 md:pt-4 mb-0 relative overflow-hidden md:rounded-t-[28px] md:h-[99px] border-none outline-none shadow-none bg-white"
                )}
            >
                {/* Background da Estação */}
                <div
                    className="absolute inset-0 z-0 border-none outline-none contrast-[1.02] saturate-[1.05]"
                    style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    {/* Overlay local apenas para o ícone do calendário */}
                    <div
                        className="absolute top-0 left-0 w-[110px] h-[70px] pointer-events-none z-10"
                        style={{
                            background: 'radial-gradient(circle at top left, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0) 70%)'
                        }}
                    />
                </div>

                <div className="inline-flex items-center gap-2 relative z-10 md:-ml-2 -mt-[9px]">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="hidden md:block w-8 h-8 md:w-[54px] md:h-[54px] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                    />
                    <h3 className="text-lg md:text-2xl font-extrabold uppercase tracking-wide flex flex-col items-start leading-tight m-0">
                        {/* Badge Única: Mês e Ano */}
                        <div
                            className={cn(
                                "hidden md:flex items-center justify-center px-[14px] py-0 transition-all duration-200 gap-2 antialiased",
                                "shadow-[0_2px_0_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1),inset_0_1.5px_1.5px_rgba(255,255,255,0.8)]",
                                "cursor-pointer active:translate-y-[1px] active:shadow-[0_1px_0_rgba(0,0,0,0.05)] active:brightness-[0.98]"
                            )}
                            style={{
                                background: season.style.bg,
                                border: `0.5px solid ${season.style.border}`,
                                borderBottom: `2.5px solid ${season.style.border}`,
                                borderRadius: '14px',
                            }}
                        >
                            <span className="text-[#D14343] font-black text-base md:text-[18px] leading-none select-none" style={{ textShadow: 'none', WebkitFontSmoothing: 'antialiased' }}>
                                {MONTHS[month]}
                            </span>
                            <span className="text-[#D14343] opacity-20 font-bold select-none">•</span>
                            <span className="text-[#D14343] font-black text-base md:text-[19px] leading-none select-none" style={{ textShadow: 'none', WebkitFontSmoothing: 'antialiased' }}>
                                {year}
                            </span>
                        </div>
                    </h3>
                </div>

                {/* Badge da Estação (Desktop) com Tooltip */}
                <div className="hidden md:flex absolute top-[12px] right-[14px] z-10">
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <div
                                className="transition-all duration-300 hover:scale-[1.10] cursor-pointer select-none group/season shadow-[0_4px_10px_rgba(0,0,0,0.12)]"
                                style={{
                                    padding: '4px',
                                    borderRadius: '12px',
                                    fontSize: '12.5px',
                                    background: season.style.bg,
                                    color: season.style.text,
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `0.5px solid ${season.style.border}`,
                                    width: '34px',
                                    height: '34px'
                                }}
                            >
                                <span className="text-lg transform transition-transform group-hover/season:rotate-12">{season.emoji}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent
                            side="left"
                            className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl font-bold text-[#334155] uppercase tracking-wider py-2 px-3 text-[11px] rounded-[10px]"
                            sideOffset={8}
                        >
                            Estação: <span style={{ color: season.style.text }}>{season.name}</span>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <div
                className="relative p-0 md:px-4 md:pt-6 md:pb-4 md:mt-0 bg-transparent md:rounded-[20px] opacity-100 transition-colors duration-500 md:shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(14,165,233,0.05)]"
                style={{
                    background: isDesktopState ? 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' : 'transparent',
                    border: isDesktopState ? '0.5px solid rgba(148, 163, 184, 0.2)' : 'none'
                }}
            >
                <CalendarGrid
                    calendarData={calendarData}
                    isTransitioning={false}
                    todayDayOfWeek={todayDayOfWeek}
                    todayColors={todayColors}
                    isCurrentMonthAndYear={isCurrentMonthAndYear}
                    onDayClick={onDayClick}
                    agendamentos={agendamentos}
                    onViewAgendamento={onViewAgendamento}
                    month={month}
                    year={year}
                    selectedPeriod={selectedPeriod}
                    isDesktop={isDesktopState}
                />

                {/* Botões de Ação Compactos - Mobile apenas */}
                <div className="md:hidden absolute bottom-0.5 right-0 z-20 flex items-center gap-1.5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            goToToday();
                        }}
                        className={cn(
                            "text-[11px] font-bold uppercase tracking-tight",
                            "transition-all duration-300 cursor-pointer",
                            "h-[32px] px-3 rounded-[9px] flex items-center gap-1",
                            "bg-clip-padding saturate-[1.05] border border-black/[0.1]",
                            "bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe] text-[#1e40af] border-blue-200/60",
                            "shadow-[0_2px_0_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1),inset_0_1.5px_1.5px_rgba(255,255,255,0.8)]",
                            "active:translate-y-[1px] active:scale-[0.98] active:brightness-[0.98]",
                        )}
                    >
                        <span>{season.emoji} Hoje: {formatToday()}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CalendarCard);
