import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })

    const { conversationId } = await request.json() as { conversationId: string }
    if (!conversationId) return NextResponse.json({ error: 'conversationId obrigatório' }, { status: 400 })

    // Busca a conversa
    const { data: conv } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, contact_phone, contact_name, lead_id, tenant_id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single()

    if (!conv) return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })

    const c = conv as {
      id: string; contact_phone: string; contact_name: string | null
      lead_id: string | null; tenant_id: string
    }

    // Se já é lead, retorna o lead existente
    if (c.lead_id) {
      return NextResponse.json({ leadId: c.lead_id, already: true })
    }

    // Verifica se já existe lead com esse telefone
    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', c.contact_phone)
      .single()

    let leadId: string

    if (existingLead) {
      leadId = (existingLead as { id: string }).id
    } else {
      // Cria novo lead
      const { data: newLead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          tenant_id: tenantId,
          full_name: c.contact_name || c.contact_phone,
          phone: c.contact_phone,
          source: 'whatsapp',
          status: 'novo',
          qualification_score: 0,
        })
        .select('id')
        .single()

      if (leadError || !newLead) {
        return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 })
      }
      leadId = (newLead as { id: string }).id
    }

    // Vincula conversa ao lead
    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({ lead_id: leadId })
      .eq('id', conversationId)

    return NextResponse.json({ leadId, already: false })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Remove vínculo de lead (volta para mensagens)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })

    const { conversationId } = await request.json() as { conversationId: string }

    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({ lead_id: null })
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
