import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: userData } = await admin.from('users').select('role, tenant_id').eq('id', user.id).single()
    const u = userData as { role: string; tenant_id: string } | null
    if (!u || u.role === 'seller') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { seller_id, month, prize_description, is_revealed } = await req.json()

    await admin.from('seller_prizes').upsert({
      tenant_id: u.tenant_id,
      seller_id,
      month,
      prize_description,
      is_revealed: is_revealed ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,seller_id,month' })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
