import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getViewingTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { data, error } = await admin
    .from('tenant_administradoras')
    .select(`
      id, taxa_administracao, fundo_reserva, comissao_venda, comissao_lance, ativa,
      administradora:administradora_id ( id, nome, slug, cor )
    `)
    .eq('tenant_id', tenantId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenant_administradoras: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getViewingTenantId()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await req.json() as {
    administradora_id: string
    taxa_administracao?: number
    fundo_reserva?: number
    comissao_venda?: number
    comissao_lance?: number
  }

  const { data, error } = await admin
    .from('tenant_administradoras')
    .upsert({
      tenant_id: tenantId,
      administradora_id: body.administradora_id,
      taxa_administracao: body.taxa_administracao ?? 0,
      fundo_reserva: body.fundo_reserva ?? 0,
      comissao_venda: body.comissao_venda ?? 0,
      comissao_lance: body.comissao_lance ?? 0,
      ativa: true,
    }, { onConflict: 'tenant_id,administradora_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenant_administradora: data })
}
