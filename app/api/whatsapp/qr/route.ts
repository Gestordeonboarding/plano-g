import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('zapi_instance_id, zapi_token')
      .eq('id', user.id)
      .single()

    const u = userData as { zapi_instance_id: string | null; zapi_token: string | null } | null

    if (!u?.zapi_instance_id || !u?.zapi_token) {
      return NextResponse.json({
        error: 'Sua instância WhatsApp ainda não foi configurada. Entre em contato com o administrador.',
      }, { status: 422 })
    }

    const res = await fetch(
      `https://api.z-api.io/instances/${u.zapi_instance_id}/token/${u.zapi_token}/qr-code`,
      { headers: { 'Client-Token': u.zapi_token } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Falha ao gerar QR Code' }, { status: 502 })
    }

    const data = await res.json() as { value?: string; error?: string }

    if (!data.value) {
      return NextResponse.json({ error: data.error || 'QR Code não disponível' }, { status: 502 })
    }

    return NextResponse.json({ qrcode: data.value })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
