import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { cpf, slug } = await request.json()
    const digits = (cpf || '').replace(/\D/g, '')
    if (digits.length !== 11) return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })

    const { data: tenant } = await admin.from('tenants').select('id').eq('slug', slug).single()
    if (!tenant) return NextResponse.json({ error: 'Escritório não encontrado.' }, { status: 404 })

    const tenantId = (tenant as { id: string }).id

    // Busca por dígitos puros ou CPF formatado
    const cpfFormatted = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    const { data: cons } = await admin
      .from('consorciados')
      .select('id, full_name, user_id, cpf')
      .eq('tenant_id', tenantId)
      .or(`cpf.eq.${digits},cpf.eq.${cpfFormatted}`)
      .limit(1)

    const con = cons?.[0] ?? null
    if (!con) return NextResponse.json({ error: 'CPF não encontrado. Fale com seu consultor.' }, { status: 404 })

    const c = con as { id: string; full_name: string; user_id: string | null; cpf: string | null }

    // Se já tem user_id vinculado, tudo certo
    if (c.user_id) return NextResponse.json({ name: c.full_name.split(' ')[0] })

    // Sem user_id: tenta encontrar conta auth já existente e relinkar
    const portalEmail = `${digits}@portal.local`
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existingAuthUser = listData?.users?.find((u) => u.email === portalEmail)

    if (existingAuthUser) {
      // Conta auth existe mas não estava linkada — linka agora
      await admin.from('consorciados')
        .update({ user_id: existingAuthUser.id })
        .or(`cpf.eq.${digits},cpf.eq.${cpfFormatted}`)
        .eq('tenant_id', tenantId)

      return NextResponse.json({ name: c.full_name.split(' ')[0] })
    }

    // Realmente nunca criou conta
    return NextResponse.json({ error: 'Conta não ativada. Use "Sou novo aqui".' }, { status: 403 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
