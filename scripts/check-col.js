import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'agendamentos' });

    // fallback if no rpc
    const rs = await supabase.from('agendamentos').select('approved_at').limit(1);
    if (rs.error) {
        console.log("Column approved_at might not exist:", rs.error.message);
    } else {
        console.log("Column approved_at DOES exist!");
    }
}
run();
