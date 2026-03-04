import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // 1. Tratamento obrigatório do preflight do CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Corrigindo as variáveis de ambiente padrões do Supabase Edge Functions
        const supabaseUrl = Deno.env.get('URL_PROJETO') || Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('CHAVE_MESTRA') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Variáveis de ambiente do Supabase não encontradas.");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // 3. Obtém o userId recebido na requisição do client (frontend)
        const { userId } = await req.json();

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "userId obrigatório" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Utiliza o admin role para resetar a senha 
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: "Agenda1" }
        );

        if (error) {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 5. Retorna sucesso!
        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message || "Erro interno" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
