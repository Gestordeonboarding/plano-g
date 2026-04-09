import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateScore } from '@/lib/score'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface RowData {
  full_name: string
  cpf: string | null
  phone: string | null
  group_number: string | null
  quota_number: string | null
  credit_value: number | null
  installments_paid: number | null
  total_installments: number | null
  monthly_installment: number | null
  next_assembly_date: string | null
  status: string
}

export async function POST(request: Request) {
  try {
    const {
      tenant_id, rows, total_rows, error_rows,
      administradora, file_name, column_mapping,
    } = await request.json()

    if (!tenant_id || !rows?.length) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Criar registro de importação
    const { data: importRecord } = await supabaseAdmin
      .from('spreadsheet_imports')
      .insert({
        tenant_id,
        file_name,
        rows_processed: total_rows,
        rows_error: error_rows,
        status: 'processando',
        administrator: administradora,
        column_mapping,
      })
      .select()
      .single()

    const importId = (importRecord as { id: string } | null)?.id

    let created = 0
    let updated = 0
    let errors = 0

    for (const row of rows as RowData[]) {
      try {
        const cpf = row.cpf?.replace(/\D/g, '') || null

        // Calcular score
        const score = calculateScore({
          installments_paid: row.installments_paid ?? 0,
          total_installments: row.total_installments ?? 1,
          status: row.status || 'ativo',
        })

        const payload = {
          tenant_id,
          full_name: row.full_name,
          cpf,
          phone: row.phone,
          group_number: row.group_number,
          quota_number: row.quota_number,
          credit_value: row.credit_value ?? 0,
          installments_paid: row.installments_paid ?? 0,
          total_installments: row.total_installments,
          monthly_installment: row.monthly_installment,
          next_assembly_date: row.next_assembly_date,
          administrator: administradora,
          status: row.status || 'ativo',
          contemplation_score: score,
          last_data_update: new Date().toISOString(),
        }

        if (cpf) {
          // Tenta buscar existente pelo CPF
          const { data: existing } = await supabaseAdmin
            .from('consorciados')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('cpf', cpf)
            .single()

          if (existing) {
            await supabaseAdmin
              .from('consorciados')
              .update(payload)
              .eq('id', (existing as { id: string }).id)
            updated++
          } else {
            await supabaseAdmin.from('consorciados').insert(payload)
            created++
          }
        } else {
          // Sem CPF: sempre cria
          await supabaseAdmin.from('consorciados').insert(payload)
          created++
        }
      } catch {
        errors++
      }
    }

    // Atualizar registro de importação
    if (importId) {
      await supabaseAdmin.from('spreadsheet_imports').update({
        rows_success: created + updated,
        rows_error: errors + error_rows,
        status: 'concluido',
      }).eq('id', importId)
    }

    // Atualizar last_spreadsheet_import do tenant
    await supabaseAdmin
      .from('tenants')
      .update({ last_spreadsheet_import: new Date().toISOString() })
      .eq('id', tenant_id)

    return NextResponse.json({ created, updated, errors, importId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
