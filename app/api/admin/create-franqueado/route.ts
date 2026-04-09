import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { name, slug, email, password, primary_color, plan } = await request.json()

    if (!name || !slug || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Criar tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ name, slug, primary_color: primary_color || '#00D4C8', plan: plan || 'profissional' })
      .select()
      .single()

    if (tenantError) {
      // Reverter criação do usuário auth
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: tenantError.message }, { status: 400 })
    }

    // 3. Criar usuário na tabela users
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: userId,
      full_name: name,
      email,
      role: 'tenant_admin',
      tenant_id: (tenant as { id: string }).id,
    })

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('tenants').delete().eq('id', (tenant as { id: string }).id)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, tenant_id: (tenant as { id: string }).id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
