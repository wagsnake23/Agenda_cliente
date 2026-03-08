import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching agendamentos:', error);
    } else {
        console.log('Columns in agendamentos:');
        if (data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log('No data found, cannot infer columns from select *');
        }
    }
}
run();
