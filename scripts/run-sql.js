import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const q = `
        ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
        ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
        ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
    `;

    // As JS client can't run raw queries directly without RPC, we can use the postgrest API to execute an RPC
    // If not, we instruct the user to run it. Is there an RPC created beforehand? Maybe 'exec_sql'?
    // Let's see if we can try to call a non-existent rpc just to see if any helper exists.
    const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql: q });
    console.log(e2?.message || 'RPC success');
}
run();
