'use client'

import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import { PresentationTemplate } from '@/lib/presentations/types'
import SlideRenderer from './SlideRenderer'
import { getPalette } from '@/lib/presentations/admin-colors'
import { useState } from 'react'

const CATEGORY_LABEL: Record<string, string> = {
  imovel: 'Imóvel',
  auto: 'Auto',
  servicos: 'Serviços',
  investimento: 'Investimento',
  universal: 'Universal',
}

export default function TemplateCard({ template }: { template: PresentationTemplate }) {
  const [hoverIdx, setHoverIdx] = useState(0)

  const palette = getPalette(template.default_customization.admin_id)
  const accent = template.default_customization.primary_override || palette.primary
  const previewSlide = template.slides[hoverIdx] || template.slides[0]

  return (
    <div className="card-pg overflow-hidden flex flex-col group">
      {/* Preview com thumbnail real do primeiro slide */}
      <div
        className="relative aspect-video overflow-hidden cursor-pointer"
        onMouseEnter={() => setHoverIdx(1)}
        onMouseLeave={() => setHoverIdx(0)}
      >
        <SlideRenderer
          slide={previewSlide}
          customization={template.default_customization}
          animate={false}
        />
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}>
            <Sparkles size={10} /> {template.slides.length} slides
          </span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1">
          {template.slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i === hoverIdx ? accent : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {template.name}
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
            style={{ backgroundColor: `${accent}22`, color: accent }}>
            {CATEGORY_LABEL[template.category] || template.category}
          </span>
        </div>
        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {template.description || `Apresentação no estilo ${template.name}`}
        </p>
        <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
          {palette.name} · {template.default_customization.font}
        </div>
        <Link href={`/dashboard/apresentacoes/nova?template=${template.id}`}
          className="btn-primary text-sm text-center mt-2 flex items-center justify-center gap-2">
          <Plus size={14} /> Usar este template
        </Link>
      </div>
    </div>
  )
}
