import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { consorciado_id, lance_value, credit_value, lance_percent, probability, slug } = await request.json()

    // Buscar dados do consorciado
    const { data: con } = await admin
      .from('consorciados')
      .select('id, full_name, seller_id, tenant_id')
      .eq('id', consorciado_id)
      .eq('user_id', user.id)
      .single()

    if (!con) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    const c = con as { id: string; full_name: string; seller_id: string | null; tenant_id: string }

    // Salvar simulação
    await admin.from('lance_simulations').insert({
      consorciado_id: c.id,
      tenant_id: c.tenant_id,
      seller_id: c.seller_id,
      credit_value,
      lance_value,
      lance_percent,
      probability,
    })

    // Notificar vendedor
    if (c.seller_id) {
      const firstName = c.full_name.split(' ')[0]
      const probText = probability !== null ? ` com ${probability}% de chance` : ''
      await admin.from('seller_notifications').insert({
        seller_id: c.seller_id,
        tenant_id: c.tenant_id,
        type: 'simulation',
        title: `${firstName} simulou um lance`,
        body: `${c.full_name} simulou um lance de R$ ${Number(lance_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${lance_percent.toFixed(1)}%)${probText}.`,
        data: { consorciado_id: c.id, lance_value, lance_percent, probability, slug },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
