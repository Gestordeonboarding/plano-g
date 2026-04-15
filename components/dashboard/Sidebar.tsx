'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Upload,
  Zap, Settings, LogOut, UsersRound, Presentation, Code, BarChart3, Wifi, MessageSquare, LineChart, Bell
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Role = 'seller' | 'tenant_admin' | 'agency_admin'

const allNavItems = [
  { href: '/dashboard',                  label: 'Início',         icon: LayoutDashboard, exact: true,  roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/leads',            label: 'Leads',          icon: Users,                          roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/consorciados',     label: 'Consorciados',   icon: UserCheck,                      roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/apresentacoes',    label: 'Apresentações',  icon: Presentation, isNew: true,      roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/conversas',        label: 'Conversas',      icon: MessageSquare,                  roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/notificacoes',     label: 'Notificações',   icon: Bell,                           roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/relatorios',       label: 'Relatórios',     icon: BarChart3,                      roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/importar',         label: 'Importar dados', icon: Upload,                         roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/conexoes',         label: 'Conexões',       icon: Wifi,                           roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/analytics',        label: 'Analytics',      icon: LineChart,                      roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/automacoes',       label: 'Automações',     icon: Zap,                            roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/equipe',           label: 'Equipe',         icon: UsersRound,                     roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/api',              label: 'API de Leads',   icon: Code,                           roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/configuracoes',    label: 'Configurações',  icon: Settings,                       roles: ['tenant_admin', 'agency_admin'] },
]

interface SidebarProps {
  tenantName: string
  role: Role
}

export default function DashboardSidebar({ tenantName, role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = allNavItems.filter(item => item.roles.includes(role))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="w-60 min-h-screen flex flex-col shrink-0"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
          Plano G
        </span>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
          {tenantName}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
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
              <span className="flex-1">{item.label}</span>
              {item.isNew && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  Novo
                </span>
              )}
            </Link>
          )
        })}
      </nav>

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
