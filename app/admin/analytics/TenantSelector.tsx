'use client'

import { ChevronDown } from 'lucide-react'

export default function TenantSelector({
  tenants,
  selectedId,
  period,
}: {
  tenants: Array<{ id: string; name: string }>
  selectedId: string
  period: string
}) {
  return (
    <div className="relative">
      <select
        className="input-pg pr-8 text-sm font-medium appearance-none"
        style={{ cursor: 'pointer' }}
        value={selectedId}
        onChange={(e) => {
          window.location.href = `/admin/analytics?tenant=${e.target.value}&period=${period}`
        }}
      >
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
    </div>
  )
}
