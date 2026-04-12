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

    const { data: cons } = await admin
      .from('consorciados')
      .select('full_name, user_id')
      .eq('tenant_id', (tenant as { id: string }).id)
      .eq('cpf', digits)
      .limit(1)

    const con = cons?.[0] ?? null
    if (!con) return NextResponse.json({ error: 'CPF não encontrado. Fale com seu consultor.' }, { status: 404 })

    const c = con as { full_name: string; user_id: string | null }
    if (!c.user_id) return NextResponse.json({ error: 'Conta não ativada. Use "Sou novo aqui".' }, { status: 403 })

    return NextResponse.json({ name: c.full_name.split(' ')[0] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
