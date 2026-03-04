"use client";

import React from 'react';
import { useCalendarData } from '@/hooks/use-calendar-data';
import CalendarGrid from './CalendarGrid';
import { MONTHS, getSeasonDataForDate } from '@/utils/calendar-utils';
import { cn } from '@/lib/utils';
import type { CalendarMode } from '@/hooks/use-calendar-mode';
import type { CalendarEvent } from '@/hooks/use-calendar-events';

interface CalendarCardProps {
    month: number;
    year: number;
    today: Date;
    onDayClick: (day: number) => void;
    goToToday: () => void;
    formatToday: () => string;
    isCenter?: boolean;
    position?: 'left' | 'right' | 'center' | 'far';
    mode?: CalendarMode;
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
    mode = '24x48',
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
        mode,
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

        // Definição de Gradientes Premium Suaves por Estação
        const gradients: Record<string, { bg: string, text: string, border: string }> = {
            'Primavera': {
                bg: 'linear-gradient(to bottom, #fffce8, #fff3cd)',
                text: '#856404',
                border: '#fde047'
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

    return (
        <div
            className={cn(
                "w-full transition-all duration-500 ease-out flex flex-col",
                "px-1.5 py-2 md:px-8 md:pt-4 md:pb-8",
                "bg-white/95 backdrop-blur-sm opacity-100",
                "antialiased [font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] [contain:paint]",
                "border border-[#0F172A]/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.04),0_32px_64px_-12px_rgba(0,0,0,0.08)]",
                "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:z-20",
                "shadow-inner shadow-white/40",
                isCenter ? "md:bg-white" : "md:bg-gray-50/90",
                "rounded-2xl md:rounded-[29px] bg-clip-padding",
                "relative group/card overflow-hidden"
            )}
        >
            {/* Brilho superior sutil */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none opacity-50" />
            <div className="hidden md:flex justify-between items-center mb-4 md:mb-6 pl-0 pr-0">
                <div className="flex items-center gap-2 md:-ml-2">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="hidden md:block w-7 h-7 md:w-10 md:h-10 object-contain drop-shadow-md"
                    />
                    <h3 className="text-base md:text-xl font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <span className="hidden md:inline" style={{
                            background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 50%, #C62828 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '0.8px'
                        }}>
                            {MONTHS[month]}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="hidden md:inline text-[#C62828] text-sm md:text-base opacity-40 flex-shrink-0">•</span>
                            <span style={{
                                background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 50%, #C62828 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                letterSpacing: '0.8px'
                            }}>
                                {year}
                            </span>
                        </div>
                    </h3>
                </div>

                {/* Badge da Estação (Desktop) */}
                <div className="hidden md:flex items-center h-full flex-1 justify-end md:-mr-1">
                    <div
                        className="transition-all duration-300 hover:scale-[1.05] cursor-default select-none group/season"
                        style={{
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '13.5px',
                            background: season.style.bg,
                            color: season.style.text,
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.6px',
                            border: `1px solid ${season.style.border}`,
                        }}
                    >
                        <span className="text-base transform transition-transform group-hover/season:rotate-12">{season.emoji}</span>
                        <span>{season.name}</span>
                    </div>
                </div>
            </div>

            <div className="relative p-0 md:px-4 md:pt-6 md:pb-4 bg-transparent md:bg-gradient-to-br md:from-[#F0F9FF] md:to-[#E0F2FE] md:rounded-[20px] md:border md:border-[#bae6fd]/50 opacity-100 shadow-inner shadow-blue-900/[0.03] filter-none backdrop-filter-none">
                <div className="hidden md:block absolute top-[1px] left-[20px] right-[20px] h-[1px] bg-white/20 pointer-events-none" />
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
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_0_rgba(0,0,0,0.15),0_10px_20px_-5px_rgba(0,0,0,0.2)]",
                            "active:translate-y-[2px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_0_rgba(0,0,0,0.15)] active:scale-[0.98]",
                            todayColors.bg === 'bg-calendar-blue' && "bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white",
                            todayColors.bg === 'bg-calendar-green' && "bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white",
                            todayColors.bg === 'bg-calendar-yellow' && "bg-gradient-to-br from-[#fde047] to-[#f59e0b] text-[#1A1A1A]",
                            mode === 'adm' && "bg-[#FEE2E2] text-red-800 active:bg-red-200 border-red-300/45",
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
