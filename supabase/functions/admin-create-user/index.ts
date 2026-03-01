import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = Deno.env.get('URL_PROJETO') || Deno.env.get('SUPABASE_URL')
        const serviceRole = Deno.env.get('CHAVE_MESTRA') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!url || !serviceRole) {
            throw new Error("Erro de configuração: Chaves ausentes no servidor.")
        }

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error("Não autorizado.")

        const supabaseAdmin = createClient(url, serviceRole)

        // A. Validar sessao
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !caller) throw new Error("Sessão inválida.")

        // B. Conferir Admin
        const { data: profile } = await supabaseAdmin.from('profiles').select('perfil').eq('id', caller.id).single()
        if (profile?.perfil !== 'administrador') throw new Error("Acesso negado.")

        // C. Cadastro no Auth
        const { email, password, nome, cargo, matricula, perfil, ativo } = await req.json()

        console.log(`🔨 Criando conta no Auth para: ${email}`)

        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nome }
        })

        if (createError) throw createError

        // D. AGUARDAR E ATUALIZAR (UPSERT)
        // Usamos um pequeno timeout para garantir que o Trigger do BD ja tenha criado o perfil base
        await new Promise(res => setTimeout(res, 500));

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                nome,
                email,
                cargo: cargo || null,
                matricula: matricula || null,
                perfil: perfil || 'conferente',
                ativo: ativo !== undefined ? ativo : true
            })

        if (updateError) {
            console.error("⚠️ Erro ao atualizar detalhes, mas usuario Auth ja existe:", updateError.message)
            // Nesse caso nao deletamos, para permitir que o admin apenas edite o usuario depois
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (errorValue: any) {
        return new Response(JSON.stringify({ success: false, error: errorValue.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    }
})
