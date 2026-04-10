import { cookies } from 'next/headers'
import { createClient } from './server'

export async function getViewingTenantId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData) return null

  const u = userData as { role: string; tenant_id: string | null }

  if (u.role === 'agency_admin') {
    const cookieStore = await cookies()
    return cookieStore.get('pgViewAs')?.value || null
  }

  return u.tenant_id
}
