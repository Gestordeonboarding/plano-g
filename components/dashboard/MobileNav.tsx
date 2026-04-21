'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, MessageSquare, Bell, Menu, X, Tv,
  Upload, Zap, Settings, LogOut, UsersRound, Presentation, Code, BarChart3, Wifi, LineChart
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Role = 'seller' | 'tenant_admin' | 'agency_admin'

const bottomItems = [
  { href: '/dashboard',              label: 'Início',       icon: LayoutDashboard, exact: true,  roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/leads',        label: 'Leads',        icon: Users,                          roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/consorciados', label: 'Clientes',     icon: UserCheck,                      roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/conversas',    label: 'Conversas',    icon: MessageSquare,                  roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/notificacoes', label: 'Alertas',      icon: Bell,                           roles: ['seller', 'tenant_admin', 'agency_admin'] },
]

const allNavItems = [
  { href: '/dashboard',                  label: 'Início',         icon: LayoutDashboard, exact: true,  roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/leads',            label: 'Leads',          icon: Users,                          roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/consorciados',     label: 'Consorciados',   icon: UserCheck,                      roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/apresentacoes',    label: 'Apresentações',  icon: Presentation,                   roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/conversas',        label: 'Conversas',      icon: MessageSquare,                  roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/notificacoes',     label: 'Notificações',   icon: Bell,                           roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/relatorios',       label: 'Relatórios',     icon: BarChart3,                      roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/tv',              label: 'Modo TV',         icon: Tv,                             roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/importar',         label: 'Importar dados', icon: Upload,                         roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/conexoes',         label: 'Conexões',       icon: Wifi,                           roles: ['seller', 'tenant_admin', 'agency_admin'] },
  { href: '/dashboard/analytics',        label: 'Analytics',      icon: LineChart,                      roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/automacoes',       label: 'Automações',     icon: Zap,                            roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/equipe',           label: 'Equipe',         icon: UsersRound,                     roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/api',              label: 'API de Leads',   icon: Code,                           roles: ['tenant_admin', 'agency_admin'] },
  { href: '/dashboard/configuracoes',    label: 'Configurações',  icon: Settings,                       roles: ['tenant_admin', 'agency_admin'] },
]

export default function MobileNav({ tenantName, role }: { tenantName: string; role: Role }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const visibleBottom = bottomItems.filter((i) => i.roles.includes(role))
  const visibleAll = allNavItems.filter((i) => i.roles.includes(role))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Drawer menu lateral */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
              backgroundColor: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border-color)',
              display: 'flex', flexDirection: 'column',
              animation: 'slideInLeft 0.25s ease both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`@keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>

            {/* Header do drawer */}
            <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>Plano G</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{tenantName}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {visibleAll.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      textDecoration: 'none', fontSize: 14, fontWeight: 500,
                      backgroundColor: active ? 'rgba(0,212,200,0.12)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Sair */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: 'var(--danger)',
                }}
              >
                <LogOut size={18} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 60,
      }}>
        {visibleBottom.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                height: '100%',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </Link>
          )
        })}

        {/* Botão de menu completo */}
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', height: '100%',
          }}
        >
          <Menu size={20} />
          <span style={{ fontSize: 9, fontWeight: 500 }}>Menu</span>
        </button>
      </nav>
    </>
  )
}
