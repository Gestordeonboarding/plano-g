import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Ativar portal por consorciado_id (chamado pelo dashboard do franqueado)
// ou por cpf + slug (chamado pelo login do portal no primeiro acesso)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { consorciado_id, cpf, slug } = body

    let con: { id: string; full_name: string; cpf: string | null; email: string | null; tenant_id: string } | null = null

    if (consorciado_id) {
      const { data } = await supabaseAdmin
        .from('consorciados')
        .select('id, full_name, cpf, email, tenant_id')
        .eq('id', consorciado_id)
        .single()
      con = data as typeof con
    } else if (cpf && slug) {
      const cpfDigits = cpf.replace(/\D/g, '')
      // Buscar tenant pelo slug
      const { data: tenant } = await supabaseAdmin
        .from('tenants').select('id').eq('slug', slug).single()
      if (!tenant) return NextResponse.json({ error: 'Escritório não encontrado' }, { status: 404 })

      const { data } = await supabaseAdmin
        .from('consorciados')
        .select('id, full_name, cpf, email, tenant_id')
        .eq('tenant_id', (tenant as { id: string }).id)
        .eq('cpf', cpfDigits)
        .single()
      con = data as typeof con
    }

    if (!con) return NextResponse.json({ error: 'Consorciado não encontrado' }, { status: 404 })

    const conData = con as { id: string; full_name: string; cpf: string | null; email: string | null; tenant_id: string }
    const cpfDigits = (conData.cpf || conData.id).replace(/\D/g, '')
    const email = conData.email?.includes('@') && !conData.email.includes('@portal.local')
      ? conData.email
      : `${cpfDigits}@portal.local`
    const password = cpfDigits.slice(-6) || '123456'

    // Criar ou buscar usuário auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    let userId: string | null = null

    if (authError) {
      if (authError.message.includes('already')) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers()
        const existing = list?.users?.find((u) => u.email === email)
        userId = existing?.id || null
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    } else {
      userId = authData?.user?.id || null
    }

    if (userId) {
      const { data: existingUser } = await supabaseAdmin
        .from('users').select('id').eq('id', userId).single()

      if (!existingUser) {
        await supabaseAdmin.from('users').insert({
          id: userId,
          full_name: conData.full_name,
          email,
          role: 'client',
          tenant_id: conData.tenant_id,
        })
      }

      await supabaseAdmin
        .from('consorciados')
        .update({ user_id: userId })
        .eq('id', conData.id)
    }

    return NextResponse.json({ success: true, email, password })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
