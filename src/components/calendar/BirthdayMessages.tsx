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
      "bg-white rounded-2xl md:rounded-[22px] border border-orange-500/30 md:border-orange-500/40 relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300",
      isEmpty ? "hidden lg:flex" : "flex"
    )}>
      <div className="relative w-full h-9 md:h-[52px] flex items-center">
        {/* Faixa de fundo com gradiente horizontal equilibrado */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(249,115,22,0.38) 0%, rgba(249,115,22,0.28) 30%, rgba(249,115,22,0.16) 65%, rgba(249,115,22,0.07) 100%)'
          }}
        />

        {/* Barra lateral */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 z-10 rounded-r-md" />

        {/* Conteúdo do Header */}
        <div className="relative flex items-center gap-2 px-3 md:px-6 z-20">
          <span className="text-lg md:text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] select-none">🎂</span>
          <h4 className="font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
            <span style={{
              background: 'linear-gradient(135deg, #b45309 0%, #92400e 55%, #7c3a10 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
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
          <div className="relative pl-[18px] before:content-[''] before:absolute before:left-[6px] before:top-[4px] before:bottom-[4px] before:w-[2px] before:bg-[#e5e7eb] flex flex-col w-full">
            {currentMonthBirthdays.map((data, i) => {
              const isHighlighted = data.day === highlightedDay;

              return (
                <React.Fragment key={i}>
                  <div
                    className={cn(
                      "relative transition-all duration-150 ease-in-out flex items-center gap-[8px] py-[6px] pl-0 hover:bg-[#f8fafc] hover:rounded-[6px] hover:pl-[4px] group w-full",
                      "before:content-[''] before:absolute before:left-[-12px] before:top-[12px] md:before:top-[14px] before:w-[8px] before:h-[8px] before:rounded-full before:bg-[#f97316]",
                      "text-[13px] md:text-[15px] lg:text-[16px] font-medium text-[#1F2937] uppercase tracking-tight leading-[1.6]",
                      isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md z-20 animate-bounce-twice font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-[8px] flex-1">
                      <span className="bg-[#f1f5f9] text-[#334155] text-[12px] font-semibold px-[8px] py-[3px] rounded-[6px] shrink-0">
                        {data.dateFormatted}
                      </span>
                      <span className="flex items-center gap-1 text-[#334155] truncate">
                        <span className="truncate">{data.name.replace(/Bombeiro\s+/i, '')}</span>
                        <span className="text-sm md:text-base transition-transform hover:scale-110 shrink-0 transform -translate-y-[1px]">
                          🎂
                        </span>
                      </span>
                    </div>
                  </div>
                  {i < currentMonthBirthdays.length - 1 && (
                    <div className="h-[1px] my-[6px] bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent w-full" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BirthdayMessages;