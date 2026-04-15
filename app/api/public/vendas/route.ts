import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Score inicial baseado nos dados da venda
function calcInitialScore(credit_value: number | null, total_installments: number | null, installments_paid: number | null): number {
  let score = 50
  if (total_installments && installments_paid !== null) {
    const pct = installments_paid / total_installments
    if (pct >= 0.3) score += 20
    else if (pct >= 0.1) score += 10
  }
  if (credit_value) {
    if (credit_value >= 200000) score += 15
    else if (credit_value >= 80000) score += 10
    else if (credit_value >= 30000) score += 5
  }
  return Math.min(100, Math.max(0, score))
}

export async function POST(request: Request) {
  try {
    // ── Autenticação ──────────────────────────────────────────────────
    const apiKey =
      request.headers.get('x-api-key') ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key obrigatória. Envie no header: x-api-key: <sua-chave>' },
        { status: 401 }
      )
    }

    const { data: tenant } = await admin
      .from('tenants')
      .select('id, name')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'API key inválida ou tenant inativo' }, { status: 403 })
    }

    const t = tenant as { id: string; name: string }

    // ── Campos do body ────────────────────────────────────────────────
    const body = await request.json()

    const full_name: string | undefined = body.full_name?.trim()
    const phone: string | undefined = body.phone?.trim()
    const credit_value: number | null = body.credit_value ? Number(body.credit_value) : null

    // Campos obrigatórios
    if (!full_name || !phone || !credit_value) {
      return NextResponse.json(
        { error: 'Os campos full_name, phone e credit_value são obrigatórios' },
        { status: 400 }
      )
    }

    // Campos opcionais
    const cpf: string | null = body.cpf?.trim() || null
    const email: string | null = body.email?.trim() || null
    const asset_type: string | null = body.asset_type || null
    const administrator: string | null = body.administrator?.trim() || null
    const group_number: string | null = body.group_number ? String(body.group_number) : null
    const quota_number: string | null = body.quota_number ? String(body.quota_number) : null
    const total_installments: number | null = body.total_installments ? Number(body.total_installments) : null
    const installments_paid: number = body.installments_paid ? Number(body.installments_paid) : 0
    const monthly_installment: number | null = body.monthly_installment ? Number(body.monthly_installment) : null
    const next_assembly_date: string | null = body.next_assembly_date || null
    const seller_id: string | null = body.seller_id || null
    const lead_id: string | null = body.lead_id || null
    const status: string = body.status || 'ativo'

    const VALID_STATUS = ['ativo', 'contemplado', 'inadimplente', 'cancelado']
    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json(
        { error: `status inválido. Use: ${VALID_STATUS.join(' | ')}` },
        { status: 400 }
      )
    }

    const VALID_ASSET = ['imovel', 'auto', 'moto', 'servicos', 'outros']
    if (asset_type && !VALID_ASSET.includes(asset_type)) {
      return NextResponse.json(
        { error: `asset_type inválido. Use: ${VALID_ASSET.join(' | ')}` },
        { status: 400 }
      )
    }

    // Se seller_id foi fornecido, verificar se pertence ao tenant
    if (seller_id) {
      const { data: sellerCheck } = await admin
        .from('users')
        .select('id')
        .eq('id', seller_id)
        .eq('tenant_id', t.id)
        .eq('role', 'seller')
        .single()

      if (!sellerCheck) {
        return NextResponse.json({ error: 'seller_id não encontrado neste tenant' }, { status: 400 })
      }
    }

    const contemplation_score = calcInitialScore(credit_value, total_installments, installments_paid)

    // ── Inserir consorciado ───────────────────────────────────────────
    const { data: consorciado, error: insertError } = await admin
      .from('consorciados')
      .insert({
        tenant_id: t.id,
        seller_id,
        full_name,
        cpf,
        phone,
        email,
        credit_value,
        asset_type,
        administrator,
        group_number,
        quota_number,
        total_installments,
        installments_paid,
        monthly_installment,
        next_assembly_date,
        status,
        contemplation_score,
      })
      .select('id, full_name, phone, credit_value, status, group_number, quota_number, contemplation_score, created_at')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // ── Marcar lead como convertido (se lead_id foi informado) ────────
    if (lead_id) {
      await admin
        .from('leads')
        .update({ status: 'convertido', desired_credit: credit_value })
        .eq('id', lead_id)
        .eq('tenant_id', t.id)
    }

    // ── Disparar automação de venda (best-effort) ─────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planog.geometricagency.com'
    const c = consorciado as { id: string }
    fetch(`${baseUrl}/api/automations/trigger-internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET || '',
      },
      body: JSON.stringify({ trigger: 'venda_nova', consorciado_id: c.id, tenant_id: t.id }),
    }).catch(() => { /* best-effort */ })

    return NextResponse.json(
      { success: true, consorciado, message: 'Venda registrada com sucesso' },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET — verificar se a API key é válida
export async function GET(request: Request) {
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json({ error: 'API key obrigatória' }, { status: 401 })
  }

  const { data: tenant } = await admin
    .from('tenants')
    .select('id, name')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'API key inválida' }, { status: 403 })
  }

  const t = tenant as { id: string; name: string }
  return NextResponse.json({
    valid: true,
    tenant: t.name,
    endpoint: 'POST /api/public/vendas',
    required: ['full_name', 'phone', 'credit_value'],
  })
}
