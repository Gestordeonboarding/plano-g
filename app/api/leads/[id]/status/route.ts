import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID = ['novo', 'contato_feito', 'proposta_enviada', 'documentacao', 'convertido', 'perdido']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { status } = await request.json() as { status: string }
  if (!VALID.includes(status)) return NextResponse.json({ error: 'Status inválido' }, { status: 400 })

  const { error } = await supabase
    .from('leads')
    .update({ status, last_contact_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
