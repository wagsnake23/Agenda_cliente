"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useCalendarEvents, CalendarEvent } from '@/hooks/use-calendar-events';

interface CalendarEventsContextType {
    events: CalendarEvent[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

const CalendarEventsContext = createContext<CalendarEventsContextType>({
    events: [],
    loading: true,
    error: null,
    refetch: () => { },
    setEvents: () => { },
});

export const CalendarEventsProvider = ({ children }: { children: ReactNode }) => {
    const { events, loading, error, refetch, setEvents } = useCalendarEvents();

    return (
        <CalendarEventsContext.Provider value={{ events, loading, error, refetch, setEvents }}>
            {children}
        </CalendarEventsContext.Provider>
    );
};

export const useCalendarEventsContext = () => useContext(CalendarEventsContext);
