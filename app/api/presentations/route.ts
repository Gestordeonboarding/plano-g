import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, slides, customization, status, tenant_id, seller_id, template_id, lead_id } = body

    const { data, error } = await supabase.from('presentations').insert({
      title, slides, customization, status: status || 'rascunho',
      tenant_id, seller_id, template_id: template_id || null, lead_id: lead_id || null,
      updated_at: new Date().toISOString(),
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
