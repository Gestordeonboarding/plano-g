import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (userData as { role: string } | null)?.role

  if (role === 'agency_admin') {
    redirect('/admin')
  } else if (role === 'tenant_admin' || role === 'seller') {
    redirect('/dashboard')
  }

  redirect('/login')
}
