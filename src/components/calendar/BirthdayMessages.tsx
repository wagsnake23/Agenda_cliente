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
      "bg-[#ffffff] rounded-2xl md:rounded-[22px] border border-orange-500/30 md:border-orange-500/40 relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300 shadow-sm",
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
        <div className="relative flex items-center justify-between pl-3 pr-2 md:pl-6 md:pr-4 z-20 w-full">
          <div className="flex items-center gap-2">
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

          <div className="flex flex-row md:flex-col items-center justify-center py-[4px] md:py-[4px] px-[12px] md:px-[10px] rounded-[10px] md:rounded-[11px] text-[12px] md:text-[13px] bg-[#f97316]/15 text-[#ea580c] leading-[1.1] ml-auto border-[0.5px] border-[#f97316]/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="font-bold uppercase tracking-wide">{MONTHS[month]?.substring(0, 3)}</span>
            <span className="hidden md:inline font-bold text-slate-600 opacity-90">{year}</span>
            <span className="inline md:hidden font-bold opacity-90 ml-[2px]">/{year}</span>
          </div>
        </div>
      </div>

      <div className="px-3 md:px-6 pt-0.5 md:pt-3 pb-2 md:pb-5 flex flex-col justify-start flex-1">
        {isEmpty ? (
          <div className="flex flex-col items-start justify-start pt-3 pb-4 gap-1">
            <div className="flex items-center gap-2.5 px-0.5 opacity-60">
              <span className="text-lg md:text-xl filter grayscale contrast-50 select-none">🎂</span>
              <span className="text-[11px] md:text-[12px] font-bold text-gray-400 uppercase tracking-[1px] leading-tight">
                Nenhum aniversariante para este mês
              </span>
            </div>
          </div>
        ) : (
          <div className="relative pl-[18px] before:content-[''] before:absolute before:left-[6px] before:top-[4px] before:bottom-[4px] before:w-[2px] before:bg-[#e5e7eb] flex flex-col w-full">
            {currentMonthBirthdays.map((data, i) => {
              const isHighlighted = data.day === highlightedDay;

              return (
                <React.Fragment key={i}>
                  <div
                    className={cn(
                      "relative transition-all duration-150 ease-in-out flex items-center gap-[8px] py-[3px] md:py-[6px] pl-0 hover:bg-[#f8fafc] hover:rounded-[6px] hover:pl-[4px] group w-full",
                      "before:content-[''] before:absolute before:left-[-12px] before:top-[12px] md:before:top-[14px] before:w-[8px] before:h-[8px] before:rounded-full before:bg-[#f97316]",
                      "text-[13px] md:text-[15px] lg:text-[16px] font-medium text-[#1F2937] uppercase tracking-tight leading-[1.6]",
                      isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md z-20 animate-bounce-twice font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-[8px] flex-1">
                      <span className="bg-[#f97316]/15 text-[#b45309] text-[12px] md:text-[14px] font-bold px-[8px] py-[3px] rounded-[6px] shrink-0">
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
                    <div className="h-[1px] my-[3px] md:my-[6px] bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent w-full" />
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