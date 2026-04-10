import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ImportWizard from '@/components/importar/ImportWizard'
import { formatDate } from '@/lib/utils'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'

export default async function ImportarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  // Histórico das últimas importações
  const { data: imports } = await supabase
    .from('spreadsheet_imports')
    .select('id, created_at, file_name, rows_processed, rows_success, rows_error, status, administrator')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5)

  const history = (imports || []) as Array<{
    id: string; created_at: string; file_name: string | null
    rows_processed: number; rows_success: number; rows_error: number
    status: string; administrator: string | null
  }>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Importar dados
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Importe sua planilha de consorciados em 4 passos simples
        </p>
      </div>

      <ImportWizard tenantId={tenantId} />

      {/* Histórico */}
      {history.length > 0 && (
        <div className="card-pg p-5">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Últimas importações
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                {['Data', 'Arquivo', 'Administradora', 'Processadas', 'Sucesso', 'Erros', 'Status'].map((h) => (
                  <th key={h} className="text-left pb-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((imp) => (
                <tr key={imp.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(imp.created_at)}
                  </td>
                  <td className="py-2.5 max-w-[140px] truncate" style={{ color: 'var(--text-primary)' }}>
                    {imp.file_name || '—'}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {imp.administrator || '—'}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>{imp.rows_processed}</td>
                  <td className="py-2.5" style={{ color: 'var(--accent)' }}>{imp.rows_success}</td>
                  <td className="py-2.5" style={{ color: imp.rows_error > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {imp.rows_error}
                  </td>
                  <td className="py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={imp.status === 'concluido'
                        ? { backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }
                        : imp.status === 'erro'
                        ? { backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }
                        : { backgroundColor: 'rgba(255,181,71,0.15)', color: '#FFB547' }}>
                      {imp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
