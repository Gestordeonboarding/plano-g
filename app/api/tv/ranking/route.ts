import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { getTVRanking } from '@/lib/tv/getRanking'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ranking: [] })

    const tenantId = await getViewingTenantId()
    if (!tenantId) return NextResponse.json({ ranking: [] })

    const ranking = await getTVRanking(tenantId)
    return NextResponse.json({ ranking }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[tv-ranking] erro:', err)
    return NextResponse.json({ ranking: [] })
  }
}
