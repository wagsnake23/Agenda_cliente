"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { MONTHS } from '@/utils/calendar-utils';
import { Calendar } from 'lucide-react';
import BrasilFlagIcon from '@/components/BrasilFlagIcon';

interface HolidayMessagesProps {
  messages: { day: number; name: string; emoji: string | null; type: string; is_fixed?: boolean; is_system?: boolean }[];
  highlightedDay: number | null;
  month: number;
  year: number;
}

const HolidayMessages: React.FC<HolidayMessagesProps> = ({ messages, highlightedDay, month, year }) => {
  const isEmpty = messages.length === 0;

  const monthName = (MONTHS[month] || '').substring(0, 3);
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();

  return (
    <div className="bg-[#ffffff] rounded-[16px] relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05)]">
      {/* Highlight de topo sutil */}
      <div 
        className="absolute inset-x-0 top-0 h-[1.5px] z-30 pointer-events-none" 
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)' }} 
      />
      <div 
        className="relative w-full h-9 md:h-[52px] flex items-center"
        style={{ background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)' }}
      >
        {/* Conteúdo do Header */}
        <div className="relative flex items-center justify-between pl-1.5 pr-1.5 md:pl-6 md:pr-4 z-20 w-full">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl drop-shadow-[1px_3px_4px_rgba(0,0,0,0.45)] filter saturate-[1.3] brightness-[1.1] select-none">📅</span>
            <h4 className="font-semibold text-white text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
              Feriados e Datas
            </h4>
          </div>

          <div className="flex flex-row md:flex-col items-center justify-center py-[4px] md:py-[4px] px-[12px] md:px-[10px] rounded-[10px] md:rounded-[11px] text-[12px] md:text-[13px] bg-white/20 text-white leading-[1.1] ml-auto border-[0.5px] border-white/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
            <span className="font-bold uppercase tracking-wide">{MONTHS[month]?.substring(0, 3)}</span>
            <span className="hidden md:inline font-bold opacity-90">{year}</span>
            <span className="inline md:hidden font-bold opacity-90 ml-[2px]">/{year}</span>
          </div>
        </div>
      </div>

      <div className="px-1.5 md:px-6 pt-0.5 md:pt-3 pb-2 md:pb-5 flex flex-col justify-start flex-1">
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-start py-4">
            <span className="text-[13px] md:text-[13px] lg:text-[14px] text-gray-400 font-normal italic leading-[1.6]">
              Nenhum feriado ou evento registrado neste mês.
            </span>
          </div>
        ) : (
          <div className="relative pl-[18px] before:content-[''] before:absolute before:left-[6px] before:top-[4px] before:bottom-[4px] before:w-[2px] before:bg-[#e5e7eb] flex flex-col w-full">
            {messages.map((event, i) => {
              const day = event.day;
              const isHighlighted = day !== null && day === highlightedDay;

              const isInfoEvent = event.type === 'event' ||
                event.name.includes('Páscoa') ||
                event.name.includes('Mães') ||
                event.name.includes('Pais') ||
                event.name.includes('Namorados') ||
                event.name.includes('Mulher') ||
                event.name.includes('Bombeiro') ||
                event.name.includes('Cinzas') ||
                event.name.includes('Início d');

              const emoji = event.emoji;
              const name = event.name;

              return (
                <React.Fragment key={i}>
                  <div
                    className={cn(
                      "cursor-transition-all duration-150 ease-in-out flex items-start py-[3px] md:py-[6px] pl-0 hover:bg-[#f8fafc] hover:rounded-[6px] hover:pl-[4px] group w-full",
                      "text-[13px] md:text-[15px] lg:text-[16px] font-medium uppercase tracking-tight leading-[1.6]",
                      isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md z-20 animate-bounce-twice font-semibold",
                      isInfoEvent && !isHighlighted && "text-slate-500",
                      !isInfoEvent && !isHighlighted && "text-[#1F2937]"
                    )}
                  >
                    <div className={cn(
                      "flex items-start gap-[8px] flex-1 relative",
                      "before:content-[''] before:absolute before:left-[-12px] before:top-[8px] md:before:top-[14px] before:w-[8px] before:h-[8px] before:rounded-full",
                      isInfoEvent ? "before:bg-[#94a3b8]" : "before:bg-[#ef4444]"
                    )}>
                      <div className={cn(
                        "flex flex-row items-center justify-center py-[2px] md:py-[4px] px-[8px] md:px-[10px] rounded-[6px] md:rounded-[8px] text-[11px] md:text-[13px] leading-[1.1] border-[0.5px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.06)] md:shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] shrink-0",
                        !event.is_fixed && event.type === 'event' 
                          ? "bg-[#dbeafe] md:bg-gradient-to-b md:from-blue-400 md:to-blue-500 text-[#1e40af] md:text-white border-[#bfdbfe] md:border-white/30" 
                          : isInfoEvent ? "bg-[#e2e8f0] text-[#1e293b] border-[#cbd5e1]" : "bg-[#ef4444]/15 md:bg-gradient-to-b md:from-red-400 md:to-red-500 text-[#c62828] md:text-white border-[#fca5a5]/40 md:border-white/30"
                      )}>
                        <span className="font-bold uppercase tracking-wide">{String(day).padStart(2, '0')}</span>
                        <span className="font-bold opacity-90 ml-[2px] uppercase">/{formattedMonth}</span>
                      </div>

                      <span className={cn("flex items-start gap-1 whitespace-normal", isInfoEvent ? "text-[#475569]" : "text-[#334155]")}>
                        <span className="break-words">
                          {name}
                        </span>
                        {emoji && (
                          <span className="text-base md:text-xl drop-shadow-[0_3px_8px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] transition-transform hover:scale-110 transform -translate-y-[1px] shrink-0 pt-0.5">
                            {emoji}
                          </span>
                        )}
                        {name.includes('Independência do Brasil') && (
                          <div className="md:scale-125 origin-left transition-transform shrink-0">
                            <BrasilFlagIcon size={14} />
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                  {i < messages.length - 1 && (
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

export default HolidayMessages;