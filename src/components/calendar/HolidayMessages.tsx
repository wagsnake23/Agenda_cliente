"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { MONTHS } from '@/utils/calendar-utils';
import { Calendar } from 'lucide-react';
import BrasilFlagIcon from '@/components/BrasilFlagIcon';

interface HolidayMessagesProps {
  messages: string[];
  highlightedDay: number | null;
  month: number; // Nova prop
}

const HolidayMessages: React.FC<HolidayMessagesProps> = ({ messages, highlightedDay, month }) => {
  const isEmpty = messages.length === 0;

  const monthName = (MONTHS[month] || '').substring(0, 3);
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();

  return (
    <div className="bg-white rounded-2xl md:rounded-[22px] border border-red-400/30 md:border-red-300/40 relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300">
      <div className="relative w-full h-9 md:h-[52px] flex items-center">
        {/* Faixa de fundo com gradiente horizontal equilibrado */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(198,40,40,0.38) 0%, rgba(198,40,40,0.28) 30%, rgba(198,40,40,0.16) 65%, rgba(198,40,40,0.07) 100%)'
          }}
        />

        {/* Barra lateral */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 z-10 rounded-r-md" />

        {/* Conteúdo do Header */}
        <div className="relative flex items-center gap-2 px-3 md:px-6 z-20">
          <span className="text-lg md:text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] select-none">📅</span>
          <h4 className="font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
            <span style={{
              background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 55%, #8e3030 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Feriados e Eventos
            </span>
          </h4>
        </div>
      </div>

      <div className="px-3 md:px-6 pt-1 md:pt-3 pb-5 flex flex-col justify-start flex-1">
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-start py-4">
            <span className="text-[13px] md:text-[13px] lg:text-[14px] text-gray-400 font-normal italic leading-[1.6]">
              Nenhum feriado ou evento registrado neste mês.
            </span>
          </div>
        ) : (
          <div className="relative pl-[18px] before:content-[''] before:absolute before:left-[6px] before:top-[4px] before:bottom-[4px] before:w-[2px] before:bg-[#e5e7eb] flex flex-col w-full">
            {messages.map((linha, i) => {
              const dayMatch = linha.match(/^(\d{2})/); // Extrai o dia da string
              const day = dayMatch ? parseInt(dayMatch[1], 10) : null;
              const isHighlighted = day !== null && day === highlightedDay;
              const isGrayEvent = linha.includes('Páscoa') ||
                linha.includes('Dia das Mães') ||
                linha.includes('Dia dos Pais') ||
                linha.includes('Dia dos Namorados') ||
                linha.includes('Dia do Bombeiro') ||
                linha.includes('Dia Internacional da Mulher') ||
                linha.includes('Quarta-feira de Cinzas') ||
                linha.includes('Início d');
              const emojiMatch = linha.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Component})+$/u);
              const emoji = emojiMatch ? emojiMatch[0] : null;
              const textWithoutEmoji = emoji ? linha.replace(emoji, '').trim() : linha;

              return (
                <React.Fragment key={i}>
                  <div
                    className={cn(
                      "relative transition-all duration-150 ease-in-out flex items-center gap-[8px] py-[6px] pl-0 hover:bg-[#f8fafc] hover:rounded-[6px] hover:pl-[4px] group w-full",
                      "before:content-[''] before:absolute before:left-[-12px] before:top-[12px] md:before:top-[14px] before:w-[8px] before:h-[8px] before:rounded-full",
                      isGrayEvent ? "before:bg-[#94a3b8]" : "before:bg-[#ef4444]",
                      "text-[13px] md:text-[15px] lg:text-[16px] font-medium uppercase tracking-tight leading-[1.6]",
                      isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md z-20 animate-bounce-twice font-semibold",
                      isGrayEvent && !isHighlighted && "text-gray-400",
                      !isGrayEvent && !isHighlighted && "text-[#1F2937]"
                    )}
                  >
                    <div className="flex items-center gap-[8px] flex-1">
                      {dayMatch ? (
                        <span className={cn(
                          "text-[12px] font-semibold px-[8px] py-[3px] rounded-[6px] shrink-0",
                          isGrayEvent ? "bg-slate-100 text-slate-500" : "bg-[#f1f5f9] text-[#334155]"
                        )}>
                          {dayMatch[1]}/{formattedMonth}
                        </span>
                      ) : null}

                      <span className={cn("flex items-center gap-1 truncate", isGrayEvent ? "text-[#475569]" : "text-[#334155]")}>
                        <span className="truncate">
                          {dayMatch ? textWithoutEmoji.replace(/^\d{2}\s*-\s*/, '') : textWithoutEmoji}
                        </span>
                        {emoji && (
                          <span className="text-base md:text-xl drop-shadow-[0_3px_8px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] transition-transform hover:scale-110 transform -translate-y-[1px] shrink-0">
                            {emoji}
                          </span>
                        )}
                        {linha.includes('Independência do Brasil') && (
                          <div className="md:scale-125 origin-left transition-transform shrink-0">
                            <BrasilFlagIcon size={14} />
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                  {i < messages.length - 1 && (
                    <div className="h-[1px] my-[6px] bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent w-full" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div >
  );
};

export default HolidayMessages;