import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfigForm from './ConfigForm'
import WhatsAppConnect from './WhatsAppConnect'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  const t = tenant as Record<string, unknown> & { whatsapp_phone?: string | null }

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Personalize seu escritório</p>
      </div>

      <WhatsAppConnect initialPhone={t?.whatsapp_phone || null} />

      <ConfigForm tenant={t} />
    </div>
  )
}
