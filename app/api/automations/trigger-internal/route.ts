import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
}

// Rota interna: chamada pelo servidor (sem auth de usuário), protegida por secret
export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-internal-secret')
    if (secret !== (process.env.INTERNAL_SECRET || '')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { trigger, lead_id, tenant_id } = await request.json() as {
      trigger: string; lead_id: string; tenant_id: string
    }

    if (!trigger || !lead_id || !tenant_id) {
      return NextResponse.json({ error: 'trigger, lead_id e tenant_id são obrigatórios' }, { status: 400 })
    }

    // Buscar regras ativas
    const { data: rules } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('trigger', trigger)
      .eq('is_active', true)

    if (!rules || rules.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'Nenhuma regra ativa' })
    }

    // Buscar lead
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('full_name, phone, desired_credit')
      .eq('id', lead_id)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    const l = lead as { full_name: string; phone: string; desired_credit: number | null }

    // Buscar config Evolution API
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('evolution_api_url, evolution_api_key')
      .eq('id', tenant_id)
      .single()

    const t = tenant as { evolution_api_url: string | null; evolution_api_key: string | null } | null
    if (!t?.evolution_api_url || !t?.evolution_api_key) {
      return NextResponse.json({ skipped: true, reason: 'WhatsApp não configurado' })
    }

    const instancesRes = await fetch(`${t.evolution_api_url}/instance/fetchInstances`, {
      headers: { apikey: t.evolution_api_key },
    })
    if (!instancesRes.ok) return NextResponse.json({ skipped: true, reason: 'Evolution API indisponível' })

    const instances = await instancesRes.json() as Array<{ instance: { instanceName: string; status: string } }>
    const activeInstance = instances.find((i) => i.instance?.status === 'open') || instances[0]
    if (!activeInstance) return NextResponse.json({ skipped: true, reason: 'Sem instância conectada' })

    const instanceName = activeInstance.instance.instanceName

    const creditFormatted = l.desired_credit
      ? `R$ ${l.desired_credit.toLocaleString('pt-BR')}`
      : ''
    const vars: Record<string, string> = {
      nome: l.full_name,
      telefone: l.phone,
      credito: creditFormatted,
      vendedor: 'Consultor',
    }

    const digits = l.phone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`

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

      await supabaseAdmin.from('whatsapp_messages').insert({
        tenant_id,
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
