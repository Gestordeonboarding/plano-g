import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { createClient as createAdmin } from '@supabase/supabase-js'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })

    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [sellersRes, leadsRes, commissionsRes] = await Promise.all([
      admin.from('users').select('id, full_name, avatar_url').eq('tenant_id', tenantId).in('role', ['seller', 'tenant_admin']).eq('is_active', true),
      admin.from('leads').select('seller_id, desired_credit').eq('tenant_id', tenantId).eq('status', 'convertido').gte('created_at', firstOfMonth),
      admin.from('seller_commissions').select('seller_id, rate_percent').eq('tenant_id', tenantId),
    ])

    const sellers = (sellersRes.data || []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>
    const leads = (leadsRes.data || []) as Array<{ seller_id: string | null; desired_credit: number | null }>
    const commissions = (commissionsRes.data || []) as Array<{ seller_id: string; rate_percent: number }>

    const ranked = sellers.map(s => {
      const myLeads = leads.filter(l => l.seller_id === s.id)
      const credit = myLeads.reduce((sum, l) => sum + (l.desired_credit || 0), 0)
      const comm = commissions.find(c => c.seller_id === s.id)
      const commission_earned = credit * ((comm?.rate_percent || 0) / 100)
      return { ...s, converted: myLeads.length, credit, commission_earned }
    }).sort((a, b) => b.converted - a.converted || b.credit - a.credit)

    return NextResponse.json({ ranking: ranked })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
