"use client";

import React, { useMemo } from 'react';
import { MONTHS } from '@/utils/calendar-utils';
import { cn } from '@/lib/utils';
import { Cake } from 'lucide-react';
import { getBirthdaysForMonth } from '@/hooks/use-calendar-events';
import type { CalendarEvent } from '@/hooks/use-calendar-events';

interface BirthdayMessagesProps {
  month: number;
  year: number;
  highlightedDay: number | null;
  calendarEvents?: CalendarEvent[];
}

const BirthdayMessages: React.FC<BirthdayMessagesProps> = ({ month, year, highlightedDay, calendarEvents = [] }) => {
  const currentMonthBirthdays = useMemo(() => {
    const monthName = (MONTHS[month] || '').substring(0, 3);
    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();

    return getBirthdaysForMonth(calendarEvents, month, year)
      .map(b => ({
        day: b.day,
        name: b.name,
        dateFormatted: `${String(b.day).padStart(2, '0')}/${formattedMonth}`
      }));
  }, [month, year, calendarEvents]);

  const isEmpty = currentMonthBirthdays.length === 0;

  return (
    <div className={cn(
      "bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-[22px] border border-yellow-500/20 md:border-gray-200/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300",
      isEmpty ? "hidden lg:flex" : "flex"
    )}>
      <div className="relative w-full h-9 md:h-[52px] flex items-center">
        {/* Faixa de fundo com gradiente horizontal */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/[0.25] to-transparent pointer-events-none" />

        {/* Barra lateral robusta */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 z-10 rounded-r-md" />

        {/* Conteúdo do Header */}
        <div className="relative flex items-center gap-2 px-3 md:px-6 z-20">
          <span className="text-lg md:text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] select-none">🎂</span>
          <h4 className="font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
            <span className="text-[#b45309]">
              Aniversariantes
            </span>
          </h4>
        </div>
      </div>

      <div className="px-3 md:px-6 pt-1 md:pt-3 pb-5 flex flex-col justify-start flex-1">
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-start py-4">
            <span className="text-[13px] md:text-[13px] lg:text-[14px] text-gray-400 font-normal italic leading-[1.6]">
              Nenhum aniversariante neste mês.
            </span>
          </div>
        ) : (
          currentMonthBirthdays.map((data, i) => {
            const isHighlighted = data.day === highlightedDay;

            return (
              <div
                key={i}
                className={cn(
                  "transition-all duration-300 ease-in-out flex items-center justify-start gap-2 py-0.5",
                  "text-[13px] md:text-[15px] lg:text-[16px] font-medium text-[#1F2937] uppercase tracking-tight leading-[1.6]",
                  isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md py-0.5 px-1 z-20 animate-bounce-twice font-semibold"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#b45309] shrink-0">{data.dateFormatted}</span>
                  <div className="flex items-center gap-1 font-medium text-[#334155] truncate">
                    <span className="opacity-50 mx-0.5 text-[10px] text-[#b45309]">•</span>
                    <span className="truncate">{data.name.replace(/Bombeiro\s+/i, '')}</span>
                    <span className="text-sm md:text-base transition-transform hover:scale-110 shrink-0 transform -translate-y-[1px]">
                      🎂
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BirthdayMessages;