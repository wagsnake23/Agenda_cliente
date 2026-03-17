"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CalendarMode = 'adm';

interface CalendarModeContextType {
    mode: CalendarMode;
    setMode: (mode: CalendarMode) => void;
}

const CalendarModeContext = createContext<CalendarModeContextType | undefined>(undefined);

export function CalendarModeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<CalendarMode>('adm');

    return (
        <CalendarModeContext.Provider value={{ mode, setMode: () => {} }}>
            {children}
        </CalendarModeContext.Provider>
    );
}

export function useCalendarMode() {
    const context = useContext(CalendarModeContext);
    if (context === undefined) {
        throw new Error('useCalendarMode must be used within CalendarModeProvider');
    }
    return context;
}
