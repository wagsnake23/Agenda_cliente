import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'agendamentos' });

    // Better way: query one row that has a non-null status 'aprovado'
    const { data: aprovado, error: err2 } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('status', 'aprovado')
        .limit(1);

    if (aprovado && aprovado.length > 0) {
        console.log('Row with status aprovado:');
        console.log(aprovado[0]);
    } else {
        console.log('No approved row found.');

        // Let's just select * limit 1 to see all keys, but null values might be missing.
        // Actually, supabase always returns keys even for nulls in the standard postgres select.
    }
}
run();
