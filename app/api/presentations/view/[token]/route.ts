import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    const { data: pres } = await supabaseAdmin
      .from('presentations')
      .select('id, view_count, share_expires_at, seller_id, title, tenant_id')
      .eq('share_token', token)
      .single()

    if (!pres) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const p = pres as { id: string; view_count: number; share_expires_at: string | null; seller_id: string | null; title: string; tenant_id: string }

    // Verificar expiração
    if (p.share_expires_at && new Date(p.share_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
    }

    // Incrementar views
    await supabaseAdmin
      .from('presentations')
      .update({
        view_count: (p.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
        status: 'visualizada',
      })
      .eq('id', p.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
