"use client";

import { useState, useEffect } from 'react';
import { getEventsForMonth } from '@/hooks/use-calendar-events';
import type { CalendarEvent } from '@/hooks/use-calendar-events';

export const useHolidayMessages = (month: number, year: number, calendarEvents: CalendarEvent[] = []) => {
  const [messages, setMessages] = useState<{ day: number; name: string; emoji: string | null; type: string; is_fixed: boolean }[]>([]);

  useEffect(() => {
    const monthEvents = getEventsForMonth(calendarEvents, month, year);
    setMessages(monthEvents);
  }, [month, year, calendarEvents]);

  return messages;
};