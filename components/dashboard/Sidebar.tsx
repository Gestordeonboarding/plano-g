'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Upload,
  Zap, Settings, LogOut, UsersRound, Presentation, Code, BarChart3, Wifi,
  MessageSquare, LineChart, Bell, Tv, Building2, Phone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

type Role = 'seller' | 'tenant_admin' | 'agency_admin'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  exact?: boolean
  isNew?: boolean
  roles: Role[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',              label: 'Início',       icon: LayoutDashboard, exact: true,  roles: ['seller', 'tenant_admin', 'agency_admin'] },
      { href: '/dashboard/leads',        label: 'Leads',        icon: Users,                          roles: ['seller', 'tenant_admin', 'agency_admin'] },
      { href: '/dashboard/consorciados', label: 'Consorciados', icon: UserCheck,                      roles: ['seller', 'tenant_admin', 'agency_admin'] },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/dashboard/apresentacoes', label: 'Apresentações', icon: Presentation, isNew: true,    roles: ['seller', 'tenant_admin', 'agency_admin'] },
      { href: '/dashboard/conversas',     label: 'Conversas',     icon: MessageSquare,                roles: ['seller', 'tenant_admin', 'agency_admin'] },
      { href: '/dashboard/notificacoes',  label: 'Notificações',  icon: Bell,                         roles: ['seller', 'tenant_admin', 'agency_admin'] },
      { href: '/dashboard/tv',            label: 'Modo TV',       icon: Tv,                           roles: ['seller', 'tenant_admin', 'agency_admin'] },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/dashboard/relatorios',          label: 'Relatórios',     icon: BarChart3,    roles: ['seller', 'tenant_admin', 'agency_admin'] },
      { href: '/dashboard/relatorios/ligacoes', label: 'Ligações',       icon: Phone,        roles: ['tenant_admin', 'agency_admin'] },
      { href: '/dashboard/analytics',           label: 'Analytics',      icon: LineChart,    roles: ['tenant_admin', 'agency_admin'] },
      { href: '/dashboard/automacoes',          label: 'Automações',     icon: Zap,          roles: ['tenant_admin', 'agency_admin'] },
      { href: '/dashboard/equipe',              label: 'Equipe',         icon: UsersRound,   roles: ['tenant_admin', 'agency_admin'] },
      { href: '/dashboard/importar',            label: 'Importar dados', icon: Upload,       roles: ['tenant_admin', 'agency_admin'] },
      { href: '/dashboard/administradoras',     label: 'Administradoras', icon: Building2,   roles: ['tenant_admin', 'agency_admin'] },
      { href: '/dashboard/conexoes',            label: 'Conexões',       icon: Wifi,         roles: ['seller', 'tenant_admin', 'agency_admin'] },
      { href: '/dashboard/api',                 label: 'API de Leads',   icon: Code,         roles: ['tenant_admin', 'agency_admin'] },
      { href: '/dashboard/configuracoes',       label: 'Configurações',  icon: Settings,     roles: ['tenant_admin', 'agency_admin'] },
    ],
  },
]

interface SidebarProps {
  tenantName: string
  role: Role
  user?: {
    fullName: string | null
    email: string | null
  }
}

export default function DashboardSidebar({ tenantName, role, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = user?.fullName || user?.email || ''
  const initial = displayName.charAt(0).toUpperCase() || 'U'

  return (
    <aside
      style={{
        width: 232,
        background: 'var(--g-bg-surface)',
        borderRight: '1px solid var(--g-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* ── Header: Logo + nome do tenant (sem texto "Plano G") ──────── */}
      <div
        style={{
          padding: '20px 16px 18px',
          borderBottom: '1px solid var(--g-border-soft)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={30} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--g-text-secondary)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tenantName}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navegação ────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((i) => i.roles.includes(role))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: 'var(--g-text-ghost)',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  padding: '0 8px',
                  marginBottom: 4,
                }}
              >
                {group.label}
              </div>

              {visibleItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href) ?? false
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 9px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      color: active ? 'var(--g-accent)' : 'var(--g-text-muted)',
                      background: active ? 'var(--g-accent-dim)' : 'transparent',
                      textDecoration: 'none',
                      marginBottom: 1,
                      transition: 'background-color 0.12s, color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(0,196,180,0.05)'
                        e.currentTarget.style.color = 'var(--g-text-secondary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--g-text-muted)'
                      }
                    }}
                  >
                    <span style={{ display: 'inline-flex', width: 16, justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} />
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.isNew && !active && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 500,
                          background: 'var(--g-accent-dim)',
                          color: 'var(--g-accent)',
                          padding: '1px 6px',
                          borderRadius: 20,
                          flexShrink: 0,
                        }}
                      >
                        Novo
                      </span>
                    )}
                    {active && (
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: 'var(--g-accent)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* ── Footer: usuário + logout ─────────────────────────────────── */}
      <div
        style={{
          padding: '10px 8px',
          borderTop: '1px solid var(--g-border-soft)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 8px',
              borderRadius: 7,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--g-accent-dim)',
                border: '1px solid var(--g-accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--g-accent)',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--g-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--g-text-ghost)' }}>
                {role === 'agency_admin' ? 'Agência' : role === 'tenant_admin' ? 'Administrador' : 'Vendedor'}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 9px',
            borderRadius: 6,
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12.5,
            color: 'var(--g-text-muted)',
            transition: 'background-color 0.12s, color 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--g-danger-bg)'
            e.currentTarget.style.color = 'var(--g-danger-text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--g-text-muted)'
          }}
        >
          <span style={{ display: 'inline-flex', width: 16, justifyContent: 'center', flexShrink: 0 }}>
            <LogOut size={14} />
          </span>
          <span style={{ flex: 1, textAlign: 'left' }}>Sair</span>
        </button>
      </div>
    </aside>
  )
}
