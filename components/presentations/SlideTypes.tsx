/**
 * Componentes individuais por tipo de slide.
 *
 * Cada componente recebe:
 *   - slide: { id, type, layout, background, title }
 *   - theme: { primary, background, font, style }
 *   - values: FieldValues do briefing (já processados/formatados)
 *
 * Tipografia em px fixo relativo ao canvas 1280×720 (SlideStage escala).
 * Layouts dentro de cada tipo são variações do mesmo conceito.
 */

import { Slide, PresentationTheme, FieldValues, SLIDE_WIDTH, SLIDE_HEIGHT } from '@/lib/presentations/types'
import { interpolate } from '@/lib/presentations/interpolate'

// ============================================================================
//  Constantes de tipografia (px relativos ao canvas 1280×720)
// ============================================================================

const FONT = {
  xl: 56,        // título principal capa
  lg: 40,        // títulos de seção
  md: 28,        // subtítulos / labels
  body: 18,      // corpo de texto
  caption: 14,   // legendas
  small: 12,     // metadados
} as const

const SPACING = {
  outer: 80,     // padding da borda do slide
  card: 32,      // padding interno de cards
  gap: 24,       // gap entre elementos
} as const

// ============================================================================
//  Props compartilhadas
// ============================================================================

export interface SlideTypeProps {
  slide: Slide
  theme: PresentationTheme
  values: FieldValues
}

// ============================================================================
//  Helpers
// ============================================================================

function bgColor(slide: Slide, theme: PresentationTheme): string {
  return slide.background === 'accent' ? theme.primary : theme.background
}

function textColor(slide: Slide): string {
  // No fundo accent, texto principal preto/escuro pra contraste
  return slide.background === 'accent' ? '#0a1512' : '#dff0ed'
}

function accentTextColor(slide: Slide, theme: PresentationTheme): string {
  // No fundo accent, texto destaque branco; no fundo dark, texto destaque accent
  return slide.background === 'accent' ? '#ffffff' : theme.primary
}

function FooterLine({ theme, slide }: { theme: PresentationTheme; slide: Slide }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 80,
        height: 2,
        background: slide.background === 'accent' ? '#0a1512' : theme.primary,
        opacity: 0.8,
      }}
    />
  )
}

function pickValue(values: FieldValues, ...keys: string[]): string {
  for (const k of keys) {
    if (values[k]?.trim()) return values[k]
  }
  return ''
}

// ============================================================================
//  Wrapper base de slide
// ============================================================================

function SlideFrame({
  slide,
  theme,
  children,
  showFooter = true,
}: {
  slide: Slide
  theme: PresentationTheme
  children: React.ReactNode
  showFooter?: boolean
}) {
  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        background: bgColor(slide, theme),
        color: textColor(slide),
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        padding: SPACING.outer,
        boxSizing: 'border-box',
      }}
    >
      {children}
      {showFooter && <FooterLine theme={theme} slide={slide} />}
    </div>
  )
}

// ============================================================================
//  1. COVER — capa
// ============================================================================

export function SlideCover({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)
  const clientName = pickValue(values, 'client_name', 'contact_name', 'company_client_name')
  const sellerName = pickValue(values, 'seller_name')
  const companyName = pickValue(values, 'company_name')

  return (
    <SlideFrame slide={slide} theme={theme}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.gap,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: FONT.caption,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: accentTextColor(slide, theme),
            opacity: 0.8,
          }}
        >
          {companyName || 'Proposta exclusiva'}
        </div>

        <div
          style={{
            fontSize: FONT.xl,
            fontWeight: 700,
            lineHeight: 1.1,
            color: accentTextColor(slide, theme),
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        {clientName && (
          <div
            style={{
              fontSize: FONT.md,
              opacity: 0.85,
              marginTop: SPACING.gap,
            }}
          >
            Para: <strong>{clientName}</strong>
          </div>
        )}

        {sellerName && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              fontSize: FONT.caption,
              opacity: 0.65,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Apresentado por {sellerName}
          </div>
        )}
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  2. PROBLEM — dor do cliente
// ============================================================================

export function SlideProblem({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)

  if (slide.layout === 'split') {
    return (
      <SlideFrame slide={slide} theme={theme}>
        <div style={{ display: 'flex', gap: SPACING.gap * 2, height: '100%', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: FONT.caption,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: theme.primary,
                marginBottom: 16,
              }}
            >
              O problema
            </div>
            <div style={{ fontSize: FONT.lg, fontWeight: 700, lineHeight: 1.15, marginBottom: 24 }}>
              {title}
            </div>
            <div style={{ fontSize: FONT.body, opacity: 0.8, lineHeight: 1.5 }}>
              A maioria das pessoas compra o sonho do jeito mais caro: parcelando pelo banco com juros
              que dobram o valor original. Existe um caminho mais inteligente.
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.primary}30`,
              borderRadius: 12,
              padding: SPACING.card,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ fontSize: FONT.caption, opacity: 0.6, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Exemplo real
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: FONT.body, opacity: 0.7 }}>Crédito</span>
              <span style={{ fontSize: FONT.md, fontWeight: 700 }}>R$ 300.000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: FONT.body, opacity: 0.7 }}>Total pago em 30 anos</span>
              <span style={{ fontSize: FONT.md, fontWeight: 700, color: '#e24b4a' }}>R$ 1.150.000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: FONT.body, opacity: 0.7 }}>Juros pagos</span>
              <span style={{ fontSize: FONT.md, fontWeight: 700, color: '#e24b4a' }}>R$ 850.000</span>
            </div>
          </div>
        </div>
      </SlideFrame>
    )
  }

  // Layout centered (default)
  return (
    <SlideFrame slide={slide} theme={theme}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: SPACING.gap,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            fontSize: FONT.caption,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: theme.primary,
          }}
        >
          O problema
        </div>
        <div style={{ fontSize: FONT.lg, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  3. EDUCATION — explica conceito
// ============================================================================

export function SlideEducation({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)

  if (slide.layout === 'cards') {
    // 3 cards explicativos
    const cards = [
      { num: '01', t: 'Um grupo de pessoas', d: 'Centenas de pessoas com objetivo parecido — comprar o mesmo tipo de bem.' },
      { num: '02', t: 'Cota mensal sem juros', d: 'Você paga uma parcela acessível. Sem juros — apenas a taxa de administração.' },
      { num: '03', t: 'Contemplação', d: 'A cada mês, alguém do grupo é contemplado. Sorteio ou lance. Sua hora vai chegar.' },
    ]
    return (
      <SlideFrame slide={slide} theme={theme}>
        <div style={{ fontSize: FONT.md, fontWeight: 600, marginBottom: 8, color: theme.primary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Como funciona
        </div>
        <div style={{ fontSize: FONT.lg, fontWeight: 700, marginBottom: SPACING.gap * 1.5 }}>{title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SPACING.gap }}>
          {cards.map((c) => (
            <div
              key={c.num}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${theme.primary}20`,
                borderRadius: 12,
                padding: SPACING.card,
                minHeight: 280,
              }}
            >
              <div style={{ fontSize: FONT.lg, fontWeight: 700, color: theme.primary, marginBottom: 16 }}>
                {c.num}
              </div>
              <div style={{ fontSize: FONT.md, fontWeight: 600, marginBottom: 12 }}>{c.t}</div>
              <div style={{ fontSize: FONT.body, opacity: 0.75, lineHeight: 1.5 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </SlideFrame>
    )
  }

  if (slide.layout === 'split') {
    return (
      <SlideFrame slide={slide} theme={theme}>
        <div style={{ display: 'flex', gap: SPACING.gap * 2, height: '100%', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: FONT.caption, color: theme.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
              Como funciona
            </div>
            <div style={{ fontSize: FONT.lg, fontWeight: 700, lineHeight: 1.2, marginBottom: 24 }}>{title}</div>
            <div style={{ fontSize: FONT.body, opacity: 0.8, lineHeight: 1.6 }}>
              Mensalmente, todos os participantes do grupo se reúnem em assembleia. Um ou mais são
              contemplados — sorteio ou lance. Quem é contemplado recebe a carta de crédito e pode
              comprar o bem imediatamente, continuando a pagar normalmente.
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Sem juros', 'Parcelas até 70% menores', 'Crédito corrigido', 'Lance acelera contemplação'].map((s) => (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 24px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${theme.primary}25`,
                  borderRadius: 10,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.primary }} />
                <div style={{ fontSize: FONT.body, fontWeight: 500 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </SlideFrame>
    )
  }

  // centered (default)
  return (
    <SlideFrame slide={slide} theme={theme}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: FONT.caption, color: theme.primary, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          Como funciona
        </div>
        <div style={{ fontSize: FONT.lg, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  4. COMPARISON — consórcio vs financiamento
// ============================================================================

export function SlideComparison({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)
  const credit = pickValue(values, 'credit_value') || 'R$ 300.000'
  const bankInst = pickValue(values, 'bank_installment') || 'R$ 3.200'
  const consortInst = pickValue(values, 'consortium_installment') || 'R$ 1.400'
  const bankRate = pickValue(values, 'bank_rate') || '12,5'

  return (
    <SlideFrame slide={slide} theme={theme}>
      <div style={{ fontSize: FONT.md, fontWeight: 700, color: theme.primary, marginBottom: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Comparativo
      </div>
      <div style={{ fontSize: FONT.lg, fontWeight: 700, marginBottom: SPACING.gap * 1.5 }}>{title}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.gap }}>
        {/* Financiamento */}
        <div
          style={{
            background: 'rgba(226,75,74,0.07)',
            border: '1px solid rgba(226,75,74,0.3)',
            borderRadius: 12,
            padding: SPACING.card,
          }}
        >
          <div style={{ fontSize: FONT.caption, color: '#e24b4a', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            Financiamento bancário
          </div>
          <div style={{ fontSize: FONT.md, fontWeight: 700, marginBottom: 24 }}>Caro e demorado</div>

          {[
            ['Crédito desejado', credit],
            ['Parcela mensal', bankInst],
            [`Juros (${bankRate}% a.a.)`, 'R$ 850.000'],
            ['Total ao final', 'R$ 1.150.000'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: FONT.body, opacity: 0.75 }}>{k}</span>
              <span style={{ fontSize: FONT.body, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Consórcio */}
        <div
          style={{
            background: `${theme.primary}10`,
            border: `1px solid ${theme.primary}50`,
            borderRadius: 12,
            padding: SPACING.card,
          }}
        >
          <div style={{ fontSize: FONT.caption, color: theme.primary, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            Consórcio
          </div>
          <div style={{ fontSize: FONT.md, fontWeight: 700, marginBottom: 24 }}>Inteligente e econômico</div>

          {[
            ['Crédito desejado', credit],
            ['Parcela mensal', consortInst],
            ['Juros', 'Zero — só taxa adm.'],
            ['Total ao final', credit],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: FONT.body, opacity: 0.75 }}>{k}</span>
              <span style={{ fontSize: FONT.body, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  5. NUMBERS — KPIs / simulação
// ============================================================================

export function SlideNumbers({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)

  const credit = pickValue(values, 'credit_value', 'new_credit', 'total_credit', 'unit_credit')
  const installment = pickValue(values, 'monthly_installment', 'new_installment', 'consortium_installment')
  const term = pickValue(values, 'timeline', 'projection_years') || '180 meses'
  const assetType = pickValue(values, 'asset_type') || 'Imóvel'

  const kpis = [
    { label: 'Crédito total', value: credit || 'R$ 300.000', emphasis: true },
    { label: 'Parcela mensal', value: installment || 'R$ 1.400', emphasis: true },
    { label: 'Prazo', value: term, emphasis: false },
    { label: 'Tipo do bem', value: assetType, emphasis: false },
  ]

  return (
    <SlideFrame slide={slide} theme={theme}>
      <div style={{ fontSize: FONT.md, fontWeight: 700, color: slide.background === 'accent' ? '#0a1512' : theme.primary, marginBottom: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Sua simulação
      </div>
      <div style={{ fontSize: FONT.lg, fontWeight: 700, marginBottom: SPACING.gap * 1.5 }}>{title}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.gap }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              padding: SPACING.card,
              background: slide.background === 'accent' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${slide.background === 'accent' ? 'rgba(255,255,255,0.2)' : theme.primary + '30'}`,
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: FONT.caption, opacity: 0.7, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              {k.label}
            </div>
            <div
              style={{
                fontSize: k.emphasis ? 52 : FONT.lg,
                fontWeight: 700,
                lineHeight: 1.05,
                color: slide.background === 'accent' ? '#0a1512' : '#ffffff',
              }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  6. TIMELINE — linha do tempo
// ============================================================================

export function SlideTimeline({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)

  const steps = [
    { num: '01', t: 'Adesão', d: 'Você entra no grupo certo pro seu perfil' },
    { num: '02', t: 'Pagamento', d: 'Parcelas mensais sem juros' },
    { num: '03', t: 'Assembleia', d: 'Sorteio + lance todo mês' },
    { num: '04', t: 'Contemplação', d: 'Carta de crédito liberada' },
    { num: '05', t: 'Uso', d: 'Compra do seu bem dos sonhos' },
  ]

  return (
    <SlideFrame slide={slide} theme={theme}>
      <div style={{ fontSize: FONT.md, fontWeight: 700, color: theme.primary, marginBottom: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Linha do tempo
      </div>
      <div style={{ fontSize: FONT.lg, fontWeight: 700, marginBottom: SPACING.gap * 2 }}>{title}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, position: 'relative' }}>
        {/* linha horizontal de conexão */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            height: 2,
            background: `${theme.primary}40`,
            zIndex: 0,
          }}
        />
        {steps.map((s) => (
          <div key={s.num} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: theme.primary,
                color: '#0a1512',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: FONT.body,
                margin: '0 auto 16px',
              }}
            >
              {s.num}
            </div>
            <div style={{ fontSize: FONT.body, fontWeight: 700, marginBottom: 8 }}>{s.t}</div>
            <div style={{ fontSize: FONT.caption, opacity: 0.7, lineHeight: 1.4 }}>{s.d}</div>
          </div>
        ))}
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  7. TESTIMONIAL — depoimento
// ============================================================================

export function SlideTestimonial({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)

  return (
    <SlideFrame slide={slide} theme={theme}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: SPACING.gap, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: FONT.caption, color: theme.primary, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          Histórias reais
        </div>
        <div style={{ fontSize: FONT.lg, fontWeight: 700 }}>{title}</div>
        <div
          style={{
            fontSize: FONT.md,
            fontStyle: 'italic',
            opacity: 0.85,
            lineHeight: 1.5,
            padding: '32px 48px',
            borderLeft: `3px solid ${theme.primary}`,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            textAlign: 'left',
          }}
        >
          &ldquo;Comecei o consórcio com cota acessível, fui contemplado no 23º mês e hoje moro
          numa casa que valeria 3x o que paguei se tivesse financiado. A escolha que mudou minha
          vida.&rdquo;
          <div style={{ fontSize: FONT.body, opacity: 0.65, marginTop: 16, fontStyle: 'normal' }}>
            — Cliente real do escritório
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  8. CTA — próximo passo
// ============================================================================

export function SlideCta({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)
  const sellerName = pickValue(values, 'seller_name')
  const sellerPhone = pickValue(values, 'seller_phone')
  const companyName = pickValue(values, 'company_name')

  return (
    <SlideFrame slide={slide} theme={theme}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: SPACING.gap,
        }}
      >
        <div
          style={{
            fontSize: FONT.caption,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: 0.8,
            color: accentTextColor(slide, theme),
          }}
        >
          Próximo passo
        </div>
        <div
          style={{
            fontSize: FONT.xl,
            fontWeight: 700,
            lineHeight: 1.1,
            color: accentTextColor(slide, theme),
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: SPACING.gap,
            padding: '24px 48px',
            background: slide.background === 'accent' ? 'rgba(255,255,255,0.15)' : `${theme.primary}15`,
            border: `1px solid ${slide.background === 'accent' ? 'rgba(255,255,255,0.3)' : theme.primary + '50'}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: FONT.caption, opacity: 0.7, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Fale com {sellerName || 'seu consultor'}
          </div>
          {sellerPhone && (
            <div style={{ fontSize: FONT.md, fontWeight: 700, color: accentTextColor(slide, theme) }}>
              {sellerPhone}
            </div>
          )}
          {companyName && (
            <div style={{ fontSize: FONT.body, opacity: 0.7 }}>
              {companyName}
            </div>
          )}
        </div>
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  9. ABOUT — sobre empresa/vendedor
// ============================================================================

export function SlideAbout({ slide, theme, values }: SlideTypeProps) {
  const title = interpolate(slide.title, values)
  const companyName = pickValue(values, 'company_name')

  if (slide.layout === 'cards') {
    const pillars = [
      { t: 'Atendimento humano', d: 'Nada de chatbot. Você fala com um consultor de verdade.' },
      { t: '+1.500 famílias', d: 'Já realizaram sonhos com a gente.' },
      { t: '10 anos de mercado', d: 'Conhecimento que vem da prática.' },
    ]
    return (
      <SlideFrame slide={slide} theme={theme}>
        <div style={{ fontSize: FONT.md, fontWeight: 700, color: theme.primary, marginBottom: 8, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Sobre nós
        </div>
        <div style={{ fontSize: FONT.lg, fontWeight: 700, marginBottom: SPACING.gap * 1.5 }}>{title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SPACING.gap }}>
          {pillars.map((p) => (
            <div
              key={p.t}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${theme.primary}25`,
                borderRadius: 12,
                padding: SPACING.card,
              }}
            >
              <div style={{ fontSize: FONT.md, fontWeight: 700, marginBottom: 12, color: theme.primary }}>
                {p.t}
              </div>
              <div style={{ fontSize: FONT.body, opacity: 0.75, lineHeight: 1.5 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </SlideFrame>
    )
  }

  return (
    <SlideFrame slide={slide} theme={theme}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: SPACING.gap, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontSize: FONT.caption, color: theme.primary, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          {companyName || 'Sobre nós'}
        </div>
        <div style={{ fontSize: FONT.lg, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
      </div>
    </SlideFrame>
  )
}

// ============================================================================
//  Mapeamento type → componente
// ============================================================================

export const SLIDE_COMPONENTS = {
  cover: SlideCover,
  problem: SlideProblem,
  education: SlideEducation,
  comparison: SlideComparison,
  numbers: SlideNumbers,
  timeline: SlideTimeline,
  testimonial: SlideTestimonial,
  cta: SlideCta,
  about: SlideAbout,
} as const
