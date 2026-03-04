"use client";

import React from 'react';
import { Moon } from 'lucide-react';
import { MONTHS } from '@/utils/calendar-utils';

interface MoonPhaseData {
  date: number;
  phaseName: string;
  phaseIcon: string;
}

interface MoonPhasesDisplayProps {
  moonPhases: MoonPhaseData[];
  month: number;
}

const MoonPhasesDisplay: React.FC<MoonPhasesDisplayProps> = ({ moonPhases, month }) => {
  return (
    <div className="bg-white rounded-2xl md:rounded-[22px] border border-slate-400/30 md:border-slate-300/40 relative z-10 min-h-[44px] h-full flex flex-col overflow-hidden transition-all duration-300">
      <div className="relative w-full h-9 md:h-[52px] flex items-center">
        {/* Faixa de fundo com gradiente horizontal */}
        {/* Faixa de fundo com gradiente horizontal equilibrado */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(71,85,105,0.38) 0%, rgba(71,85,105,0.28) 30%, rgba(71,85,105,0.16) 65%, rgba(71,85,105,0.07) 100%)'
          }}
        />

        {/* Barra lateral */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400/80 rounded-r-md z-10" />

        {/* Conteúdo do Header */}
        <div className="relative flex items-center gap-2 px-3 md:px-6 z-20">
          <span className="text-lg md:text-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.1] select-none">🌙</span>
          <h4 className="font-bold text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
            <span style={{
              background: 'linear-gradient(135deg, #334155 0%, #475569 55%, #5a6a7d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Fases da Lua
            </span>
          </h4>
        </div>
      </div>

      <div className="px-3 md:px-6 pt-1 md:pt-3 pb-2 md:pb-5 flex flex-col justify-start flex-1">
        <div className="flex flex-nowrap gap-3 md:gap-4 justify-start overflow-x-auto pb-2 pl-0 md:pl-[28px]">
          {moonPhases.map((phase, index) => {
            const monthAbbr = (MONTHS[month] || 'Mês').substring(0, 3);
            const formattedMonth = monthAbbr.charAt(0).toUpperCase() + monthAbbr.slice(1).toLowerCase();

            return (
              <div
                key={index}
                className="flex flex-col items-center justify-center px-0.5 py-0.5 transition-all duration-200 w-12 md:w-16 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 cursor-pointer"
              >
                <span className="text-2xl md:text-3xl mb-1.5 drop-shadow-[0_3px_10px_rgba(0,0,0,0.2)] filter saturate-[1.3] brightness-[1.05] transition-all duration-200 hover:scale-110">{phase.phaseIcon}</span>
                <span className="text-[13px] md:text-[15px] lg:text-[16px] font-medium text-[#1F2937] text-center leading-[1.6] uppercase tracking-tighter opacity-90">
                  <span className="inline md:hidden">{phase.phaseName}</span>
                  <span className="hidden md:inline">
                    {phase.phaseName === 'Cresc.' ? 'Crescente' :
                      phase.phaseName === 'Ming.' ? 'Minguante' :
                        phase.phaseName}
                  </span>
                </span>
                <span className="text-[11px] md:text-[13px] lg:text-[14px] text-[#475569] mt-0.5 font-semibold leading-[1.6]">
                  {String(phase.date).padStart(2, '0')}/{formattedMonth}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoonPhasesDisplay;