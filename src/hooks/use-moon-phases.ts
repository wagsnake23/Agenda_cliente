"use client";

import { useMemo } from 'react';
import { getMoonPhase } from '@/utils/calendar-utils';

interface MoonPhaseData {
  date: number;
  phaseName: string;
  phaseIcon: string;
}

export const useMoonPhases = (month: number, year: number) => {
  const moonPhases = useMemo(() => {
    const phases: MoonPhaseData[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const phase = getMoonPhase(date);
      const prevDate = new Date(year, month, day - 1);
      const prevPhase = day > 1 ? getMoonPhase(prevDate) : -1;
      
      if (phase !== prevPhase || day === 1) {
        let phaseName = '';
        let phaseIcon = '';
        
        switch (phase) {
          case 0:
            phaseName = 'Nova';
            phaseIcon = '🌑';
            break;
          case 1:
            phaseName = 'Cresc.';
            phaseIcon = '🌓';
            break;
          case 2:
            phaseName = 'Cheia';
            phaseIcon = '🌕';
            break;
          case 3:
            phaseName = 'Ming.';
            phaseIcon = '🌗';
            break;
        }
        
        phases.push({ date: day, phaseName, phaseIcon });
      }
    }
    
    return phases;
  }, [month, year]);

  return moonPhases;
};