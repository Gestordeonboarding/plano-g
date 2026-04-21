import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ notifications: [] })

    const since = request.nextUrl.searchParams.get('since')
    if (!since) return NextResponse.json({ notifications: [] })

    const { data } = await admin
      .from('seller_notifications')
      .select('id, title, body, type, data, created_at')
      .eq('seller_id', user.id)
      .eq('read', false)
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ notifications: data || [] })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}
