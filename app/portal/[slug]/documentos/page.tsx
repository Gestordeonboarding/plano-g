import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { FileText, Download } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = {
  contrato: 'Contrato',
  boleto: 'Boleto',
  carta_credito: 'Carta de Crédito',
  declaracao_ir: 'Declaração IR',
  outro: 'Outro',
}

export default async function DocumentosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const authClient = await createClient()
  const db = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await db.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/entrar`)

  const emailCpf = user.email?.replace('@portal.local', '') ?? ''
  const cpfFormatted = emailCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

  const { data: con } = await db
    .from('consorciados').select('id')
    .in('cpf', [emailCpf, cpfFormatted])
    .eq('tenant_id', (tenant as { id: string }).id).limit(1).single()

  if (!con) redirect(`/portal/${slug}`)

  const { data: docs } = await db
    .from('documents')
    .select('*')
    .eq('consorciado_id', (con as { id: string }).id)
    .order('created_at', { ascending: false })

  const documents = (docs || []) as Array<{
    id: string; name: string; file_url: string; type: string | null; created_at: string
  }>

  // Agrupar por tipo
  const grouped = documents.reduce((acc, doc) => {
    const key = doc.type || 'outro'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {} as Record<string, typeof documents>)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Documentos</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {documents.length} documento{documents.length !== 1 ? 's' : ''} disponível{documents.length !== 1 ? 'is' : ''}
        </p>
      </div>

      {documents.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum documento disponível ainda.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, typeDocs]) => (
          <div key={type}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-muted)' }}>
              {TYPE_LABEL[type] || type}
            </p>
            <div className="flex flex-col gap-2">
              {typeDocs.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} style={{ color: 'var(--tenant-primary)' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{doc.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <Download size={16} style={{ color: 'var(--tenant-primary)' }} />
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
