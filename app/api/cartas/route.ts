import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getViewingTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const url = new URL(req.url)
  const tadmId = url.searchParams.get('tenant_administradora_id')

  let query = admin
    .from('cartas')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('tipo')
    .order('valor_credito')

  if (tadmId) query = query.eq('tenant_administradora_id', tadmId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cartas: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getViewingTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await req.json() as {
    tenant_administradora_id: string
    tipo: string
    valor_credito: number
    prazo_meses: number
    parcela_estimada?: number
    contemplacao_media?: number
    descricao?: string
  }

  const { data, error } = await admin
    .from('cartas')
    .insert({ ...body, tenant_id: tenantId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ carta: data })
}
