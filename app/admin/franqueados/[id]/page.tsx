import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import EditFranqueadoForm from './EditFranqueadoForm'

export default async function EditFranqueadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (!tenant) notFound()

  const { data: sellers } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('tenant_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/franqueados"
        className="flex items-center gap-2 text-sm mb-6 hover:underline"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={14} /> Voltar para franqueados
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {(tenant as { name: string }).name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            /portal/{(tenant as { slug: string }).slug}
          </p>
        </div>
        <Link
          href={`/admin/view-as/${(tenant as { id: string }).id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          <Eye size={15} />
          Acessar como este franqueado
        </Link>
      </div>

      <EditFranqueadoForm tenant={tenant as Record<string, unknown>} sellers={(sellers || []) as Record<string, unknown>[]} />
    </div>
  )
}
