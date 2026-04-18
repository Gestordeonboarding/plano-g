import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EVOLUTION_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Busca dados do usuário logado
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, zapi_instance_id, tenant_id')
      .eq('id', user.id)
      .single()

    const u = userData as { id: string; zapi_instance_id: string | null; tenant_id: string } | null
    if (!u) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 })

    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta. Entre em contato com o suporte.' }, { status: 500 })
    }

    const instanceName = `planog-user-${u.id.slice(0, 8)}`

    if (u.zapi_instance_id) {
      // Instância já existe — atualiza webhook para garantir URL correta
      await fetch(`${EVOLUTION_URL}/webhook/set/${u.zapi_instance_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        }),
      })
      return NextResponse.json({ instanceName: u.zapi_instance_id })
    }

    // Cria nova instância no Evolution API
    const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      console.error('Evolution create instance error:', createRes.status, err)
      return NextResponse.json({ error: `Erro ao criar conexão (${createRes.status}): ${err}` }, { status: 502 })
    }

    // Salva nome da instância no usuário
    await supabaseAdmin
      .from('users')
      .update({ zapi_instance_id: instanceName })
      .eq('id', u.id)

    return NextResponse.json({ instanceName })
  } catch (err) {
    console.error('criar-instancia error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
