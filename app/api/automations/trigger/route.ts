import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('tenant_id, full_name').eq('id', user.id).single()
    const u = userData as { tenant_id: string; full_name: string | null } | null
    if (!u) return NextResponse.json({ error: 'Inválido' }, { status: 403 })

    const body = await request.json()
    const { trigger, lead_id } = body as { trigger: string; lead_id: string }

    if (!trigger || !lead_id) {
      return NextResponse.json({ error: 'trigger e lead_id são obrigatórios' }, { status: 400 })
    }

    // Buscar regras ativas para esse gatilho
    const { data: rules } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('tenant_id', u.tenant_id)
      .eq('trigger', trigger)
      .eq('is_active', true)

    if (!rules || rules.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'Nenhuma regra ativa para este gatilho' })
    }

    // Buscar dados do lead
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('full_name, phone, desired_credit')
      .eq('id', lead_id)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

    const l = lead as { full_name: string; phone: string; desired_credit: number | null }

    // Buscar config Evolution API do tenant
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('evolution_api_url, evolution_api_key')
      .eq('id', u.tenant_id)
      .single()

    const t = tenant as { evolution_api_url: string | null; evolution_api_key: string | null } | null
    if (!t?.evolution_api_url || !t?.evolution_api_key) {
      return NextResponse.json({ skipped: true, reason: 'WhatsApp não configurado' })
    }

    // Buscar instância
    const instancesRes = await fetch(`${t.evolution_api_url}/instance/fetchInstances`, {
      headers: { apikey: t.evolution_api_key },
    })
    if (!instancesRes.ok) return NextResponse.json({ skipped: true, reason: 'Evolution API indisponível' })

    const instances = await instancesRes.json() as Array<{ instance: { instanceName: string; status: string } }>
    const activeInstance = instances.find((i) => i.instance?.status === 'open') || instances[0]
    if (!activeInstance) return NextResponse.json({ skipped: true, reason: 'Sem instância conectada' })

    const instanceName = activeInstance.instance.instanceName

    // Variáveis para substituição
    const creditFormatted = l.desired_credit
      ? `R$ ${l.desired_credit.toLocaleString('pt-BR')}`
      : ''
    const vars: Record<string, string> = {
      nome: l.full_name,
      telefone: l.phone,
      credito: creditFormatted,
      vendedor: u.full_name || 'Consultor',
    }

    const digits = l.phone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`

    // Disparar todas as regras ativas
    const results: Array<{ rule: string; success: boolean }> = []
    for (const rule of rules as Array<{ id: string; name: string; message_template: string }>) {
      const message = applyVariables(rule.message_template, vars)

      const sendRes = await fetch(`${t.evolution_api_url}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { apikey: t.evolution_api_key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, text: message }),
      })

      const sendData = await sendRes.json()
      const success = sendRes.ok

      // Log
      await supabaseAdmin.from('whatsapp_messages').insert({
        tenant_id: u.tenant_id,
        sender_id: user.id,
        lead_id,
        phone: number,
        message,
        status: success ? 'enviada' : 'falhou',
        automation_rule_id: rule.id,
        evolution_message_id: success ? (sendData as { key?: { id?: string } })?.key?.id || null : null,
      })

      results.push({ rule: rule.name, success })
    }

    return NextResponse.json({ triggered: results.length, results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
