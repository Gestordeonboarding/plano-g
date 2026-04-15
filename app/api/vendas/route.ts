import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    // Autenticação via API key
    const apiKey =
      request.headers.get('x-api-key') ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key obrigatória. Envie no header x-api-key.' },
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
      return NextResponse.json(
        { error: 'API key inválida ou tenant inativo.' },
        { status: 403 }
      )
    }

    const t = tenant as { id: string; name: string }

    // Leitura e validação do body
    const body = await request.json()
    const { clienteNome, clienteTelefone, data } = body as {
      clienteNome?: string
      clienteTelefone?: string
      data?: string
    }

    if (!clienteNome || !clienteTelefone || !data) {
      return NextResponse.json(
        { error: 'Os campos clienteNome, clienteTelefone e data são obrigatórios.' },
        { status: 400 }
      )
    }

    // Valida o formato da data (aceita YYYY-MM-DD ou ISO 8601)
    const dataVenda = new Date(data)
    if (isNaN(dataVenda.getTime())) {
      return NextResponse.json(
        { error: 'Campo data inválido. Use o formato YYYY-MM-DD ou ISO 8601.' },
        { status: 400 }
      )
    }

    // Insere a venda na tabela consorciados
    const { data: venda, error } = await admin
      .from('consorciados')
      .insert({
        tenant_id: t.id,
        full_name: clienteNome.trim(),
        phone: clienteTelefone.trim(),
        status: 'ativo',
        contemplation_score: 50,
        installments_paid: 0,
        created_at: dataVenda.toISOString(),
      })
      .select('id, full_name, phone, status, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: true, venda },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
