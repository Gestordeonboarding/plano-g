'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Share2, Maximize2, ArrowLeft, Eye } from 'lucide-react'
import { PresentationTemplate, Presentation, Slide, PresentationTheme } from '@/lib/presentations/types'
import SlideRenderer from './SlideRenderer'
import SlideEditorPanel from './SlideEditorPanel'
import Link from 'next/link'

interface Props {
  template: PresentationTemplate | null
  tenantId: string
  sellerId: string
  presentationId: string | null
  initialPresentation: Presentation | null
}

export default function PresentationEditor({ template, tenantId, sellerId, presentationId, initialPresentation }: Props) {
  const router = useRouter()

  const initialSlides: Slide[] = initialPresentation
    ? (initialPresentation.slides as unknown as Slide[])
    : (template?.slides as unknown as Slide[] || [])

  const initialTheme: PresentationTheme = initialPresentation
    ? (initialPresentation.customization as unknown as PresentationTheme)
    : (template?.theme as unknown as PresentationTheme || { accent_color: '#00D4C8', bg_color: '#0D1F1E', font: 'inter', show_logo: true })

  const [title, setTitle] = useState(initialPresentation?.title || `Proposta — ${template?.name || 'Nova'}`)
  const [slides, setSlides] = useState<Slide[]>(initialSlides)
  const [theme, setTheme] = useState<PresentationTheme>(initialTheme)
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(
    initialPresentation?.share_token ? `${window?.location?.origin}/p/${initialPresentation.share_token}` : null
  )
  const [activeTab, setActiveTab] = useState<'dados' | 'visual'>('dados')

  const currentSlide = slides[currentSlideIdx]

  function updateSlideField(slideId: string, fieldKey: string, value: string) {
    setSlides((prev) => prev.map((s) =>
      s.id === slideId
        ? { ...s, editable_fields: s.editable_fields.map((f) => f.key === fieldKey ? { ...f, value } : f) }
        : s
    ))
  }

  function toggleSlideVisible(slideId: string) {
    setSlides((prev) => prev.map((s) => s.id === slideId ? { ...s, visible: !s.visible } : s))
  }

  async function handleSave(status: 'rascunho' | 'finalizada' = 'rascunho') {
    setSaving(true)
    const body = {
      title, slides, customization: theme, status,
      tenant_id: tenantId, seller_id: sellerId,
      template_id: template?.id || null,
    }

    const url = presentationId ? `/api/presentations/${presentationId}` : '/api/presentations'
    const method = presentationId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok && !presentationId) {
      router.replace(`/dashboard/apresentacoes/${data.id}`)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleShare() {
    const res = await fetch(`/api/presentations/${presentationId || 'new'}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, title, slides, customization: theme, template_id: template?.id }),
    })
    const data = await res.json()
    if (data.share_url) {
      setShareUrl(data.share_url)
      await navigator.clipboard.writeText(data.share_url)
      alert(`Link copiado: ${data.share_url}`)
    }
  }

  function handlePresent() {
    if (presentationId) {
      window.open(`/dashboard/apresentacoes/${presentationId}/apresentar`, '_blank')
    } else {
      alert('Salve a apresentação primeiro.')
    }
  }

  if (!currentSlide) return null

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 overflow-hidden">
      {/* Barra superior */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <Link href="/dashboard/apresentacoes" className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} />
        </Link>
        <input
          className="flex-1 bg-transparent text-sm font-semibold outline-none px-2 py-1 rounded"
          style={{ color: 'var(--text-primary)' }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave('rascunho')} disabled={saving}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <Save size={12} /> {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
          </button>
          <button onClick={handlePresent}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <Maximize2 size={12} /> Apresentar
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>
            <Share2 size={12} /> Compartilhar
          </button>
          <button onClick={() => handleSave('finalizada')} className="btn-primary text-xs px-3 py-1.5">
            Finalizar
          </button>
        </div>
      </div>

      {/* Layout 3 colunas */}
      <div className="flex flex-1 min-h-0">
        {/* Coluna esquerda — editor */}
        <div className="w-64 shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {/* Tabs */}
          <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            {(['dados', 'visual'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-xs font-medium capitalize transition-colors"
                style={{
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4">
            {activeTab === 'dados' && currentSlide && (
              <SlideEditorPanel
                slide={currentSlide}
                onFieldChange={(key, value) => updateSlideField(currentSlide.id, key, value)}
              />
            )}

            {activeTab === 'visual' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Cor de destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={theme.accent_color}
                      onChange={(e) => setTheme((t) => ({ ...t, accent_color: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                    <input className="input-pg flex-1 text-xs" value={theme.accent_color}
                      onChange={(e) => setTheme((t) => ({ ...t, accent_color: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Fonte</label>
                  <select className="input-pg text-xs" value={theme.font}
                    onChange={(e) => setTheme((t) => ({ ...t, font: e.target.value as PresentationTheme['font'] }))}>
                    <option value="inter">Moderna (Inter)</option>
                    <option value="playfair">Elegante (Serif)</option>
                    <option value="montserrat">Forte (Montserrat)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna central — preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-2xl relative"
            style={{ border: '1px solid var(--border-color)' }}>
            <SlideRenderer slide={currentSlide} theme={theme} />
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-4 mt-4">
            <button onClick={() => setCurrentSlideIdx((i) => Math.max(0, i - 1))}
              disabled={currentSlideIdx === 0}
              className="text-sm px-3 py-1 rounded-lg disabled:opacity-30"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              ← Anterior
            </button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {currentSlideIdx + 1} / {slides.length}
            </span>
            <button onClick={() => setCurrentSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
              disabled={currentSlideIdx === slides.length - 1}
              className="text-sm px-3 py-1 rounded-lg disabled:opacity-30"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              Próximo →
            </button>
          </div>

          {shareUrl && (
            <div className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(0,212,200,0.10)', color: 'var(--accent)' }}>
              <Share2 size={12} /> Link público: {shareUrl}
            </div>
          )}
        </div>

        {/* Coluna direita — miniaturas */}
        <div className="w-40 shrink-0 flex flex-col gap-2 p-3 overflow-y-auto border-l"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {slides.map((slide, idx) => (
            <button key={slide.id} onClick={() => setCurrentSlideIdx(idx)}
              className="relative rounded-lg overflow-hidden transition-all"
              style={{
                border: idx === currentSlideIdx ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                aspectRatio: '16/9',
                opacity: slide.visible ? 1 : 0.4,
              }}>
              <div className="w-full h-full" style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: '500%', height: '500%' }}>
                <SlideRenderer slide={slide} theme={theme} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 text-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 8, padding: '1px 0' }}>
                {idx + 1}
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleSlideVisible(slide.id) }}
                className="absolute top-0.5 right-0.5 text-[8px]"
                style={{ color: slide.visible ? 'var(--accent)' : 'var(--text-muted)' }}>
                <Eye size={8} />
              </button>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
