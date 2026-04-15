import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    // Verifica se o consorciado pertence ao tenant do usuário
    const { data: me } = await admin.from('users').select('role, tenant_id').eq('id', user.id).single()
    const u = me as { role: string; tenant_id: string } | null
    if (!u) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 403 })

    const { data: existing } = await admin.from('consorciados').select('id, tenant_id').eq('id', id).single()
    if (!existing) return NextResponse.json({ error: 'Consorciado não encontrado.' }, { status: 404 })

    const e = existing as { id: string; tenant_id: string }
    if (u.role !== 'agency_admin' && e.tenant_id !== u.tenant_id) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body = await req.json()

    const { error } = await admin
      .from('consorciados')
      .update({
        full_name: body.full_name,
        cpf: body.cpf || null,
        phone: body.phone || null,
        email: body.email || null,
        credit_value: body.credit_value ?? null,
        group_number: body.group_number || null,
        quota_number: body.quota_number || null,
        administrator: body.administrator || null,
        total_installments: body.total_installments ?? null,
        installments_paid: body.installments_paid ?? 0,
        monthly_installment: body.monthly_installment ?? null,
        next_assembly_date: body.next_assembly_date || null,
        status: body.status || 'ativo',
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
