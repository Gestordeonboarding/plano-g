'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Início',
  leads: 'Leads',
  consorciados: 'Consorciados',
  apresentacoes: 'Apresentações',
  notificacoes: 'Notificações',
  relatorios: 'Relatórios',
  ligacoes: 'Ligações',
  tv: 'Modo TV',
  'modo-tv': 'Modo TV',
  automacoes: 'Automações',
  equipe: 'Equipe',
  importar: 'Importar dados',
  administradoras: 'Administradoras',
  conexoes: 'Conexões',
  api: 'API de Leads',
  'api-leads': 'API de Leads',
  configuracoes: 'Configurações',
  novo: 'Novo',
  novos: 'Novo',
  nova: 'Nova',
  analytics: 'Analytics',
  apresentar: 'Apresentar',
  relacionamentos: 'Relacionamentos',
}

interface TopbarProps {
  /** Mensagem do chip de alerta (deixa null se não há alerta) */
  alertMessage?: string | null
  /** Link do alerta (default: /dashboard/importar) */
  alertHref?: string
}

export default function Topbar({ alertMessage, alertHref = '/dashboard/importar' }: TopbarProps) {
  const pathname = usePathname() ?? ''
  const segments = pathname.split('/').filter(Boolean)

  return (
    <div
      style={{
        height: 48,
        background: 'var(--g-bg-surface)',
        borderBottom: '1px solid var(--g-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, minWidth: 0, overflow: 'hidden' }}>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          const label = ROUTE_LABELS[seg] ?? seg
          // Esconde IDs longos (UUIDs / slugs) — mostra "..." no lugar
          const display = seg.length > 24 || /^[a-f0-9-]{20,}$/i.test(seg) ? '...' : label
          return (
            <span key={`${seg}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              {i > 0 && (
                <span style={{ color: 'var(--g-text-ghost)', fontSize: 10 }}>/</span>
              )}
              <span
                style={{
                  color: isLast ? 'var(--g-text-secondary)' : 'var(--g-text-ghost)',
                  fontWeight: isLast ? 500 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 200,
                }}
              >
                {display}
              </span>
            </span>
          )
        })}
      </div>

      {/* ── Chip de alerta (discreto, não full-width) ────────────────── */}
      {alertMessage && (
        <Link
          href={alertHref}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--g-warning-bg)',
            border: '1px solid var(--g-warning-border)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: 'var(--g-warning-text)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={11} aria-hidden="true" />
          {alertMessage}
        </Link>
      )}
    </div>
  )
}
