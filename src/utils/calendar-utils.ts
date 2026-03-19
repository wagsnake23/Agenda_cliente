"use client";

export const MONTHS = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

export const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const SWIPE_THRESHOLD = 50;

export const getDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// ─── Estações (apenas para UI do CalendarCard, não mais para lógica de dados) ───

export const getSeasonDataForDate = (month: number, day: number) => {
  if ((month === 11 && day >= 21) || month === 0 || month === 1 || (month === 2 && day < 20)) {
    return { name: 'Verão', emoji: '🌞' };
  }
  if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21)) {
    return { name: 'Outono', emoji: '🍂' };
  }
  if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 22)) {
    return { name: 'Inverno', emoji: '❄️' };
  }
  return { name: 'Primavera', emoji: '🌸' };
};

// --- Estações ---

export const getBackgroundByType = (type: string) => {
  switch (type) {
    case 'holiday':
      return {
        bg: 'bg-gradient-to-br from-[#fef2f2] to-[#fecaca]',
        border: 'border-red-200/80',
        text: 'text-[#991b1b]'
      };
    case 'event':
      return {
        bg: 'bg-blue-200',
        border: 'border-blue-400/80',
        text: 'text-blue-900'
      };
    case 'birthday':
      return {
        bg: 'bg-orange-100',
        border: 'border-orange-300',
        text: 'text-orange-800'
      };
    default:
      return null;
  }
};

export const getColorForDateClean = (date: Date, eventColor: { bg: string; text: string; border?: string } | null = null): { bg: string; text: string; border?: string } => {
  const dayOfWeek = date.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  // Prioridade 1: Cor do evento
  if (eventColor) {
    return eventColor;
  }

  // Prioridade 2: Domingo
  if (isSunday) {
    return { bg: 'bg-gradient-to-br from-[#fef2f2] to-[#fecaca]', border: 'border-red-200/80', text: 'text-[#991b1b]' };
  }

  // Prioridade 3: Sábado (Cinza gradiente)
  if (isSaturday) {
    return { 
      bg: 'bg-gradient-to-br from-[#f1f5f9] to-[#cbd5e1] md:from-[#f1f5f9] md:to-[#acb6c5]', 
      border: 'border-slate-400/70', 
      text: 'text-black' 
    };
  }

  // Padrão: Dia útil
  return { bg: 'bg-white', border: 'border-slate-300', text: 'text-black' };
};

export const getColorForMode = (
  date: Date,
  _mode: 'adm' = 'adm',
  eventColor: { bg: string; text: string; border?: string } | null = null
): { bg: string; text: string; border?: string } => {
  return getColorForDateClean(date, eventColor);
};

export const getMoonPhase = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) +
    Math.floor(275 * month / 9) + day + 1721013.5;

  const daysSinceNew = jd - 2451549.5;
  const newMoons = daysSinceNew / 29.53058867;
  const phase = (newMoons - Math.floor(newMoons)) * 29.53058867;

  if (phase < 1.84566) return 0;
  if (phase < 9.22831) return 1;
  if (phase < 16.61096) return 2;
  if (phase < 23.99361) return 3;
  return 0;
};