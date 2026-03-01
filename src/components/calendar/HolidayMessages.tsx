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
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-[22px] border border-red-500/20 md:border-gray-200/50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] relative z-10 min-h-[100px] h-full flex flex-col overflow-hidden transition-all duration-300">
      <div className="relative w-full h-9 md:h-[52px] flex items-center">
        {/* Faixa de fundo com gradiente horizontal */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.25] to-transparent pointer-events-none" />

        {/* Barra lateral robusta */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 z-10 rounded-r-md" />

        {/* Conteúdo do Header */}
        <div className="relative flex items-center gap-2 px-3 md:px-6 z-20">
          <span className="text-lg md:text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] select-none">📅</span>
          <h4 className="font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
            <span style={{
              background: 'linear-gradient(135deg, #c62828 0%, #8e0000 100%)',
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
            <span className="text-[12px] md:text-[14px] lg:text-[15px] text-gray-400 font-normal italic leading-[1.6]">
              Nenhum feriado ou evento registrado neste mês.
            </span>
          </div>
        ) : (
          messages.map((linha, i) => {
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
              <div
                key={i}
                className={cn(
                  "transition-all duration-300 ease-in-out flex items-center justify-start gap-2 py-0.5",
                  "text-[13px] md:text-[14px] lg:text-[15px] font-medium text-[#1F2937] uppercase tracking-tight leading-[1.6]",
                  isHighlighted && "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 rounded-md py-0.5 px-1 z-20 animate-bounce-twice font-semibold",
                  isGrayEvent && !isHighlighted && "text-gray-400"
                )}
              >
                <span className="font-medium">
                  {dayMatch ? (
                    <>
                      <span className={cn(
                        "font-semibold",
                        isGrayEvent ? "text-[#475569]" : "text-[#c62828]"
                      )}>
                        {dayMatch[1]}/{formattedMonth}
                      </span>
                      <span className={cn("opacity-50 mx-0.5 text-[10px]", isGrayEvent ? "text-[#475569]" : "text-[#c62828]")}>•</span>
                      <span className={isGrayEvent ? "text-[#475569]" : "text-[#334155]"}>
                        {textWithoutEmoji.replace(/^\d{2}\s*-\s*/, '')}
                      </span>
                    </>
                  ) : textWithoutEmoji}
                </span>
                {emoji && (
                  <span className="text-base md:text-xl drop-shadow-[0_3px_8px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] transition-transform hover:scale-110 transform -translate-y-[1px]">
                    {emoji}
                  </span>
                )}
                {linha.includes('Independência do Brasil') && (
                  <div className="md:scale-125 origin-left transition-transform">
                    <BrasilFlagIcon size={14} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div >
  );
};

export default HolidayMessages;