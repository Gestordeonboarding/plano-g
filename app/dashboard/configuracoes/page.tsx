import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfigForm from './ConfigForm'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  const u = userData as { tenant_id: string; role: string } | null
  if (!u) redirect('/login')

  const { data: tenant } = await supabase.from('tenants').select('*').eq('id', u.tenant_id!).single()

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Personalize seu escritório</p>
      </div>
      <ConfigForm tenant={tenant as Record<string, unknown>} />
    </div>
  )
}
