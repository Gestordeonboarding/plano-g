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

    // Busca o consorciado pelo ID — a sessão do portal já garante que o usuário está autenticado
    const { data: con } = await admin
      .from('consorciados')
      .select('id, full_name, seller_id, tenant_id, user_id')
      .eq('id', consorciado_id)
      .single()

    if (!con) return NextResponse.json({ error: 'Consorciado não encontrado' }, { status: 404 })

    const c = con as { id: string; full_name: string; seller_id: string | null; tenant_id: string; user_id: string | null }

    // Garante que o user logado pertence a esse consorciado (ou linka se estiver solto)
    if (c.user_id && c.user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    if (!c.user_id) {
      await admin.from('consorciados').update({ user_id: user.id }).eq('id', c.id)
    }

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

    const firstName = c.full_name.split(' ')[0]
    const probText = probability !== null ? ` com ${probability}% de chance` : ''
    const lanceFormatted = Number(lance_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    const notifData = { consorciado_id: c.id, lance_value, lance_percent, probability, slug }

    // Busca nome do vendedor
    let sellerName = 'Sem vendedor atribuído'
    if (c.seller_id) {
      const { data: sd } = await admin.from('users').select('full_name, email').eq('id', c.seller_id).single()
      if (sd) {
        const s = sd as { full_name: string | null; email: string | null }
        sellerName = s.full_name || s.email || 'Vendedor'
      }
    }

    // Busca todos os usuários do tenant para notificar
    const { data: allUsers } = await admin
      .from('users')
      .select('id, role')
      .eq('tenant_id', c.tenant_id)

    const users = (allUsers || []) as Array<{ id: string; role: string }>
    const sellers = users.filter((u) => u.role === 'seller')
    const managers = users.filter((u) => u.role !== 'seller')

    const toNotify: Array<{ id: string; isManager: boolean }> = []

    if (c.seller_id) {
      // Tem vendedor atribuído: notifica só ele + gerentes
      toNotify.push({ id: c.seller_id, isManager: false })
      managers.forEach((m) => toNotify.push({ id: m.id, isManager: true }))
    } else {
      // Sem vendedor: notifica todos os vendedores + gerentes
      sellers.forEach((s) => toNotify.push({ id: s.id, isManager: false }))
      managers.forEach((m) => toNotify.push({ id: m.id, isManager: true }))
    }

    const inserts = toNotify.map(({ id, isManager }) => ({
      seller_id: id,
      tenant_id: c.tenant_id,
      type: 'simulation',
      title: `${firstName} simulou um lance`,
      body: isManager
        ? `${c.full_name} simulou R$ ${lanceFormatted} (${lance_percent.toFixed(1)}%)${probText}. Vendedor: ${sellerName}.`
        : `${c.full_name} simulou um lance de R$ ${lanceFormatted} (${lance_percent.toFixed(1)}%)${probText}.`,
      data: isManager
        ? { ...notifData, seller_name: sellerName, for_manager: true }
        : notifData,
      read: false,
    }))

    if (inserts.length > 0) {
      await admin.from('seller_notifications').insert(inserts)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('simular error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
