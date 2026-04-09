import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
    const u = userData as { tenant_id: string; role: string } | null
    if (!u) return NextResponse.json({ error: 'Inválido' }, { status: 403 })

    if (u.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem gerar API keys' }, { status: 403 })
    }

    // Gerar key segura: pg_<32 bytes hex>
    const rawKey = randomBytes(32).toString('hex')
    const api_key = `pg_${rawKey}`

    await supabaseAdmin
      .from('tenants')
      .update({ api_key })
      .eq('id', u.tenant_id)

    return NextResponse.json({ api_key })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
