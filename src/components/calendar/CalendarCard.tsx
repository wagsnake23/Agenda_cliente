"use client";

import React from 'react';
import { useCalendarData } from '@/hooks/use-calendar-data';
import CalendarGrid from './CalendarGrid';
import { MONTHS, getSeasonDataForDate } from '@/utils/calendar-utils';
import { cn } from '@/lib/utils';
import type { CalendarMode } from '@/hooks/use-calendar-mode';

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
    selectedPeriod?: { start: string, end: string } | null;
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
    selectedPeriod,
}) => {
    const { calendarData, todayDayOfWeek, todayColors, isCurrentMonthAndYear } = useCalendarData({
        month,
        year,
        today,
        mode,
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
        const commonStyle = {
            badgeText: 'text-[#334155]', // Grafite levemente mais suave
            useTextGradient: false
        };

        // Determinamos a estação baseada no dia atual se for o mês corrente, 
        // ou no meio do mês se for um mês diferente (passado ou futuro).
        const now = new Date();
        const isCurrentMonth = now.getMonth() === m && now.getFullYear() === y;
        const targetDay = isCurrentMonth ? now.getDate() : 15;

        const seasonInfo = getSeasonDataForDate(m, targetDay);

        const gradients: Record<string, string> = {
            'Verão': 'linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)',
            'Outono': 'linear-gradient(135deg, #ffffff 0%, #fef6e7 100%)',
            'Inverno': 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            'Primavera': 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)'
        };

        return {
            name: seasonInfo.name,
            emoji: seasonInfo.emoji,
            gradient: gradients[seasonInfo.name] || gradients['Verão'],
            ...commonStyle
        };
    };

    const season = getSeasonData(month, year);

    return (
        <div
            className={cn(
                "w-full transition-all duration-500 ease-out flex flex-col",
                "px-3 py-2 md:px-8 md:pt-4 md:pb-8",
                "bg-white/95 backdrop-blur-sm opacity-100",
                "antialiased [font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] [contain:paint]",
                // Sombra em Camadas Ultra Premium
                "border border-[#0F172A]/[0.05] shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.04),0_32px_64px_-12px_rgba(0,0,0,0.08)]",
                // Brilho interno superior polido
                "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:z-20",
                "shadow-inner shadow-white/40",
                isCenter ? "md:bg-white" : "md:bg-gray-50/90",
                "rounded-2xl md:rounded-[29px] bg-clip-padding",
                "relative group/card overflow-hidden"
            )}
        >
            {/* Brilho superior sutil */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none opacity-50" />
            {/* Cabeçalho unificado: Oculto no mobile conforme solicitado */}
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

                        {/* Separador e Ano */}
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

                {/* Badge da Estação (Lado Direito) */}
                <div className="flex items-center h-full flex-1 justify-end md:-mr-1">
                    <div className="flex items-center gap-0.5 select-none">
                        <span
                            className={cn("hidden md:inline uppercase text-[13px] md:text-[17px] lg:text-[19px] font-extrabold tracking-wide leading-none", season.badgeText)}
                            style={{
                                letterSpacing: '0.8px'
                            }}
                        >
                            {season.name}
                        </span>
                        <span className="text-xl md:text-2xl lg:text-3xl leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] filter saturate-[1.1] transform active:scale-95 transition-transform">
                            {season.emoji}
                        </span>
                    </div>
                </div>
            </div>

            {/* Container Interno - Card 3D Azul Premium apenas em Desktop */}
            <div className="relative p-0 md:px-4 md:pt-6 md:pb-4 bg-transparent md:bg-gradient-to-br md:from-[#F0F9FF] md:to-[#E0F2FE] md:rounded-[20px] md:border md:border-[#bae6fd]/50 opacity-100 shadow-inner shadow-blue-900/[0.03] filter-none backdrop-filter-none">
                {/* Micro-brilho interno superior */}
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

                {/* Botão Hoje Compacto - Mobile apenas */}
                <div className="md:hidden absolute bottom-0.5 right-0 z-20">
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
                        <span className="flex items-center gap-1">
                            <span className="text-sm md:text-base drop-shadow-sm">
                                {getSeasonDataForDate(today.getMonth(), today.getDate()).emoji}
                            </span>
                            <span>Hoje: {formatToday()}</span>
                        </span>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default React.memo(CalendarCard);
