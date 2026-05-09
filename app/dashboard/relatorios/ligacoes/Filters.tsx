'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface Props {
  period: string
  seller: string
  start: string
  end: string
  sellers: { id: string; name: string }[]
}

export default function Filters({ period, seller, start, end, sellers }: Props) {
  const router = useRouter()

  function update(next: Partial<Record<'period' | 'seller' | 'start' | 'end', string>>) {
    const params = new URLSearchParams()
    const merged = { period, seller, start, end, ...next }
    if (merged.period && merged.period !== 'mes') params.set('period', merged.period)
    if (merged.seller && merged.seller !== 'all') params.set('seller', merged.seller)
    if (merged.start) params.set('start', merged.start)
    if (merged.end) params.set('end', merged.end)
    const qs = params.toString()
    router.push(`/dashboard/relatorios/ligacoes${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Período */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>
          Período
        </label>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {[
            { v: 'hoje', l: 'Hoje' },
            { v: 'semana', l: 'Semana' },
            { v: 'mes', l: 'Mês' },
            { v: 'custom', l: 'Personalizado' },
          ].map((o) => {
            const active = period === o.v
            return (
              <button
                key={o.v}
                onClick={() => update({ period: o.v })}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}
              >
                {o.l}
              </button>
            )
          })}
        </div>
      </div>

      {/* Datas custom */}
      {period === 'custom' && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              De
            </label>
            <input
              type="date"
              className="input-pg text-xs"
              value={start}
              onChange={(e) => update({ start: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>
              Até
            </label>
            <input
              type="date"
              className="input-pg text-xs"
              value={end}
              onChange={(e) => update({ end: e.target.value })}
            />
          </div>
        </>
      )}

      {/* Vendedor */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>
          Vendedor
        </label>
        <div className="relative">
          <select
            className="input-pg text-xs pr-8 appearance-none cursor-pointer"
            value={seller}
            onChange={(e) => update({ seller: e.target.value })}
          >
            <option value="all">Todos os vendedores</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </div>
    </div>
  )
}
