'use client'

import { Slide } from '@/lib/presentations/types'

interface Props {
  slide: Slide
  theme: { accent_color: string; bg_color: string; font: string }
  scale?: number
}

const FONT_CLASS: Record<string, string> = {
  inter: 'font-sans',
  playfair: 'font-serif',
  montserrat: 'font-sans',
}

export default function SlideRenderer({ slide, theme, scale = 1 }: Props) {
  const accent = theme.accent_color || '#00D4C8'
  const bg = slide.background === 'accent' ? accent : slide.background === 'image' ? '#0D1F1E' : '#0D1F1E'
  const textColor = slide.background === 'accent' ? '#0D1F1E' : '#E8F5F4'
  const fontClass = FONT_CLASS[theme.font] || 'font-sans'

  const getValue = (key: string, fallback?: string) => {
    const f = slide.editable_fields.find((f) => f.key === key)
    return f?.value || f?.placeholder || fallback || ''
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col ${fontClass}`}
      style={{ backgroundColor: bg, color: textColor, transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
      {slide.type === 'cover' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="w-12 h-1 rounded-full mb-4" style={{ backgroundColor: slide.background === 'accent' ? textColor : accent }} />
          <h1 className="text-4xl font-bold leading-tight">{getValue('client_name', 'Nome do Cliente')}</h1>
          <p className="text-xl opacity-80">{getValue('subtitle', 'Proposta de Consórcio') || getValue('tagline') || getValue('dream') || getValue('car_model') || getValue('service') || getValue('vehicle')}</p>
          {getValue('company_name') && <p className="text-sm opacity-60 mt-2">{getValue('company_name')}</p>}
          {getValue('company') && <p className="text-sm opacity-60 mt-2">{getValue('company')}</p>}
        </div>
      )}

      {slide.type === 'numbers' && (
        <div className="flex-1 flex flex-col justify-center p-10">
          <h2 className="text-2xl font-bold mb-8" style={{ color: accent }}>{slide.title}</h2>
          <div className="grid grid-cols-3 gap-6">
            {slide.editable_fields.map((f) => (
              <div key={f.key} className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-3xl font-bold mb-1" style={{ color: accent }}>{f.value || f.placeholder}</p>
                <p className="text-xs opacity-60">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'solution' && (
        <div className="flex-1 flex flex-col justify-center p-10">
          <h2 className="text-2xl font-bold mb-8" style={{ color: accent }}>{slide.title}</h2>
          <div className="grid grid-cols-3 gap-4">
            {slide.editable_fields.map((f, i) => (
              <div key={f.key} className="p-4 rounded-xl flex flex-col gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: accent, color: '#0D1F1E' }}>
                  {i + 1}
                </div>
                <p className="text-sm font-medium">{f.value || f.placeholder}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'problem' && (
        <div className="flex-1 flex flex-col justify-center p-10 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6" style={{ color: accent }}>{slide.title}</h2>
          {slide.editable_fields.map((f) => (
            <p key={f.key} className="text-lg opacity-80 leading-relaxed">{f.value || f.placeholder}</p>
          ))}
        </div>
      )}

      {slide.type === 'comparison' && (
        <div className="flex-1 flex flex-col justify-center p-10">
          <h2 className="text-2xl font-bold mb-8" style={{ color: accent }}>{slide.title}</h2>
          <div className="grid grid-cols-2 gap-6">
            {slide.editable_fields.map((f, i) => (
              <div key={f.key} className="p-6 rounded-xl text-center"
                style={{ backgroundColor: i === 0 ? 'rgba(255,92,92,0.15)' : `${accent}22` }}>
                <p className="text-xs mb-2 opacity-60">{f.label}</p>
                <p className="text-3xl font-bold" style={{ color: i === 0 ? '#FF5C5C' : accent }}>
                  {f.value || f.placeholder}
                </p>
                <p className="text-xs mt-2 opacity-60">{i === 0 ? '❌ Financiamento' : '✅ Consórcio'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'timeline' && (
        <div className="flex-1 flex flex-col justify-center p-10">
          <h2 className="text-2xl font-bold mb-10" style={{ color: accent }}>{slide.title}</h2>
          <div className="flex items-center gap-0">
            {slide.editable_fields.map((f, i) => (
              <div key={f.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: accent, color: '#0D1F1E' }}>{i + 1}</div>
                  <p className="text-xs text-center">{f.value || f.placeholder}</p>
                </div>
                {i < slide.editable_fields.length - 1 && (
                  <div className="h-0.5 flex-1" style={{ backgroundColor: accent, opacity: 0.4 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.type === 'testimonial' && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: accent, color: '#0D1F1E' }}>
            {(getValue('client', 'C') || getValue('name', 'C'))[0]}
          </div>
          <blockquote className="text-lg italic opacity-80 max-w-lg">
            {getValue('testimonial', '"Depoimento do cliente..."') || getValue('story', '"Uma história incrível..."')}
          </blockquote>
          <p className="font-semibold" style={{ color: accent }}>
            — {getValue('client', 'Nome do cliente') || getValue('name', 'Nome')}
          </p>
        </div>
      )}

      {slide.type === 'about' && (
        <div className="flex-1 flex flex-col justify-center p-10 gap-6">
          <h2 className="text-2xl font-bold" style={{ color: accent }}>{slide.title}</h2>
          {slide.editable_fields.map((f) => (
            <p key={f.key} className="opacity-80">{f.value || f.placeholder}</p>
          ))}
        </div>
      )}

      {slide.type === 'cta' && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-6">
          <h2 className="text-3xl font-bold" style={{ color: slide.background === 'accent' ? textColor : accent }}>
            {getValue('cta_text', 'Vamos começar!') || getValue('cta', 'Vamos começar!')}
          </h2>
          <div className="flex flex-col gap-2 mt-4">
            {getValue('phone') && <p className="text-lg font-semibold">{getValue('phone')}</p>}
            {getValue('email') && <p className="opacity-70">{getValue('email')}</p>}
            {getValue('site') && <p className="opacity-70">{getValue('site')}</p>}
          </div>
        </div>
      )}

      {slide.type === 'custom' && (
        <div className="flex-1 flex flex-col justify-center p-10">
          <h2 className="text-2xl font-bold mb-4" style={{ color: accent }}>{slide.title}</h2>
          {slide.editable_fields.map((f) => (
            <p key={f.key} className="opacity-80 whitespace-pre-wrap">{f.value || f.placeholder}</p>
          ))}
        </div>
      )}

      {/* Número do slide */}
      <div className="absolute bottom-4 right-6 text-xs opacity-30">{slide.type}</div>
    </div>
  )
}
