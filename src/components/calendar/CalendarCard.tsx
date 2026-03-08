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

    const baseWhiteLight = "radial-gradient(circle at top left, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 12%, rgba(255,255,255,0.45) 24%, rgba(255,255,255,0.18) 36%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0) 62%)";

    const seasonGradients: Record<string, string> = {
        "VERÃO": `${baseWhiteLight}, radial-gradient(circle at top left, rgba(255,255,255,0.96) 0%, rgba(255,250,230,0.80) 12%, rgba(255,235,180,0.55) 26%, rgba(255,220,140,0.30) 40%, rgba(255,210,90,0.12) 52%, rgba(255,210,90,0) 65%)`,
        "OUTONO": `${baseWhiteLight}, radial-gradient(circle at top left, rgba(255,255,255,0.96) 0%, rgba(255,248,235,0.80) 12%, rgba(255,225,190,0.55) 26%, rgba(255,200,150,0.30) 40%, rgba(255,170,110,0.12) 52%, rgba(255,170,110,0) 65%)`,
        "INVERNO": `${baseWhiteLight}, radial-gradient(circle at top left, rgba(255,255,255,0.96) 0%, rgba(245,250,255,0.80) 12%, rgba(225,240,255,0.55) 26%, rgba(200,225,255,0.30) 40%, rgba(170,210,255,0.12) 52%, rgba(170,210,255,0) 65%)`,
        "PRIMAVERA": `${baseWhiteLight}, radial-gradient(circle at top left, rgba(255,255,255,0.96) 0%, rgba(255,245,250,0.80) 12%, rgba(255,225,240,0.55) 26%, rgba(255,200,230,0.30) 40%, rgba(255,170,220,0.12) 52%, rgba(255,170,220,0) 65%)`
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
                "md:shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(0,0,0,0.06),0_12px_30px_rgba(0,0,0,0.08)]",
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
                    "md:-mx-8 md:-mt-4 md:px-8 md:pt-4 mb-0 relative overflow-hidden md:rounded-t-[28px] md:h-[99px] border-none outline-none shadow-none bg-white"
                )}
            >
                {/* Background da Estação */}
                <div
                    className="absolute inset-0 z-0 border-none outline-none contrast-[1.05] saturate-[1.05]"
                    style={{
                        backgroundImage: `${bgGradient}, url(${bgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    {/* Gradiente superior para melhorar a leitura do título do mês */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0) 45%)' }}
                    />
                    {/* Vignette suave nas bordas para criar profundidade no banner */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.10) 100%)' }}
                    />
                    {/* Gradiente fundindo diretamente com a base branca do cartão */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent border-none outline-none" />
                </div>

                <div className="inline-flex items-center gap-2 relative z-10 md:-ml-2 -mt-[9px]">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="hidden md:block w-8 h-8 md:w-[54px] md:h-[54px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
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
                className="relative p-0 md:px-4 md:pt-6 md:pb-4 md:-mt-1 bg-transparent md:rounded-[20px] opacity-100 md:shadow-[0_4px_16px_-4px_rgba(14,165,233,0.15),inset_0_1px_3px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(14,165,233,0.05)] transition-colors duration-500"
                style={{
                    background: isDesktopState ? 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)' : 'transparent',
                    border: isDesktopState ? '0.5px solid rgba(14, 165, 233, 0.2)' : 'none'
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
