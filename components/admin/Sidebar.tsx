'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BarChart3, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
  { href: '/admin/franqueados', label: 'Franqueados', icon: Users },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="w-60 min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
          Plano G
        </span>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Painel da Agência
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? 'rgba(0,212,200,0.12)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
              }}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all hover:bg-red-500/10"
          style={{ color: 'var(--danger)' }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
