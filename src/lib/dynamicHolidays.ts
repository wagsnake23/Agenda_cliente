import type { CalendarEvent } from '@/hooks/use-calendar-events';

export const calculateEaster = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
};

export const getDynamicHolidays = (year: number): CalendarEvent[] => {
    const easter = calculateEaster(year);

    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 47);

    const ashWednesday = new Date(carnival);
    ashWednesday.setDate(carnival.getDate() + 1);

    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);

    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);

    const mothersDay = new Date(year, 4, 1);
    while (mothersDay.getDay() !== 0) mothersDay.setDate(mothersDay.getDate() + 1);
    mothersDay.setDate(mothersDay.getDate() + 7);

    const fathersDay = new Date(year, 7, 1);
    while (fathersDay.getDay() !== 0) fathersDay.setDate(fathersDay.getDay() + 1);
    fathersDay.setDate(fathersDay.getDate() + 7);

    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return [
        { id: 'sys-carnaval', title: 'Carnaval', date: fmt(carnival), type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '🎭', description: null },
        { id: 'sys-cinzas', title: 'Quarta-feira de Cinzas', date: fmt(ashWednesday), type: 'event', is_fixed: false, color_mode: 'event_only', is_system: true, is_active: true, emoji: '⚱️', description: null },
        { id: 'sys-sexta-santa', title: 'Sexta-feira Santa', date: fmt(goodFriday), type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '✝️', description: null },
        { id: 'sys-pascoa', title: 'Páscoa', date: fmt(easter), type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '🥚', description: null },
        { id: 'sys-corpus', title: 'Corpus Christi', date: fmt(corpusChristi), type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '⛪', description: null },
        { id: 'sys-maes', title: 'Dia das Mães', date: fmt(mothersDay), type: 'event', is_fixed: false, color_mode: 'event_only', is_system: true, is_active: true, emoji: '🤱', description: null },
        { id: 'sys-pais', title: 'Dia dos Pais', date: fmt(fathersDay), type: 'event', is_fixed: false, color_mode: 'event_only', is_system: true, is_active: true, emoji: '👨‍👦', description: null }
    ] as CalendarEvent[];
};

export const getNationalHolidays = (year: number): CalendarEvent[] => {
    return [
        { id: 'sys-ano-novo', title: 'Ano Novo', date: `${year}-01-01`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '🍾', description: null },
        { id: 'sys-tiradentes', title: 'Tiradentes', date: `${year}-04-21`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '⚔️', description: null },
        { id: 'sys-trabalho', title: 'Dia do Trabalho', date: `${year}-05-01`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '💼', description: null },
        { id: 'sys-independencia', title: 'Independência do Brasil', date: `${year}-09-07`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: null, description: null },
        { id: 'sys-aparecida', title: 'Nossa Senhora Aparecida', date: `${year}-10-12`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '🙏', description: null },
        { id: 'sys-finados', title: 'Finados', date: `${year}-11-02`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '💀', description: null },
        { id: 'sys-republica', title: 'Proclamação da República', date: `${year}-11-15`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '🏛️', description: null },
        { id: 'sys-consciencia', title: 'Dia da Consciência Negra', date: `${year}-11-20`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '✊🏿', description: null },
        { id: 'sys-natal', title: 'Natal', date: `${year}-12-25`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '🎄', description: null },
        { id: 'sys-revolucao', title: 'Revolução Constitucionalista', date: `${year}-07-09`, type: 'holiday', is_fixed: false, color_mode: 'holiday', is_system: true, is_active: true, emoji: '⚔️', description: null }
    ] as CalendarEvent[];
};
