'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Share2, Maximize2, ArrowLeft, Eye, EyeOff,
  ChevronLeft, ChevronRight, Sparkles, Palette, Type, MousePointer2,
  Wand2, Trash2,
} from 'lucide-react'
import {
  PresentationTemplate, Presentation, Slide, SlideElement,
  PresentationCustomization, isTextElement,
} from '@/lib/presentations/types'
import { ADMIN_PALETTES, getPalette } from '@/lib/presentations/admin-colors'
import SlideRenderer from './SlideRenderer'
import QuickEditPanel from './QuickEditPanel'
import AdvancedEditOverlay from './AdvancedEditOverlay'
import ImageUpload from './ImageUpload'
import Link from 'next/link'

interface Props {
  template: PresentationTemplate | null
  tenantId: string
  sellerId: string
  presentationId: string | null
  initialPresentation: Presentation | null
}

export default function PresentationEditor({
  template, tenantId, sellerId, presentationId, initialPresentation,
}: Props) {
  const router = useRouter()

  const initialSlides: Slide[] = initialPresentation?.slides
    || template?.slides
    || []

  const initialCustomization: PresentationCustomization = initialPresentation?.customization
    || template?.default_customization
    || {
      theme_id: 'teal-terminal',
      admin_id: 'custom',
      primary_override: null,
      secondary_override: null,
      dark_override: null,
      company_logo_url: null,
      seller_photo_url: null,
      company_name: '',
      seller_name: '',
      seller_phone: '',
      seller_email: '',
      font: 'inter',
      transition: 'slide',
      animation_speed: 1,
    }

  const [title, setTitle] = useState(
    initialPresentation?.title
    || `Proposta — ${template?.name || 'Nova'}`
  )
  const [slides, setSlides] = useState<Slide[]>(initialSlides)
  const [customization, setCustomization] = useState<PresentationCustomization>(initialCustomization)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(
    initialPresentation?.share_token
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${initialPresentation.share_token}`
      : null
  )
  const [activeTab, setActiveTab] = useState<'conteudo' | 'estilo'>('conteudo')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<string>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(1)

  const currentSlide = slides[currentIdx]
  const palette = getPalette(customization.admin_id)

  // ===========================================================================
  //  Atualização de scale (para o react-moveable)
  // ===========================================================================
  useEffect(() => {
    function update() {
      if (!canvasRef.current) return
      const inner = canvasRef.current.querySelector<HTMLDivElement>('.absolute[style*="transform"]')
      if (!inner) return
      const m = inner.style.transform.match(/scale\(([^)]+)\)/)
      if (m) setCanvasScale(parseFloat(m[1]))
    }
    update()
    const ro = new ResizeObserver(update)
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [currentIdx])

  // ===========================================================================
  //  Edição inline
  // ===========================================================================
  function handleElementClick(el: SlideElement) {
    setSelectedId(el.id)
    if (advancedMode) return // Modo avançado: não entrar em edição inline (só seleção)

    // Modo simples: clica em texto/badge/stat → entra em edição
    if (isTextElement(el)) {
      setEditingId(el.id)
      setEditingDraft(el.content || '')
    } else if (el.type === 'badge') {
      setEditingId(el.id)
      setEditingDraft(el.text || '')
    } else if (el.type === 'stat-card') {
      setEditingId(el.id)
      setEditingDraft(el.value || '')
    } else if (el.type === 'list-item') {
      setEditingId(el.id)
      setEditingDraft(el.text || '')
    }
  }

  function commitDraft() {
    if (!editingId) return
    const id = editingId
    const value = editingDraft
    setSlides((prev) =>
      prev.map((s, i) => i !== currentIdx ? s : ({
        ...s,
        elements: s.elements.map((el) => {
          if (el.id !== id) return el
          if (isTextElement(el)) return { ...el, content: value }
          if (el.type === 'badge') return { ...el, text: value }
          if (el.type === 'stat-card') return { ...el, value }
          if (el.type === 'list-item') return { ...el, text: value }
          return el
        }),
      }))
    )
    setEditingId(null)
    setEditingDraft('')
  }

  // ESC ou Enter → confirma
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!editingId) return
      if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault()
        commitDraft()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, editingDraft])

  // ===========================================================================
  //  Atualizar campo (chamado pelo QuickEditPanel)
  // ===========================================================================
  function updateField(elementId: string, fieldKey: string, value: string) {
    setSlides((prev) =>
      prev.map((s, i) => i !== currentIdx ? s : ({
        ...s,
        elements: s.elements.map((el) => {
          if (el.id !== elementId) return el
          if (isTextElement(el) && el.fieldKey === fieldKey) return { ...el, content: value }
          if (el.type === 'stat-card') {
            if (el.fieldKeyValue === fieldKey) return { ...el, value }
            if (el.fieldKeyLabel === fieldKey) return { ...el, label: value }
          }
          if (el.type === 'list-item' && el.fieldKey === fieldKey) return { ...el, text: value }
          if (el.type === 'comparison') {
            if (el.fieldKeyValue === fieldKey) return { ...el, value }
            if (el.fieldKeyDesc === fieldKey) return { ...el, description: value }
          }
          if (el.type === 'timeline-step') {
            if (el.fieldKeyTitle === fieldKey) return { ...el, title: value }
            if (el.fieldKeyDesc === fieldKey) return { ...el, description: value }
          }
          return el
        }),
      }))
    )
  }

  // ===========================================================================
  //  Transformação (modo avançado)
  // ===========================================================================
  function transformElement(id: string, t: { x?: number; y?: number; w?: number; h?: number; rotation?: number }) {
    setSlides((prev) =>
      prev.map((s, i) => i !== currentIdx ? s : ({
        ...s,
        elements: s.elements.map((el) => el.id !== id ? el : { ...el, ...t } as SlideElement),
      }))
    )
  }

  function deleteElement(id: string) {
    setSlides((prev) =>
      prev.map((s, i) => i !== currentIdx ? s : ({
        ...s,
        elements: s.elements.filter((el) => el.id !== id),
      }))
    )
    setSelectedId(null)
  }

  function toggleSlideVisibility(slideIdx: number) {
    setSlides((prev) => prev.map((s, i) => i === slideIdx ? { ...s, visible: !s.visible } : s))
  }

  // ===========================================================================
  //  Mudança de estilo: detecta troca de foto/logo e propaga nos slides
  // ===========================================================================
  function handleStyleChange(next: PresentationCustomization) {
    if (next.seller_photo_url !== customization.seller_photo_url) {
      setSlides((prev) => prev.map((s) => ({
        ...s,
        elements: s.elements.map((el) => {
          if (el.type === 'image' && el.fieldKey === 'seller_photo') {
            return { ...el, src: next.seller_photo_url }
          }
          return el
        }),
      })))
    }
    if (next.company_logo_url !== customization.company_logo_url) {
      setSlides((prev) => prev.map((s) => ({
        ...s,
        elements: s.elements.map((el) => {
          if (el.type === 'logo-company') return { ...el, src: next.company_logo_url }
          return el
        }),
      })))
    }
    setCustomization(next)
  }

  // ===========================================================================
  //  Salvar
  // ===========================================================================
  async function handleSave(status: 'rascunho' | 'finalizada' = 'rascunho') {
    setSaving(true)
    const body = {
      title, slides, customization, status,
      tenant_id: tenantId, seller_id: sellerId,
      template_id: template?.id || null,
      schema_version: 2,
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
    if (!presentationId) {
      await handleSave('rascunho')
      return
    }
    const res = await fetch(`/api/presentations/${presentationId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId }),
    })
    const data = await res.json()
    if (data.share_url) {
      setShareUrl(data.share_url)
      try { await navigator.clipboard.writeText(data.share_url) } catch {}
    }
  }

  function handlePresent() {
    if (!presentationId) {
      alert('Salve a apresentação primeiro.')
      return
    }
    window.open(`/dashboard/apresentacoes/${presentationId}/apresentar`, '_blank')
  }

  if (!currentSlide) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
        Apresentação sem slides.
      </div>
    )
  }

  // ===========================================================================
  //  Render
  // ===========================================================================

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 overflow-hidden">
      {/* TopBar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
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

        {/* Toggle modo avançado */}
        <button
          onClick={() => { setAdvancedMode((v) => !v); setEditingId(null) }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: advancedMode ? 'rgba(0,212,200,0.15)' : 'var(--bg-tertiary)',
            color: advancedMode ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title={advancedMode ? 'Modo avançado: arrastar/redimensionar' : 'Edição rápida: clique e edite'}
        >
          {advancedMode ? <Wand2 size={12} /> : <MousePointer2 size={12} />}
          {advancedMode ? 'Avançado' : 'Edição rápida'}
        </button>

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

      {/* 3 colunas */}
      <div className="flex flex-1 min-h-0">
        {/* SIDEBAR ESQUERDA */}
        <div className="w-72 shrink-0 flex flex-col border-r overflow-hidden"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
            <button onClick={() => setActiveTab('conteudo')}
              className="flex-1 py-2.5 text-xs font-medium flex items-center gap-1.5 justify-center"
              style={{
                borderBottom: activeTab === 'conteudo' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'conteudo' ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              <Type size={12} /> Conteúdo
            </button>
            <button onClick={() => setActiveTab('estilo')}
              className="flex-1 py-2.5 text-xs font-medium flex items-center gap-1.5 justify-center"
              style={{
                borderBottom: activeTab === 'estilo' ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === 'estilo' ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              <Palette size={12} /> Estilo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'conteudo' && (
              <QuickEditPanel
                slide={currentSlide}
                onElementUpdate={updateField}
              />
            )}

            {activeTab === 'estilo' && (
              <StylePanel
                customization={customization}
                onChange={handleStyleChange}
              />
            )}
          </div>
        </div>

        {/* CANVAS */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}>

          {/* Indicador da paleta atual */}
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: palette.primary }} />
            {palette.name}
          </div>

          <div
            ref={canvasRef}
            onClick={(e) => {
              // Clique no fundo do canvas → cancela seleção/edição
              if (e.target === e.currentTarget) {
                if (editingId) commitDraft()
                else setSelectedId(null)
              }
            }}
            className="relative rounded-xl overflow-hidden shadow-2xl"
            style={{
              width: '85%', maxWidth: 1100, aspectRatio: '16/9',
              border: '1px solid var(--border-color)',
            }}
          >
            <SlideRenderer
              slide={currentSlide}
              customization={customization}
              animate={!editingId && !advancedMode}
              editable={!advancedMode}
              editingId={editingId}
              editingDraft={editingId ? editingDraft : null}
              selectedId={selectedId}
              onElementClick={handleElementClick}
              onDraftChange={setEditingDraft}
            />

            {advancedMode && (
              <AdvancedEditOverlay
                selectedElement={currentSlide.elements.find((e) => e.id === selectedId) || null}
                scale={canvasScale}
                canvasContainer={canvasRef.current}
                onTransform={transformElement}
                onDelete={deleteElement}
              />
            )}
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setSelectedId(null); setEditingId(null) }}
              disabled={currentIdx === 0}
              className="p-2 rounded-lg disabled:opacity-30 transition-colors"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {currentIdx + 1} / {slides.length}
            </span>
            <button onClick={() => { setCurrentIdx((i) => Math.min(slides.length - 1, i + 1)); setSelectedId(null); setEditingId(null) }}
              disabled={currentIdx === slides.length - 1}
              className="p-2 rounded-lg disabled:opacity-30 transition-colors"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Hint */}
          <div className="mt-3 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            {advancedMode
              ? 'Clique num elemento para selecionar. Arraste para mover, redimensione, gire. Setas para ajuste fino. Delete para apagar.'
              : 'Clique em qualquer texto do slide para editar diretamente. Enter para confirmar, ESC para cancelar.'}
          </div>

          {shareUrl && (
            <div className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(0,212,200,0.10)', color: 'var(--accent)' }}>
              <Share2 size={12} /> {shareUrl}
            </div>
          )}
        </div>

        {/* SIDEBAR DIREITA — thumbnails */}
        <div className="w-44 shrink-0 flex flex-col gap-2 p-3 overflow-y-auto border-l"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {slides.map((s, idx) => (
            <div key={s.id} className="relative">
              <button
                onClick={() => { setCurrentIdx(idx); setSelectedId(null); setEditingId(null) }}
                className="relative rounded-lg overflow-hidden transition-all w-full"
                style={{
                  border: idx === currentIdx ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                  aspectRatio: '16/9',
                  opacity: s.visible ? 1 : 0.4,
                }}
              >
                <SlideRenderer
                  slide={s}
                  customization={customization}
                  animate={false}
                />
              </button>
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {idx + 1}. {s.title}
                </span>
                <button onClick={() => toggleSlideVisibility(idx)}
                  title={s.visible ? 'Ocultar slide' : 'Exibir slide'}
                  style={{ color: s.visible ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {s.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  Painel Estilo
// ============================================================================

function StylePanel({
  customization, onChange,
}: {
  customization: PresentationCustomization
  onChange: (c: PresentationCustomization) => void
}) {
  const set = <K extends keyof PresentationCustomization>(k: K, v: PresentationCustomization[K]) =>
    onChange({ ...customization, [k]: v })

  const palette = getPalette(customization.admin_id)

  return (
    <div className="flex flex-col gap-4">
      {/* Administradora */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Administradora
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {ADMIN_PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => set('admin_id', p.id)}
              className="text-[10px] py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all"
              style={{
                border: customization.admin_id === p.id ? `2px solid ${p.primary}` : '2px solid var(--border-color)',
                backgroundColor: customization.admin_id === p.id ? `${p.primary}11` : 'var(--bg-tertiary)',
              }}
            >
              <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 9 }}>{p.short}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Toda a apresentação adota a paleta da administradora selecionada.
        </p>
      </div>

      {/* Override de cor primária */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Cor principal
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customization.primary_override || palette.primary}
            onChange={(e) => set('primary_override', e.target.value)}
            className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
          />
          <input
            className="input-pg flex-1 text-xs"
            value={customization.primary_override || palette.primary}
            onChange={(e) => set('primary_override', e.target.value || null)}
          />
          {customization.primary_override && (
            <button onClick={() => set('primary_override', null)}
              className="text-xs underline" style={{ color: 'var(--text-muted)' }}>
              auto
            </button>
          )}
        </div>
      </div>

      {/* Fonte */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Fonte</label>
        <select
          className="input-pg text-xs"
          value={customization.font}
          onChange={(e) => set('font', e.target.value as PresentationCustomization['font'])}
        >
          <option value="inter">Moderna (Inter)</option>
          <option value="playfair">Elegante (Playfair Display)</option>
          <option value="montserrat">Forte (Montserrat)</option>
          <option value="poppins">Amigável (Poppins)</option>
        </select>
      </div>

      {/* Transição */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Transição entre slides
        </label>
        <select
          className="input-pg text-xs"
          value={customization.transition}
          onChange={(e) => set('transition', e.target.value as PresentationCustomization['transition'])}
        >
          <option value="fade">Suave (Fade)</option>
          <option value="slide">Deslize</option>
          <option value="zoom">Zoom</option>
          <option value="flip">Virar</option>
          <option value="reveal">Cortina</option>
        </select>
      </div>

      {/* Velocidade */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Velocidade das animações
        </label>
        <input
          type="range"
          min={0.5} max={2} step={0.1}
          value={customization.animation_speed}
          onChange={(e) => set('animation_speed', parseFloat(e.target.value))}
        />
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {customization.animation_speed.toFixed(1)}× — {customization.animation_speed < 0.8 ? 'lenta' : customization.animation_speed > 1.3 ? 'rápida' : 'normal'}
        </span>
      </div>

      <div className="border-t pt-3 mt-1" style={{ borderColor: 'var(--border-color)' }}>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: 2 }}>
          Empresa / Vendedor
        </p>
        <div className="flex flex-col gap-3">
          <ImageUpload
            value={customization.seller_photo_url}
            onChange={(url) => set('seller_photo_url', url)}
            kind="photo"
            label="Foto do vendedor"
            shape="circle"
            size={64}
          />
          <ImageUpload
            value={customization.company_logo_url}
            onChange={(url) => set('company_logo_url', url)}
            kind="logo"
            label="Logo da empresa"
            shape="rect"
            size={56}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Nome da empresa</label>
            <input className="input-pg text-xs" value={customization.company_name}
              onChange={(e) => set('company_name', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Nome do vendedor</label>
            <input className="input-pg text-xs" value={customization.seller_name}
              onChange={(e) => set('seller_name', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>WhatsApp</label>
            <input className="input-pg text-xs" value={customization.seller_phone}
              onChange={(e) => set('seller_phone', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input className="input-pg text-xs" value={customization.seller_email}
              onChange={(e) => set('seller_email', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
