import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCPF, formatPhone } from '@/lib/utils'
import LogoutButton from './LogoutButton'

export default async function PerfilPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/portal/${slug}/login`)

  const { data: tenant } = await supabase.from('tenants').select('id, name').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/login`)

  const { data: con } = await supabase
    .from('consorciados')
    .select('full_name, cpf, phone, email')
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .single()

  if (!con) redirect(`/portal/${slug}`)

  const c = con as { full_name: string; cpf: string | null; phone: string | null; email: string | null }
  const t = tenant as { id: string; name: string }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Meu Perfil</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
          style={{ backgroundColor: 'var(--tenant-primary)', color: 'var(--bg-primary)' }}
        >
          {c.full_name[0]}
        </div>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{c.full_name}</p>
        <span
          className="text-xs px-3 py-1 rounded-full font-medium"
          style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--tenant-primary)' }}
        >
          Consorciado · {t.name}
        </span>
      </div>

      {/* Dados */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Meus dados</p>
        {[
          { label: 'Nome completo', value: c.full_name },
          { label: 'CPF', value: c.cpf ? formatCPF(c.cpf) : '—' },
          { label: 'Telefone', value: c.phone ? formatPhone(c.phone) : '—' },
          { label: 'Email', value: c.email || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      <LogoutButton slug={slug} />
    </div>
  )
}
