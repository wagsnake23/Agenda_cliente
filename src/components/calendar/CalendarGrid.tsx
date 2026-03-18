"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import CalendarDay from './CalendarDay';
import { DAYS_OF_WEEK } from '@/utils/calendar-utils';
import { cn } from '@/lib/utils';

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

  return (
    <>
      {/* ========================= */}
      {/* DIAS DA SEMANA */}
      {/* ========================= */}

      <div className="grid grid-cols-7 gap-[3px] md:gap-1 mb-2 relative z-10 w-full py-0 mt-0 lg:-mt-2">
        {DAYS_OF_WEEK.map((day, index) => {
          const isSundayHeader = index === 0;
          const isToday = isCurrentMonthAndYear && index === todayDayOfWeek;

          return (
            <div
              key={day}
              className={cn(
                // Estrutura fixa (NUNCA animar isso)
                "flex items-center justify-center text-center",
                "text-[12px] md:text-[13px] lg:text-[15px]",
                "font-bold tracking-[0.4px]",
                "rounded-[9px] md:rounded-[11px]",
                "aspect-square md:aspect-auto",
                "w-full md:h-[38px] lg:h-[48px]",
                "py-1 relative overflow-hidden border border-blue-200/80 md:border-[0.5px] md:border-blue-200/70",
                "saturate-[1.05]",

                // Transição segura (somente cores e sombra)
                "transition-[background-color,color,box-shadow] duration-200 ease-out",

                // Pseudo brilho fixo
                "after:absolute after:inset-0 after:rounded-[9px] md:after:rounded-[11px] after:bg-gradient-to-b after:from-white/20 after:to-transparent after:pointer-events-none",

                "shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.05)]",
                "bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe]",
                isSundayHeader ? "text-[#e45555]" : "text-[#1e40af]",
                isToday && "z-20"
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
              <Skeleton className="w-full h-full rounded-[9px] md:rounded-[11px]" />
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
