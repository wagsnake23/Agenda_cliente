import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const payload = [
        {
            title: 'Aniversário de Agudos',
            date: '2000-07-27',
            type: 'holiday',
            is_fixed: true,
            color_mode: 'holiday',
            emoji: '🎉',
            is_active: true
        },
        {
            title: 'Dia do Servidor Público',
            date: '2000-10-28',
            type: 'holiday',
            is_fixed: true,
            color_mode: 'holiday',
            emoji: '👨‍💻',
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
        console.log('Successfully re-inserted missing local holidays into DB.');
    }
}
run();
