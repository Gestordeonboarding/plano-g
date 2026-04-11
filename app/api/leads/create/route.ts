import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await req.json()
    const { tenant_id, name, phone, asset_type, source, seller_id, desired_credit } = body

    if (!tenant_id || !name) {
      return NextResponse.json({ error: 'Nome e tenant obrigatórios.' }, { status: 400 })
    }

    const { data: me } = await supabaseAdmin.from('users').select('role, tenant_id').eq('id', user.id).single()
    const role = (me as { role: string; tenant_id: string | null } | null)?.role
    const myTenantId = (me as { role: string; tenant_id: string | null } | null)?.tenant_id

    if (role !== 'agency_admin' && (role !== 'tenant_admin' || myTenantId !== tenant_id)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from('leads').insert({
      tenant_id,
      name,
      phone: phone || null,
      asset_type: asset_type || null,
      source: source || 'manual',
      seller_id: seller_id || null,
      desired_credit: desired_credit || null,
      status: 'novo',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
