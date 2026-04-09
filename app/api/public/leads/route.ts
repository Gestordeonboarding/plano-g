import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Scoring rápido para leads externos
function scoreFromLead(desired_credit: number | null, monthly_income: number | null): number {
  let score = 50 // base
  if (desired_credit && monthly_income) {
    const ratio = desired_credit / (monthly_income * 12)
    if (ratio <= 1) score += 30
    else if (ratio <= 2) score += 15
    else if (ratio > 4) score -= 20
  }
  if (desired_credit && desired_credit >= 50000) score += 10
  if (monthly_income && monthly_income >= 5000) score += 10
  return Math.min(100, Math.max(0, score))
}

export async function POST(request: Request) {
  try {
    // Autenticação por API key no header
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key obrigatória. Envie no header: x-api-key: <sua-chave>' },
        { status: 401 }
      )
    }

    // Buscar tenant pelo api_key
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, name')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'API key inválida ou tenant inativo' }, { status: 403 })
    }

    const t = tenant as { id: string; name: string }

    const body = await request.json()

    // Validação dos campos obrigatórios
    const { full_name, phone } = body as { full_name?: string; phone?: string }

    if (!full_name || !phone) {
      return NextResponse.json(
        { error: 'Os campos full_name e phone são obrigatórios' },
        { status: 400 }
      )
    }

    // Campos opcionais
    const email: string | null = body.email || null
    const desired_credit: number | null = body.desired_credit ? Number(body.desired_credit) : null
    const monthly_income: number | null = body.monthly_income ? Number(body.monthly_income) : null
    const asset_type: string | null = body.asset_type || null
    const source: string = body.source || 'api'
    const notes: string | null = body.notes || null
    const seller_id: string | null = body.seller_id || null

    const qualification_score = scoreFromLead(desired_credit, monthly_income)

    // Inserir lead
    const { data: lead, error } = await supabaseAdmin.from('leads').insert({
      tenant_id: t.id,
      seller_id,
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      desired_credit,
      monthly_income,
      asset_type,
      source,
      notes,
      qualification_score,
      status: 'novo',
    }).select('id, full_name, phone, status, qualification_score, created_at').single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Disparar automação de novo lead (best-effort, sem await bloqueante)
    supabaseAdmin.rpc('noop').then(() => {}) // warm-up trick não necessário; disparo via fetch interno

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planog.geometricagency.com'
    try {
      const l = lead as { id: string }
      await fetch(`${baseUrl}/api/automations/trigger-internal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_SECRET || '' },
        body: JSON.stringify({ trigger: 'lead_novo', lead_id: l.id, tenant_id: t.id }),
      })
    } catch { /* best-effort */ }

    return NextResponse.json(
      {
        success: true,
        lead,
        message: 'Lead criado com sucesso',
      },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET — verificar se a API key é válida (útil para testes de integração)
export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json({ error: 'API key obrigatória' }, { status: 401 })
  }

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id, name')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'API key inválida' }, { status: 403 })
  }

  const t = tenant as { id: string; name: string }
  return NextResponse.json({ valid: true, tenant: t.name })
}
