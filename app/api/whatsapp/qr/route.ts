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

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Busca instância do usuário logado
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('zapi_instance_id')
      .eq('id', user.id)
      .single()

    const instanceName = (userData as { zapi_instance_id: string | null } | null)?.zapi_instance_id
    if (!instanceName) {
      return NextResponse.json({ error: 'Instância não configurada.' }, { status: 422 })
    }

    // Evolution API: GET /instance/connect/{instanceName}
    const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_KEY },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Falha ao gerar QR Code. Tente novamente.' }, { status: 502 })
    }

    const data = await res.json() as { base64?: string; code?: string; error?: string }

    if (!data.base64) {
      return NextResponse.json({ error: data.error || 'QR Code não disponível no momento.' }, { status: 502 })
    }

    return NextResponse.json({ qrcode: data.base64 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
