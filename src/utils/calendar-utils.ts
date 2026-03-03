"use client";

export const MONTHS = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

export const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const REFERENCE_DATE = new Date(2024, 0, 1);

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

// ─── Cores de fundo do calendário (lógica de escala, não remove) ───

export const getColorForDate = (date: Date): { bg: string; text: string } => {
  const daysDiff = getDaysBetween(REFERENCE_DATE, date);
  const colorIndex = daysDiff % 3;
  const colors = [
    { bg: 'bg-calendar-yellow', text: 'text-calendar-yellowText' },
    { bg: 'bg-calendar-blue', text: 'text-calendar-blueText' },
    { bg: 'bg-calendar-green', text: 'text-calendar-greenText' },
  ];
  return colors[colorIndex < 0 ? (3 + colorIndex) : colorIndex];
};

export const getBackgroundByType = (type: string) => {
  switch (type) {
    case 'holiday':
      return {
        bg: 'bg-red-100',
        text: 'text-red-900'
      };
    case 'event':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-900'
      };
    case 'birthday':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-900'
      };
    default:
      return null;
  }
};

export const getColorForDateClean = (date: Date, eventColor: { bg: string; text: string } | null = null): { bg: string; text: string } => {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Prioridade 1: Cor do evento
  if (eventColor) {
    return eventColor;
  }

  // Prioridade 2: Fim de semana
  if (isWeekend) {
    return { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' };
  }

  // Padrão: Dia útil
  return { bg: 'bg-white', text: 'text-black' };
};

export const getColorForDateTwoTone = (date: Date): { bg: string; text: string } => {
  const daysDiff = getDaysBetween(REFERENCE_DATE, date);
  const colorIndex = daysDiff % 2;
  const colors = [
    { bg: 'bg-calendar-blue', text: 'text-calendar-blueText' },
    { bg: 'bg-calendar-yellow', text: 'text-calendar-yellowText' },
  ];
  return colors[colorIndex < 0 ? (2 + colorIndex) : colorIndex];
};

export const getColorForMode = (
  date: Date,
  mode: '24x48' | '12x36' | 'adm' = '24x48',
  eventColor: { bg: string; text: string } | null = null
): { bg: string; text: string } => {
  switch (mode) {
    case 'adm':
      return getColorForDateClean(date, eventColor);
    case '12x36':
      return getColorForDateTwoTone(date);
    case '24x48':
    default:
      return getColorForDate(date);
  }
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