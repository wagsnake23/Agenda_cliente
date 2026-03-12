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
  year: number;
}

const MoonPhasesDisplay: React.FC<MoonPhasesDisplayProps> = ({ moonPhases, month, year }) => {
  return (
    <div className="bg-[#ffffff] rounded-[16px] relative z-10 min-h-[44px] h-full flex flex-col overflow-hidden transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05)]">
      {/* Highlight de topo sutil */}
      <div 
        className="absolute inset-x-0 top-0 h-[1.5px] z-30 pointer-events-none" 
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)' }} 
      />
      <div 
        className="relative w-full h-9 md:h-[52px] flex items-center"
        style={{ background: 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)' }}
      >
        {/* Conteúdo do Header */}
        <div className="relative flex items-center justify-between pl-1.5 pr-1.5 md:pl-6 md:pr-4 z-20 w-full">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl drop-shadow-[1px_3px_4px_rgba(0,0,0,0.45)] filter saturate-[1.3] brightness-[1.1] select-none">🌙</span>
            <h4 className="font-semibold text-white text-[14px] lg:text-[15px] uppercase tracking-[0.5px]">
              Fases da Lua
            </h4>
          </div>

          <div className="flex flex-row md:flex-col items-center justify-center py-[4px] md:py-[4px] px-[12px] md:px-[10px] rounded-[10px] md:rounded-[8px] text-[12px] md:text-[13px] bg-white/20 text-white leading-[1.1] ml-auto border-[0.5px] border-white/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
            <span className="font-bold uppercase tracking-wide">{MONTHS[month]?.substring(0, 3)}</span>
            <span className="hidden md:inline font-bold opacity-90">{year}</span>
            <span className="inline md:hidden font-bold opacity-90 ml-[2px]">/{year}</span>
          </div>
        </div>
      </div>


      <div className="px-1.5 md:px-6 pt-0.5 md:pt-3 pb-0 md:pb-5 flex flex-col justify-center items-center flex-1 w-full">
        <div className="flex flex-nowrap gap-3 md:gap-8 justify-center w-full overflow-x-auto pb-2">
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
                  {phase.phaseName}
                </span>
                <div className="flex flex-row mt-0.5 md:mt-1.5 items-center justify-center py-0 px-0 bg-transparent text-[#6366f1] text-[11px] md:text-[14px] leading-[1.6] md:leading-[1.1] shrink-0 border-none shadow-none">
                  <span className="font-semibold md:font-bold uppercase tracking-wide">{String(phase.date).padStart(2, '0')}</span>
                  <span className="font-semibold md:font-bold opacity-90 ml-[2px] uppercase">/{formattedMonth}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoonPhasesDisplay;