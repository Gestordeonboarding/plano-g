import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import AutomacoesClient, { AutomationRule } from './AutomacoesClient'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

export default async function AutomacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const [rulesRes, tenantRes] = await Promise.all([
    supabase.from('automation_rules').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    supabase.from('tenants').select('evolution_api_url').eq('id', tenantId).single(),
  ])

  const rules = (rulesRes.data || []) as unknown as AutomationRule[]
  const tenant = tenantRes.data as { evolution_api_url: string | null } | null
  const hasWhatsApp = !!tenant?.evolution_api_url

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(0,212,200,0.15)' }}>
          <Zap size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Automações WhatsApp</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Envie mensagens automáticas via WhatsApp quando eventos acontecerem nos seus leads
          </p>
        </div>
      </div>

      <AutomacoesClient initialRules={rules} hasWhatsApp={hasWhatsApp} />
    </div>
  )
}
