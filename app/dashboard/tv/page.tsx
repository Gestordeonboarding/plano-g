import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { getTVRanking } from '@/lib/tv/getRanking'
import TvClient from './TvClient'

export default async function TvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const ranking = await getTVRanking(tenantId)

  return <TvClient initialRanking={ranking} />
}
