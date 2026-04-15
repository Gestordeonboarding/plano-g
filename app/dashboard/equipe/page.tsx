import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient as createAdmin } from '@supabase/supabase-js'
import EquipeAdminClient from './EquipeAdminClient'
import NovoVendedorForm from './NovoVendedorForm'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function EquipePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client to bypass RLS when reading user role
  const { data: userData } = await admin
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  const role = (userData as { role: string; tenant_id: string | null } | null)?.role || 'seller'

  // Only tenant_admin and agency_admin can access this page
  if (role === 'seller') redirect('/dashboard')

  let tenantId: string | null = null

  if (role === 'agency_admin') {
    const cookieStore = await cookies()
    tenantId = cookieStore.get('pgViewAs')?.value ?? null
    if (!tenantId) redirect('/admin/franqueados')
  } else {
    tenantId = (userData as { role: string; tenant_id: string | null } | null)?.tenant_id ?? null
    if (!tenantId) redirect('/dashboard')
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [sellersRes, leadsRes, commissionsRes, prizesRes] = await Promise.all([
    admin.from('users')
      .select('id, full_name, email, avatar_url, is_active, created_at, whatsapp_phone')
      .eq('tenant_id', tenantId)
      .eq('role', 'seller')
      .order('created_at'),
    admin.from('leads')
      .select('seller_id, desired_credit')
      .eq('tenant_id', tenantId)
      .eq('status', 'convertido')
      .gte('created_at', firstOfMonth),
    admin.from('seller_commissions').select('*').eq('tenant_id', tenantId),
    admin.from('seller_prizes').select('*').eq('tenant_id', tenantId).eq('month', currentMonth),
  ])

  return (
    <div className="flex flex-col gap-6">
      <EquipeAdminClient
        tenantId={tenantId}
        sellers={(sellersRes.data || []) as any[]}
        monthLeads={(leadsRes.data || []) as any[]}
        commissions={(commissionsRes.data || []) as any[]}
        prizes={(prizesRes.data || []) as any[]}
        currentMonth={currentMonth}
      />
      <div className="card-pg p-5">
        <p className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Adicionar novo vendedor</p>
        <NovoVendedorForm tenantId={tenantId} />
      </div>
    </div>
  )
}
