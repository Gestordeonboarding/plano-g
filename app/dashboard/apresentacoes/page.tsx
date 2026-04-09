import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus, Eye, Edit } from 'lucide-react'
import { PresentationTemplate } from '@/lib/presentations/types'

const CATEGORY_LABEL: Record<string, string> = {
  imovel: 'Imóvel', auto: 'Auto', moto: 'Moto', servicos: 'Serviços', universal: 'Universal'
}

const ANIM_LABEL: Record<string, string> = {
  fade: 'Fade', slide: 'Slide', zoom: 'Zoom', flip: 'Flip'
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  rascunho: { backgroundColor: 'rgba(176,196,195,0.15)', color: 'var(--text-secondary)' },
  finalizada: { backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' },
  enviada: { backgroundColor: 'rgba(130,100,220,0.15)', color: '#A78BFA' },
  visualizada: { backgroundColor: 'rgba(255,181,71,0.15)', color: '#FFB547' },
}

export default async function ApresentacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  const u = userData as { tenant_id: string } | null
  if (!u) redirect('/login')

  const [templatesRes, presentationsRes] = await Promise.all([
    supabase.from('presentation_templates').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('presentations')
      .select('id, title, status, view_count, updated_at')
      .eq('tenant_id', u.tenant_id)
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  const templates = (templatesRes.data || []) as unknown as PresentationTemplate[]
  const presentations = (presentationsRes.data || []) as Array<{
    id: string; title: string; status: string; view_count: number; updated_at: string
  }>

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Apresentações</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Crie propostas profissionais em minutos
        </p>
      </div>

      {presentations.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Minhas apresentações</h2>
          <div className="card-pg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  {['Título', 'Status', 'Visualizações', 'Atualizado em', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {presentations.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}
                    className="hover:bg-[rgba(0,212,200,0.04)] transition-colors">
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{p.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={STATUS_STYLE[p.status] || STATUS_STYLE.rascunho}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1"><Eye size={12} /> {p.view_count}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(p.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/apresentacoes/${p.id}`}
                        className="text-xs hover:underline flex items-center gap-1 justify-end"
                        style={{ color: 'var(--accent)' }}>
                        <Edit size={12} /> Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Biblioteca de templates
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>
            {templates.length} templates
          </span>
        </h2>

        {templates.length === 0 ? (
          <div className="card-pg p-10 text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Nenhum template ainda.</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Acesse o painel da agência e execute o seed de templates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {templates.map((t) => {
              const themeObj = t.theme as { accent_color?: string }
              const accentColor = themeObj.accent_color || '#00D4C8'
              const slidesArr = t.slides as unknown[]
              return (
                <div key={t.id} className="card-pg overflow-hidden flex flex-col">
                  <div className="h-36 flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: accentColor }}>
                    <div className="text-center p-4">
                      <p className="text-lg font-bold text-white">{t.name}</p>
                      <p className="text-xs text-white/70 mt-1">{CATEGORY_LABEL[t.category]}</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                        {ANIM_LABEL[t.animation_style]}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                        style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}>
                        {CATEGORY_LABEL[t.category]}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.description} · {slidesArr.length} slides
                    </p>
                    <Link href={`/dashboard/apresentacoes/nova?template=${t.id}`}
                      className="btn-primary text-sm text-center mt-auto flex items-center justify-center gap-2">
                      <Plus size={14} /> Usar template
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
