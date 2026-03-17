"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarEvent } from './use-calendar-events';

export const useCalendarEventsAdmin = () => {
    const [loading, setLoading] = useState(false);

    const createEvent = async (payload: Omit<CalendarEvent, 'id'>) => {
        setLoading(true);
        const { error } = await supabase.from('calendar_events').insert(payload);
        setLoading(false);
        return { error };
    };

    const updateEvent = async (id: string, payload: Partial<CalendarEvent>) => {
        setLoading(true);
        const { error } = await supabase.from('calendar_events').update(payload).eq('id', id);
        setLoading(false);
        return { error };
    };

    const deleteEvent = async (id: string) => {
        setLoading(true);
        const { error } = await supabase.from('calendar_events').delete().eq('id', id);
        setLoading(false);
        return { error };
    };

    return { createEvent, updateEvent, deleteEvent, loading };
};
