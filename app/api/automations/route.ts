import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const u = userData as { tenant_id: string } | null
    if (!u) return NextResponse.json({ error: 'Inválido' }, { status: 403 })

    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('tenant_id', u.tenant_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const u = userData as { tenant_id: string } | null
    if (!u) return NextResponse.json({ error: 'Inválido' }, { status: 403 })

    const body = await request.json()
    const { name, trigger, message_template, is_active } = body

    if (!name || !trigger || !message_template) {
      return NextResponse.json({ error: 'Nome, gatilho e mensagem são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabase.from('automation_rules').insert({
      tenant_id: u.tenant_id,
      name,
      trigger,
      message_template,
      is_active: is_active ?? true,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
