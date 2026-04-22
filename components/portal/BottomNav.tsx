'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, MessageCircle, User, LayoutGrid } from 'lucide-react'

export default function PortalBottomNav({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/portal/${slug}`

  // Esconde nas telas de autenticação
  const isAuthScreen = pathname.startsWith(`${base}/entrar`) ||
    pathname.startsWith(`${base}/cadastrar`) ||
    pathname.startsWith(`${base}/login`)
  if (isAuthScreen) return null

  // Extrai o ID da cota atual da URL (ex: /portal/slug/cota/[id])
  const cotaMatch = pathname.match(/\/cota\/([^/]+)/)
  const currentCotaId = cotaMatch ? cotaMatch[1] : null

  const tabs = [
    {
      label: 'Carteira',
      icon: Home,
      href: base,
      active: pathname === base,
    },
    {
      label: 'Minha Cota',
      icon: TrendingUp,
      href: currentCotaId ? `${base}/cota/${currentCotaId}` : base,
      active: pathname.startsWith(`${base}/cota/`) || pathname.startsWith(`${base}/simulador`),
    },
    {
      label: 'Catálogo',
      icon: LayoutGrid,
      href: `${base}/catalogo`,
      active: pathname.startsWith(`${base}/catalogo`),
    },
    {
      label: 'Chat',
      icon: MessageCircle,
      href: `${base}/chat`,
      active: pathname.startsWith(`${base}/chat`),
    },
    {
      label: 'Perfil',
      icon: User,
      href: `${base}/perfil`,
      active: pathname.startsWith(`${base}/perfil`),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t flex"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors"
            style={{ color: tab.active ? 'var(--tenant-primary)' : 'var(--text-muted)' }}
          >
            <Icon size={20} />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
