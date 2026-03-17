const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("🚀 Function admin-create-user starting...")

        // 2. Client Setup
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("❌ ERROR: Missing environment variables (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)")
            throw new Error("Configuração do servidor incompleta.")
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 3. Auth Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error("❌ ERROR: Missing Authorization header")
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !caller) {
            console.error("❌ ERROR: Invalid session", authError)
            return new Response(JSON.stringify({ error: "Sessão inválida" }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Admin Permission Check
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('perfil')
            .eq('id', caller.id)
            .single()

        if (profileError || profile?.perfil !== 'administrador') {
            console.error("❌ ERROR: Permission denied for user", caller.id)
            return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores." }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 5. Payload Processing
        const body = await req.json()
        const { email, password, nome, cargo, matricula, perfil, ativo } = body

        if (!email || !password || !nome) {
            throw new Error("E-mail, senha e nome são obrigatórios.")
        }

        console.log(`🔨 Creating user: ${email}`)

        // 6. Create User in Auth
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nome }
        })

        if (createError) throw createError

        // 7. Sync to Profile Table
        // Wait a bit for potential triggers
        await new Promise(res => setTimeout(res, 500))

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
            console.warn("⚠️ Warning: Profile sync error", updateError.message)
        }

        console.log("✅ User created successfully")

        return new Response(JSON.stringify({ success: true, user: authData.user }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (err: any) {
        console.error("❌ UNCAUGHT ERROR:", err.message)
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
