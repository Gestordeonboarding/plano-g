import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EVOLUTION_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!

type ConnectResponse = {
  base64?: string
  code?: string
  pairingCode?: string
  count?: number
  instance?: { state?: string }
  error?: string
  message?: string | string[]
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('zapi_instance_id')
      .eq('id', user.id)
      .single()

    const instanceName = (userData as { zapi_instance_id: string | null } | null)?.zapi_instance_id
    if (!instanceName) {
      return NextResponse.json({ error: 'Instância não configurada.' }, { status: 422 })
    }

    // ── Tentativa 1: pegar QR direto ──────────────────────────────────────
    let connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_KEY },
    })
    let connectData: ConnectResponse
    try {
      connectData = await connectRes.json()
    } catch {
      connectData = { error: `non-json response ${connectRes.status}` }
    }
    console.log('[whatsapp-qr] tentativa 1:', connectRes.status, JSON.stringify(connectData).slice(0, 400))

    if (connectData.base64) {
      return NextResponse.json({ qrcode: connectData.base64 })
    }

    // ── Sem QR — força logout pra resetar estado preso ────────────────────
    console.log('[whatsapp-qr] sem QR na tentativa 1, forçando logout...')
    const logoutRes = await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': EVOLUTION_KEY },
    })
    const logoutText = await logoutRes.text()
    console.log('[whatsapp-qr] logout:', logoutRes.status, logoutText.slice(0, 200))

    // Aguarda 1.5s pra Evolution processar o logout
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // ── Tentativa 2: novo connect depois do logout ────────────────────────
    connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_KEY },
    })
    try {
      connectData = await connectRes.json()
    } catch {
      connectData = { error: `non-json response ${connectRes.status}` }
    }
    console.log('[whatsapp-qr] tentativa 2 após logout:', connectRes.status, JSON.stringify(connectData).slice(0, 400))

    if (connectData.base64) {
      return NextResponse.json({ qrcode: connectData.base64 })
    }

    // ── Sem QR mesmo depois do logout — provavelmente instância sumiu ────
    return NextResponse.json({
      error: 'Não foi possível gerar QR. A instância pode ter sido removida do servidor. Vá em Configurações e reconecte.',
      detail: connectData,
    }, { status: 502 })
  } catch (err) {
    console.error('[whatsapp-qr] erro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
