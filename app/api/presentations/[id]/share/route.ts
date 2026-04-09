import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'

const supabaseAdmin = adminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const shareToken = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias

    let presentationId = id

    if (id === 'new') {
      // Criar apresentação primeiro
      const { title, slides, customization, tenant_id, seller_id, template_id } = body
      const { data: newPres, error } = await supabase.from('presentations').insert({
        title, slides, customization, status: 'enviada',
        tenant_id, seller_id, template_id: template_id || null,
        share_token: shareToken,
        share_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      presentationId = (newPres as { id: string }).id
    } else {
      await supabaseAdmin
        .from('presentations')
        .update({ share_token: shareToken, share_expires_at: expiresAt, status: 'enviada' })
        .eq('id', id)
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const share_url = `${origin}/p/${shareToken}`

    return NextResponse.json({ share_url, share_token: shareToken, presentation_id: presentationId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
