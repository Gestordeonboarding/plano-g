import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const u = userData as { tenant_id: string } | null
    if (!u) return NextResponse.json({ error: 'Usuário inválido' }, { status: 403 })

    const body = await request.json()
    const { phone, message, lead_id } = body as { phone: string; message: string; lead_id?: string }

    if (!phone || !message) {
      return NextResponse.json({ error: 'Telefone e mensagem são obrigatórios' }, { status: 400 })
    }

    // Buscar configuração Evolution API do tenant
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('evolution_api_url, evolution_api_key')
      .eq('id', u.tenant_id)
      .single()

    const t = tenant as { evolution_api_url: string | null; evolution_api_key: string | null } | null
    if (!t?.evolution_api_url || !t?.evolution_api_key) {
      return NextResponse.json({ error: 'WhatsApp não configurado. Configure em Configurações.' }, { status: 422 })
    }

    // Buscar instância ativa
    const instancesRes = await fetch(`${t.evolution_api_url}/instance/fetchInstances`, {
      headers: { apikey: t.evolution_api_key },
    })
    if (!instancesRes.ok) {
      return NextResponse.json({ error: 'Falha ao conectar com Evolution API' }, { status: 502 })
    }

    const instances = await instancesRes.json() as Array<{ instance: { instanceName: string; status: string } }>
    const activeInstance = instances.find((i) => i.instance?.status === 'open') || instances[0]
    if (!activeInstance) {
      return NextResponse.json({ error: 'Nenhuma instância WhatsApp conectada' }, { status: 422 })
    }

    const instanceName = activeInstance.instance.instanceName

    // Formatar número: remover não-dígitos e garantir DDI 55
    const digits = phone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`

    // Enviar mensagem
    const sendRes = await fetch(`${t.evolution_api_url}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        apikey: t.evolution_api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number, text: message }),
    })

    const sendData = await sendRes.json()

    if (!sendRes.ok) {
      return NextResponse.json({ error: 'Falha ao enviar mensagem', details: sendData }, { status: 502 })
    }

    // Registrar no log
    await supabaseAdmin.from('whatsapp_messages').insert({
      tenant_id: u.tenant_id,
      sender_id: user.id,
      lead_id: lead_id || null,
      phone: number,
      message,
      status: 'enviada',
      evolution_message_id: (sendData as { key?: { id?: string } })?.key?.id || null,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
