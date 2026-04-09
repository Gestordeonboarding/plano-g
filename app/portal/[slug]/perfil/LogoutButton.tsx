'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function LogoutButton({ slug }: { slug: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/portal/${slug}/login`)
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-colors"
      style={{ backgroundColor: 'rgba(255,92,92,0.10)', color: 'var(--danger)', border: '1px solid rgba(255,92,92,0.20)' }}
    >
      <LogOut size={16} />
      Sair do portal
    </button>
  )
}
