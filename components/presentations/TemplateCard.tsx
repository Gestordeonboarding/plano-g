'use client'

import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import { PresentationTemplate, FieldDef } from '@/lib/presentations/types'
import SlideRenderer from './SlideRenderer'
import { SlideStage } from './SlideStage'
import { generatePreviewValues } from '@/lib/presentations/previewValues'
import { processFieldValues } from '@/lib/presentations/interpolate'
import { useMemo, useState } from 'react'

const CATEGORY_LABEL: Record<string, string> = {
  imovel: 'Imóvel',
  auto: 'Auto',
  moto: 'Moto',
  servicos: 'Serviços',
  investimento: 'Investimento',
  universal: 'Universal',
}

export default function TemplateCard({ template }: { template: PresentationTemplate }) {
  const [hoverIdx, setHoverIdx] = useState(0)

  const fields = (template.fields ?? []) as FieldDef[]
  const previewValues = useMemo(() => {
    const raw = generatePreviewValues(fields)
    return processFieldValues(raw, fields)
  }, [fields])

  const accent = template.theme?.primary || 'var(--g-accent)'
  const previewSlide = template.slides[hoverIdx] || template.slides[0]

  return (
    <div className="card-pg overflow-hidden flex flex-col group">
      {/* Thumbnail real escalado — sem placeholders literais */}
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => template.slides.length > 1 && setHoverIdx(1)}
        onMouseLeave={() => setHoverIdx(0)}
      >
        <SlideStage mode="thumbnail">
          <SlideRenderer slide={previewSlide} theme={template.theme} values={previewValues} />
        </SlideStage>

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span
            className="text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
          >
            <Sparkles size={10} /> {template.slides.length} slides
          </span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 pointer-events-none">
          {template.slides.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: i === hoverIdx ? accent : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm" style={{ color: 'var(--g-text-primary)' }}>
            {template.name}
          </p>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            {CATEGORY_LABEL[template.category] || template.category}
          </span>
        </div>

        <p className="text-xs line-clamp-2" style={{ color: 'var(--g-text-muted)' }}>
          {template.description}
        </p>

        {template.target_audience && (
          <p
            className="text-[10px] mt-1"
            style={{ color: 'var(--g-text-ghost)', fontStyle: 'italic' }}
          >
            Para: {template.target_audience}
          </p>
        )}

        <Link
          href={`/dashboard/apresentacoes/nova?template=${template.id}`}
          className="btn-primary text-sm text-center mt-2 flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Usar este template
        </Link>
      </div>
    </div>
  )
}
