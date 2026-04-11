'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CreditCard, MessageCircle, User } from 'lucide-react'

const tabs = [
  { label: 'Início', icon: Home, href: '' },
  { label: 'Minha Cota', icon: CreditCard, href: '/simulador' },
  { label: 'Chat', icon: MessageCircle, href: '/chat' },
  { label: 'Perfil', icon: User, href: '/perfil' },
]

export default function PortalBottomNav({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/portal/${slug}`

  // Hide on auth screens
  const isAuthScreen = pathname.startsWith(`${base}/entrar`) || pathname.startsWith(`${base}/cadastrar`) || pathname.startsWith(`${base}/login`)
  if (isAuthScreen) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t flex"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`
        const active = tab.href === ''
          ? pathname === base
          : pathname.startsWith(`${base}${tab.href}`)
        const Icon = tab.icon
        return (
          <Link
            key={tab.label}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors"
            style={{ color: active ? 'var(--tenant-primary)' : 'var(--text-muted)' }}
          >
            <Icon size={20} />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
