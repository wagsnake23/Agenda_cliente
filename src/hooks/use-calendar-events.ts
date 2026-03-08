"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos (espelho da estrutura real da tabela)
// ─────────────────────────────────────────────────────────────────────────────

export type CalendarEventType = 'holiday' | 'event' | 'birthday';
export type ColorMode = 'holiday' | 'event_only';

export interface CalendarEvent {
    id: string;
    title: string;               // coluna real: title
    description: string | null;
    date: string;                // coluna real: date (formato YYYY-MM-DD)
    type: CalendarEventType;
    is_fixed: boolean;           // true = anual (compara só mês/dia)
    is_active: boolean;
    color_mode: ColorMode;
    emoji: string | null;
    created_at?: string;
    created_by?: string;
    is_system?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook de busca de eventos ativos
// ─────────────────────────────────────────────────────────────────────────────

export const useCalendarEvents = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('is_active', true)
                .order('date', { ascending: true });

            if (err) throw err;
            const dbEvents = (data || []).map(e => ({ ...e, is_system: false })) as CalendarEvent[];

            setEvents(dbEvents);
        } catch (e: any) {
            setError(e.message || 'Erro ao carregar eventos do calendário');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, loading, error, refetch: fetchEvents, setEvents };
};

// ─────────────────────────────────────────────────────────────────────────────
// Funções auxiliares de consulta
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna todos os eventos que se aplicam a uma data específica.
 *
 * - is_fixed = true → o campo `date` está no formato YYYY-MM-DD usando ano
 *   de referência (2000). Comparamos apenas o mês e dia.
 * - is_fixed = false → comparamos a data completa YYYY-MM-DD.
 */
export const getEventsForDate = (
    events: CalendarEvent[],
    date: Date
): CalendarEvent[] => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;
    const monthDay = `${month}-${day}`;

    return events.filter(event => {
        if (event.is_fixed) {
            // date está no formato YYYY-MM-DD — só compara a parte MM-DD
            const eventMonthDay = event.date.slice(5); // pega "MM-DD"
            return eventMonthDay === monthDay;
        } else {
            // data específica → compara completo
            return event.date === fullDate;
        }
    });
};

/**
 * Verifica se a data tem um feriado que deve pintar o calendário.
 */
export const isHolidayEvent = (
    events: CalendarEvent[],
    date: Date
): { isHoliday: boolean; holidayName?: string; emoji?: string } => {
    const dayEvents = getEventsForDate(events, date);
    const holiday = dayEvents.find(e => e.type === 'holiday' && e.color_mode === 'holiday');
    return {
        isHoliday: !!holiday,
        holidayName: holiday?.title,
        emoji: holiday?.emoji || undefined,
    };
};

/**
 * Retorna aniversariantes para uma data específica.
 */
export const getBirthdaysForDate = (
    events: CalendarEvent[],
    date: Date
): CalendarEvent[] =>
    getEventsForDate(events, date).filter(e => e.type === 'birthday');

/**
 * Retorna eventos e feriados para exibição mensal no card de mensagens.
 * (exclui aniversários — tratados separadamente)
 */
export const getEventsForMonth = (
    events: CalendarEvent[],
    month: number,  // 0-indexed
    year: number
): { day: number; name: string; emoji: string | null; type: CalendarEventType }[] => {
    const result: { day: number; name: string; emoji: string | null; type: CalendarEventType }[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayEvents = getEventsForDate(events, date);
        for (const event of dayEvents) {
            if (event.type !== 'birthday') {
                result.push({ day, name: event.title, emoji: event.emoji, type: event.type });
            }
        }
    }

    return result.sort((a, b) => a.day - b.day);
};

/**
 * Retorna aniversariantes do mês.
 */
export const getBirthdaysForMonth = (
    events: CalendarEvent[],
    month: number,  // 0-indexed
    year: number
): { day: number; name: string }[] => {
    const result: { day: number; name: string }[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const birthdays = getBirthdaysForDate(events, date);
        for (const b of birthdays) {
            result.push({ day, name: b.title });
        }
    }

    return result.sort((a, b) => a.day - b.day);
};
