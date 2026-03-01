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

        // A. Validar sessao do chamador
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
        if (authError || !caller) throw new Error("Sessão inválida.")

        // B. Conferir Admin
        const { data: profile } = await supabaseAdmin.from('profiles').select('perfil').eq('id', caller.id).single()
        if (profile?.perfil !== 'administrador') throw new Error("Acesso negado.")

        // C. Obter ID do usuario a ser deletado
        const { userId } = await req.json()
        if (!userId) throw new Error("ID do usuário é obrigatório.")

        // D. Evitar que o admin delete a si mesmo por engano
        if (userId === caller.id) {
            throw new Error("Você não pode deletar sua própria conta através do painel administrativo.")
        }

        console.log(`🗑️ Deletando usuário: ${userId}`)

        // E. Deletar do Auth (O Trigger de BD deve lidar com a deleção na tabela profiles ou lidamos manualmente)
        // Por segurança, vamos deletar o perfil primeiro para garantir que agendamentos etc sejam tratados (se houver cascade)
        // Mas o ideal é deletar o Auth, que dispara o delete no profile se houver trigger, ou deletamos ambos.

        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteAuthError) throw deleteAuthError

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
