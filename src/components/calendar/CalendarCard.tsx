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

    const seasonImages: Record<string, string> = {
        "VERÃO": "/season/verao.webp",
        "OUTONO": "/season/outono.webp",
        "INVERNO": "/season/inverno.webp",
        "PRIMAVERA": "/season/primavera.webp"
    };

    const seasonGradients: Record<string, string> = {
        "VERÃO": "linear-gradient(to right, rgba(255,250,220,0.95) 0%, rgba(255,240,180,0.85) 20%, rgba(255,225,130,0.55) 40%, rgba(255,210,80,0.25) 60%, rgba(255,210,80,0) 75%)",
        "OUTONO": "linear-gradient(to right, rgba(255,245,235,0.95) 0%, rgba(255,230,200,0.85) 20%, rgba(255,200,150,0.55) 40%, rgba(255,170,110,0.25) 60%, rgba(255,170,110,0) 75%)",
        "INVERNO": "linear-gradient(to right, rgba(235,245,255,0.95) 0%, rgba(210,230,255,0.85) 20%, rgba(180,210,255,0.55) 40%, rgba(150,190,255,0.25) 60%, rgba(150,190,255,0) 75%)",
        "PRIMAVERA": "linear-gradient(to right, rgba(255,240,250,0.95) 0%, rgba(255,220,240,0.85) 20%, rgba(255,190,230,0.55) 40%, rgba(255,160,220,0.25) 60%, rgba(255,160,220,0) 75%)"
    };

    const bgImage = seasonImages[season.name.toUpperCase()] || seasonImages["PRIMAVERA"];
    const bgGradient = seasonGradients[season.name.toUpperCase()] || seasonGradients["PRIMAVERA"];

    return (
        <div
            className={cn(
                "w-full transition-all duration-500 ease-out flex flex-col",
                "px-2 py-2 md:px-8 md:pt-4 md:pb-8",
                "bg-white/95 backdrop-blur-sm opacity-100",
                "antialiased [font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] [contain:paint]",
                // Efeito 3D Mobile (borda muito fina e sombra interna adaptada para telas menores)
                "border-[0.5px] border-slate-300/60",
                "shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),inset_0_-1px_4px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.1)]",
                // Efeito 3D Desktop (borda fina e sombra interna)
                "md:border-[0.5px] md:border-slate-300/80",
                "md:shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(0,0,0,0.06),0_12px_24px_-8px_rgba(0,0,0,0.15)]",
                "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:z-20",
                "shadow-inner shadow-white/40",
                "md:bg-white",
                "rounded-2xl md:rounded-[29px] bg-clip-padding",
                "relative group/card overflow-hidden"
            )}
        >
            {/* Brilho superior sutil */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none opacity-50 z-20" />

            <div
                className={cn(
                    "hidden md:flex justify-between items-start",
                    "md:-mx-8 md:-mt-4 md:px-8 md:pt-5 mb-0 relative overflow-hidden md:rounded-t-[28px] md:h-[95px] border-none outline-none shadow-none bg-white"
                )}
            >
                {/* Background da Estação */}
                <div
                    className="absolute inset-0 z-0 border-none outline-none"
                    style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    {/* Degradê horizontal que acompanha a cor da estação para área de leitura */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: bgGradient }} />
                    {/* Gradiente fundindo diretamente com a base branca do cartão */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent border-none outline-none" />
                </div>

                <div className="inline-flex items-center gap-2 relative z-10 md:-ml-2">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="hidden md:block w-7 h-7 md:w-10 md:h-10 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]"
                    />
                    <h3 className="text-base md:text-xl font-extrabold uppercase tracking-wide flex items-center gap-1 m-0">
                        <span className="hidden md:inline text-[#C62828]" style={{ letterSpacing: '0.8px', textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                            {MONTHS[month]}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="hidden md:inline text-[#C62828] text-sm md:text-base opacity-40 flex-shrink-0">•</span>
                            <span className="text-[#C62828]" style={{ letterSpacing: '0.8px', textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                                {year}
                            </span>
                        </div>
                    </h3>
                </div>

                {/* Badge da Estação (Desktop) */}
                <div className="hidden md:flex absolute top-[10px] right-[14px] z-10">
                    <div
                        className="transition-all duration-300 hover:scale-[1.05] cursor-default select-none group/season shadow-[0_4px_10px_rgba(0,0,0,0.12)]"
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
                            border: `0.5px solid ${season.style.border}`,
                        }}
                    >
                        <span className="text-base transform transition-transform group-hover/season:rotate-12">{season.emoji}</span>
                        <span>{season.name}</span>
                    </div>
                </div>
            </div>

            <div className="relative p-0 md:px-4 md:pt-6 md:pb-4 bg-transparent md:bg-gradient-to-br md:from-[#F0F9FF] md:to-[#E0F2FE] md:rounded-[20px] md:border-[0.5px] md:border-sky-400/20 opacity-100 md:shadow-[0_4px_16px_-4px_rgba(14,165,233,0.15),inset_0_1px_3px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(14,165,233,0.05)] filter-none backdrop-filter-none">
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
