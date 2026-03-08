import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const payload = [
        {
            title: 'Aniversário de São Paulo',
            date: '2000-01-25',
            type: 'holiday',
            is_fixed: true,
            color_mode: 'holiday',
            emoji: '🎉',
            is_active: true
        }
    ];

    // Inserindo
    const { data, error } = await supabase
        .from('calendar_events')
        .insert(payload);

    if (error) {
        console.error('Error inserting:', error);
    } else {
        console.log('Successfully re-inserted Aniversário de São Paulo into DB.');
    }
}
run();
