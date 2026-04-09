import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import NovoVendedorForm from './NovoVendedorForm'

export default async function EquipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  const u = userData as { tenant_id: string; role: string } | null
  if (!u || u.role !== 'tenant_admin') redirect('/dashboard')

  const { data } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('tenant_id', u.tenant_id)
    .order('created_at', { ascending: false })

  const sellers = (data || []) as Array<{
    id: string; full_name: string | null; email: string | null
    role: string; is_active: boolean; created_at: string
  }>

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Equipe</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {sellers.length} membro{sellers.length !== 1 ? 's' : ''} cadastrado{sellers.length !== 1 ? 's' : ''}
        </p>
      </div>

      <NovoVendedorForm tenantId={u.tenant_id} />

      <div className="card-pg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {['Nome', 'Email', 'Cargo', 'Status', 'Desde', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.full_name || '—'}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                  {s.role === 'tenant_admin' ? 'Admin' : 'Vendedor'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={s.is_active
                      ? { backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }
                      : { backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }}>
                    {s.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(s.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={`/api/admin/toggle-seller`} method="POST">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={String(!s.is_active)} />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
