"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import CalendarDay from './CalendarDay';
import { DAYS_OF_WEEK } from '@/utils/calendar-utils';
import { cn } from '@/lib/utils';
import { useCalendarMode } from '@/hooks/use-calendar-mode';

interface CalendarGridProps {
  calendarData: ({
    day: number;
    isToday: boolean;
    colors: { bg: string; text: string; border?: string };
    isHoliday: boolean;
    holidayName?: string;
    isBirthday?: boolean;
    birthdayName?: string;
    specialEmojiName?: string;
    specialEmojiIcon?: string;
    isWeekend: boolean;
  } | null)[];
  isTransitioning: boolean;
  todayDayOfWeek: number;
  todayColors: { bg: string; text: string };
  isCurrentMonthAndYear: boolean;
  onDayClick: (day: number) => void;
  agendamentos?: any[];
  onViewAgendamento?: (date: string, id?: string) => void;
  month: number;
  year: number;
  selectedPeriod?: { start: string, end: string } | null;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarData,
  isTransitioning,
  todayDayOfWeek,
  todayColors,
  isCurrentMonthAndYear,
  onDayClick,
  agendamentos = [],
  onViewAgendamento,
  month,
  year,
  selectedPeriod,
}) => {
  const { mode } = useCalendarMode();

  return (
    <>
      {/* ========================= */}
      {/* DIAS DA SEMANA */}
      {/* ========================= */}

      <div className="grid grid-cols-7 gap-[3px] md:gap-1 mb-2 relative z-10 w-full py-0 mt-0 lg:-mt-2">
        {DAYS_OF_WEEK.map((day, index) => {
          const isWeekend = index === 0 || index === 6;
          const isToday = isCurrentMonthAndYear && index === todayDayOfWeek;

          return (
            <div
              key={day}
              className={cn(
                // Estrutura fixa (NUNCA animar isso)
                "flex items-center justify-center text-center",
                "text-[12px] md:text-[13px] lg:text-[15px]",
                "font-bold tracking-[0.4px]",
                "rounded-[11px]",
                "aspect-square md:aspect-auto",
                "w-full md:h-[38px] lg:h-[48px]",
                "py-1 relative overflow-hidden border-none",
                "bg-clip-padding saturate-[1.05]",

                // Transição segura (somente cores e sombra)
                "transition-[background-color,color,box-shadow] duration-200 ease-out",

                // Pseudo brilho fixo
                "after:absolute after:inset-0 after:rounded-[11px] after:bg-gradient-to-b after:from-white/20 after:to-transparent after:pointer-events-none",

                // =====================
                // MODO ADM
                // =====================
                mode === 'adm'
                  ? cn(
                    "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.08)]",
                    "bg-gradient-to-b from-[#F4F6F8] to-[#E6E9ED]",
                    isWeekend ? "text-red-800" : "text-slate-700",
                    isToday && "z-20"
                  )

                  // =====================
                  // MODO NORMAL
                  // =====================
                  : cn(
                    "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.08)]",

                    isToday
                      ? cn(
                        "z-10",
                        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.08)]",

                        todayColors.bg === 'bg-calendar-blue' &&
                        "bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white",

                        todayColors.bg === 'bg-calendar-green' &&
                        "bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white",

                        todayColors.bg === 'bg-calendar-yellow' &&
                        "bg-gradient-to-br from-[#fde047] to-[#f59e0b] text-[#1A1A1A]"
                      )
                      : cn(
                        isWeekend ? 'text-red-800' : 'text-slate-700',
                        "bg-gradient-to-b from-[#F4F6F8] to-[#E6E9ED]"
                      )
                  )
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* ========================= */}
      {/* GRADE DOS DIAS DO MÊS */}
      {/* ========================= */}

      <div
        className={cn(
          "grid grid-cols-7 gap-[3px] md:gap-1 relative z-10",
          "transition-opacity duration-200 ease-out",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {isTransitioning
          ? Array.from({ length: 42 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square md:aspect-auto flex items-center justify-center w-full md:h-[38px] lg:h-[48px]"
            >
              <Skeleton className="w-full h-full rounded-[11px]" />
            </div>
          ))
          : calendarData.map((dayData, index) => (
            <div
              key={index}
              className="aspect-square md:aspect-auto flex items-center justify-center w-full md:h-[38px] lg:h-[48px]"
            >
              <CalendarDay
                dayData={dayData}
                onDayClick={onDayClick}
                agendamentos={agendamentos}
                onViewAgendamento={onViewAgendamento}
                month={month}
                year={year}
                selectedPeriod={selectedPeriod}
              />
            </div>
          ))}
      </div>
    </>
  );
};

export default CalendarGrid;
