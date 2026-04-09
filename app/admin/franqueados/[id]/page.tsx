import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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

      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        {(tenant as { name: string }).name}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        /portal/{(tenant as { slug: string }).slug}
      </p>

      <EditFranqueadoForm tenant={tenant as Record<string, unknown>} sellers={(sellers || []) as Record<string, unknown>[]} />
    </div>
  )
}
