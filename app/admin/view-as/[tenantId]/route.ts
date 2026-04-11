import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData as { role: string }).role !== 'agency_admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Cookie must be set on the response object in route handlers,
  // not via cookies() from next/headers (which is read-only in route handlers)
  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  response.cookies.set('pgViewAs', tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}
