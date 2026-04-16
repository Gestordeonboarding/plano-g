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
        .limit(1)
      con = (data?.[0] ?? null) as typeof con
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
        // Buscar pelo email na tabela users (mais confiável que listUsers com paginação)
        const { data: existingInUsers } = await supabaseAdmin
          .from('users').select('id').eq('email', email).single()
        if (existingInUsers) {
          userId = (existingInUsers as { id: string }).id
        } else {
          // Fallback: buscar pelo user_id já linkado no consorciado
          const cpfForSearch = (conData.cpf || '').replace(/\D/g, '')
          const { data: conWithUser } = await supabaseAdmin
            .from('consorciados').select('user_id').eq('cpf', cpfForSearch)
            .not('user_id', 'is', null).limit(1)
          const linked = (conWithUser as Array<{ user_id: string | null }> | null)?.[0]
          userId = linked?.user_id || null
        }
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

      // Linka TODAS as cotas com o mesmo CPF no mesmo tenant ao mesmo user_id
      const cpfDigitsForLink = (conData.cpf || '').replace(/\D/g, '')
      if (cpfDigitsForLink) {
        await supabaseAdmin
          .from('consorciados')
          .update({ user_id: userId })
          .eq('tenant_id', conData.tenant_id)
          .eq('cpf', cpfDigitsForLink)
      } else {
        await supabaseAdmin
          .from('consorciados')
          .update({ user_id: userId })
          .eq('id', conData.id)
      }
    }

    // Se um PIN foi fornecido, definir a senha final via admin (sem precisar de updateUser no cliente)
    const pin = body.pin as string | undefined
    if (pin && !userId) {
      return NextResponse.json({ error: 'Não foi possível localizar sua conta. Tente novamente.' }, { status: 400 })
    }
    if (pin && userId && pin.length === 6) {
      const cpfDigits2 = (conData.cpf || '').replace(/\D/g, '') || conData.id.replace(/\D/g, '')
      const derivedPassword = pin + cpfDigits2.slice(0, 4)
      const { error: pinError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: derivedPassword })
      if (pinError) return NextResponse.json({ error: 'Erro ao definir PIN: ' + pinError.message }, { status: 400 })
      return NextResponse.json({ success: true, email, finalPassword: derivedPassword })
    }

    return NextResponse.json({ success: true, email, password })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
