import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApiDocsClient from './ApiDocsClient'

export default async function ApiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  const u = userData as { tenant_id: string; role: string } | null
  if (!u) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('api_key, name')
    .eq('id', u.tenant_id)
    .single()

  const t = tenant as { api_key: string | null; name: string } | null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planog.geometricagency.com'

  return (
    <ApiDocsClient
      apiKey={t?.api_key || null}
      tenantId={u.tenant_id}
      isAdmin={u.role === 'admin'}
      appUrl={appUrl}
    />
  )
}
