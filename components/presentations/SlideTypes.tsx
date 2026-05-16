/**
 * 9 componentes individuais por tipo de slide.
 *
 * Cada componente recebe:
 *   - slide: estrutura do template (type, layout, title, e campos opcionais
 *            como headline/body/stat/items/steps/quote/stats/differentials)
 *   - theme: { primary, background, font, style }
 *   - values: FieldValues do briefing já processados/formatados
 *
 * Conteúdo denso, com narrativa de vendas. Tipografia em px fixo relativo
 * ao canvas 1280×720 (SlideStage escala depois). Animações de entrada por
 * elemento via classes utilitárias .anim-up-N / .anim-fade-N (definidas
 * em globals.css).
 */

import {
  Slide, PresentationTheme, FieldValues,
  SLIDE_WIDTH, SLIDE_HEIGHT,
} from '@/lib/presentations/types'
import { interpolate } from '@/lib/presentations/interpolate'

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

function pickValue(values: FieldValues, ...keys: string[]): string {
  for (const k of keys) {
    if (values[k]?.trim()) return values[k]
  }
  return ''
}

// ============================================================================
//  1. COVER — capa
// ============================================================================

export function SlideCover({ slide, theme, values }: SlideTypeProps) {
  const clientName = pickValue(values, 'client_name', 'contact_name', 'company_client_name')
  const clientGoal = pickValue(values, 'client_goal', 'asset_type')
  const sellerName = pickValue(values, 'seller_name')
  const companyName = pickValue(values, 'company_name')

  // Quando o slide tem {{variaveis}} no title (ex: emocional, reengajamento),
  // usa o título personalizado como subtítulo
  const interpolatedTitle = interpolate(slide.title, values)
  const hasCustomTitle = slide.title.includes('{{') || slide.title.toLowerCase().includes(clientName.toLowerCase().slice(0, 6))

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '80px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Grade sutil de fundo */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(${theme.primary}0a 1px, transparent 1px),
          linear-gradient(90deg, ${theme.primary}0a 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        pointerEvents: 'none',
      }} />

      {/* Halo central */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.primary}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div className="anim-fade-0" style={{
        fontSize: 13, fontWeight: 500,
        color: theme.primary,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom: 40,
        position: 'relative',
      }}>
        {companyName || 'Apresentação personalizada'}
      </div>

      <div className="anim-up-0" style={{
        fontSize: 18,
        color: 'rgba(255,255,255,0.35)',
        fontWeight: 400,
        marginBottom: 16,
        position: 'relative',
      }}>
        Proposta exclusiva para
      </div>

      <div className="anim-up-1" style={{
        fontSize: 72, fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '-0.03em',
        lineHeight: 1.05,
        textAlign: 'center',
        position: 'relative',
        marginBottom: 48,
        maxWidth: 1000,
      }}>
        {clientName || 'Você'}
      </div>

      <div className="anim-up-2" style={{
        width: 64, height: 3,
        background: theme.primary,
        borderRadius: 2,
        marginBottom: 48,
        position: 'relative',
      }} />

      <div className="anim-up-3" style={{
        fontSize: 20,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 400,
        position: 'relative',
        marginBottom: 64,
        textAlign: 'center',
        maxWidth: 800,
      }}>
        {hasCustomTitle && clientName
          ? interpolatedTitle
          : clientGoal
            ? `O seu caminho para ${clientGoal.toLowerCase()}`
            : 'O caminho inteligente para o seu próximo bem'}
      </div>

      {sellerName && (
        <div className="anim-fade-2" style={{
          position: 'absolute', bottom: 48,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ width: 1, height: 32, background: `${theme.primary}66` }} />
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
              Apresentado por
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
              {sellerName}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
//  2. PROBLEM — dor / inversão de expectativa
// ============================================================================

export function SlideProblem({ slide, theme, values }: SlideTypeProps) {
  const headline = slide.headline ?? 'Você já calculou quanto vai pagar a mais?'
  const body = slide.body ?? 'Quem compra um bem pelo caminho tradicional paga, em média, 40% a mais do que o valor real. Esse dinheiro vai para os juros — não para o seu patrimônio.'
  const stat = slide.stat ?? '40%'
  const statLabel = slide.stat_label ?? 'a mais no custo final'

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Lado esquerdo — texto */}
      <div style={{
        padding: '80px 56px 80px 80px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div className="anim-right-0" style={{
          fontSize: 11, fontWeight: 600,
          color: theme.primary, letterSpacing: '0.16em',
          textTransform: 'uppercase', marginBottom: 24,
        }}>
          {slide.section_label ?? 'O que ninguém te conta'}
        </div>

        <div className="anim-up-1" style={{
          fontSize: 36, fontWeight: 700,
          color: '#ffffff', lineHeight: 1.2,
          letterSpacing: '-0.02em', marginBottom: 24,
        }}>
          {interpolate(headline, values)}
        </div>

        <div className="anim-up-2" style={{
          fontSize: 18, color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.7, fontWeight: 400,
        }}>
          {interpolate(body, values)}
        </div>
      </div>

      {/* Lado direito — número de impacto */}
      <div className="anim-scale-0" style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `${theme.primary}0a`,
        borderLeft: `1px solid ${theme.primary}1a`,
        padding: '80px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          fontSize: 240, fontWeight: 800,
          color: `${theme.primary}28`,
          lineHeight: 1,
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          letterSpacing: '-0.04em',
        }}>
          {stat}
        </div>
        <div style={{
          fontSize: 120, fontWeight: 800,
          color: theme.primary,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          position: 'relative',
          marginBottom: 16,
        }}>
          {stat}
        </div>
        <div style={{
          fontSize: 18, color: 'rgba(255,255,255,0.5)',
          textAlign: 'center', position: 'relative',
          maxWidth: 320,
        }}>
          {statLabel}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  3. COMPARISON — dois caminhos lado a lado
// ============================================================================

export function SlideComparison({ theme, values }: SlideTypeProps) {
  const credit = pickValue(values, 'credit_value') || 'R$ 300.000'
  const bankInst = pickValue(values, 'bank_installment') || 'R$ 3.200'
  const consortInst = pickValue(values, 'consortium_installment') || 'R$ 1.400'
  const bankRate = pickValue(values, 'bank_rate') || '12,5'

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      padding: '64px 80px',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="anim-up-0" style={{
        fontSize: 11, fontWeight: 600,
        color: theme.primary, letterSpacing: '0.16em',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        A comparação que muda tudo
      </div>
      <div className="anim-up-1" style={{
        fontSize: 36, fontWeight: 700,
        color: '#fff', marginBottom: 48,
        letterSpacing: '-0.02em',
      }}>
        Dois caminhos para o mesmo bem
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
        {/* Financiamento */}
        <div className="anim-up-2" style={{
          background: 'rgba(163,45,45,0.08)',
          border: '1px solid rgba(163,45,45,0.2)',
          borderRadius: 12, padding: 32,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: '#e24b4a', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 24,
          }}>
            Financiamento bancário
          </div>
          {[
            { label: 'Parcela mensal', value: bankInst },
            { label: 'Taxa de juros', value: `${bankRate}% ao ano` },
            { label: 'Custo total estimado', value: 'R$ 576.000' },
            { label: 'O que você paga a mais', value: '+ R$ 276.000' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#e24b4a' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Consórcio */}
        <div className="anim-up-3" style={{
          background: `${theme.primary}10`,
          border: `1px solid ${theme.primary}3f`,
          borderRadius: 12, padding: 32,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: theme.primary, color: theme.background,
            fontSize: 10, fontWeight: 700,
            padding: '4px 10px', borderRadius: 20,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Recomendado
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: theme.primary, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 24,
          }}>
            Consórcio
          </div>
          {[
            { label: 'Parcela mensal', value: consortInst },
            { label: 'Taxa de administração', value: '~1% ao ano' },
            { label: 'Custo total estimado', value: credit },
            { label: 'Você economiza', value: '+ R$ 276.000' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: i < 3 ? `1px solid ${theme.primary}14` : 'none',
            }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: theme.primary }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  4. NUMBERS — KPIs personalizados
// ============================================================================

export function SlideNumbers({ theme, values }: SlideTypeProps) {
  const clientName = pickValue(values, 'client_name', 'contact_name') || 'você'

  const numberItems = [
    {
      label: 'Seu crédito',
      value: pickValue(values, 'credit_value', 'new_credit', 'total_credit') || 'R$ 300.000',
      accent: true,
    },
    {
      label: 'Parcela mensal',
      value: pickValue(values, 'monthly_installment', 'consortium_installment', 'new_installment') || 'R$ 1.400',
      accent: false,
    },
    {
      label: 'Prazo',
      value: pickValue(values, 'timeline', 'projection_years') || '180 meses',
      accent: false,
    },
    { label: 'Taxa de juros', value: '0%', accent: true },
  ]

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      padding: '64px 80px',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="anim-up-0" style={{
        fontSize: 11, fontWeight: 600,
        color: theme.primary, letterSpacing: '0.16em',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        Seu plano personalizado
      </div>
      <div className="anim-up-1" style={{
        fontSize: 36, fontWeight: 700,
        color: '#fff', marginBottom: 48,
        letterSpacing: '-0.02em',
      }}>
        Os números que fazem sentido para {clientName}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 16, flex: 1,
      }}>
        {numberItems.map((item, i) => (
          <div
            key={i}
            className={`anim-up-${i + 1}`}
            style={{
              background: item.accent ? `${theme.primary}14` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${item.accent ? theme.primary + '3f' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12,
              padding: 32,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}
          >
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.35)',
              fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.10em',
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: 48, fontWeight: 700,
              color: item.accent ? theme.primary : '#ffffff',
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
//  5. EDUCATION — explicação visual em passos
// ============================================================================

export function SlideEducation({ slide, theme, values }: SlideTypeProps) {
  const items = slide.items?.length ? slide.items : [
    { step: '01', title: 'Você entra em um grupo', body: 'Um grupo de pessoas com o mesmo objetivo. Cada um contribui mensalmente com a parcela combinada.' },
    { step: '02', title: 'Todo mês alguém é contemplado', body: 'Por sorteio ou lance, um participante recebe a carta de crédito para comprar o bem.' },
    { step: '03', title: 'Você usa o crédito como quiser', body: 'Compra à vista, negocia desconto, escolhe o imóvel, o carro — sem burocracia de financiamento.' },
  ]

  const sectionLabel = slide.section_label ?? 'Como funciona na prática'
  const titleText = slide.title_text ?? interpolate(slide.title, values) ?? 'Simples assim — sem pegadinha'

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      padding: '64px 80px',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="anim-up-0" style={{
        fontSize: 11, fontWeight: 600,
        color: theme.primary, letterSpacing: '0.16em',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        {sectionLabel}
      </div>
      <div className="anim-up-1" style={{
        fontSize: 36, fontWeight: 700,
        color: '#fff', marginBottom: 48,
        letterSpacing: '-0.02em',
      }}>
        {interpolate(titleText, values)}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 24, flex: 1,
      }}>
        {items.map((item, i) => (
          <div key={i} className={`anim-up-${i + 2}`} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 32,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{
              fontSize: 48, fontWeight: 800,
              color: `${theme.primary}33`,
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}>
              {item.step ?? String(i + 1).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: 20, fontWeight: 600,
              color: '#ffffff', lineHeight: 1.3,
            }}>
              {item.title ?? ''}
            </div>
            <div style={{
              fontSize: 15, color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.7,
            }}>
              {item.body ?? ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
//  6. TIMELINE — jornada cronológica
// ============================================================================

export function SlideTimeline({ slide, theme, values }: SlideTypeProps) {
  const clientName = pickValue(values, 'client_name', 'contact_name') || 'você'
  const clientGoal = pickValue(values, 'client_goal', 'asset_type') || 'o seu bem'

  const steps = slide.steps?.length ? slide.steps : [
    { label: 'Hoje', description: 'Você assina o contrato e entra no grupo' },
    { label: '1º mês', description: 'Primeira parcela, primeira assembleia' },
    { label: 'Contemplação', description: 'Por sorteio ou lance — você recebe a carta de crédito' },
    { label: 'Realização', description: `Você compra ${clientGoal.toLowerCase()} e segue pagando o restante` },
  ]

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      padding: '64px 80px',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="anim-up-0" style={{
        fontSize: 11, fontWeight: 600,
        color: theme.primary, letterSpacing: '0.16em',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        A jornada de {clientName}
      </div>
      <div className="anim-up-1" style={{
        fontSize: 36, fontWeight: 700,
        color: '#fff', marginBottom: 64,
        letterSpacing: '-0.02em',
      }}>
        {interpolate(slide.title, values) || 'Do primeiro passo à realização'}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, flex: 1 }}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          return (
            <div key={i} className={`anim-up-${i + 2}`} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              position: 'relative',
            }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: 20, left: '50%', right: '-50%',
                  height: 2,
                  background: i >= steps.length - 2 ? theme.primary : 'rgba(255,255,255,0.1)',
                  zIndex: 0,
                }} />
              )}

              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: isLast ? theme.primary : 'rgba(255,255,255,0.06)',
                border: `2px solid ${isLast ? theme.primary : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1, position: 'relative', marginBottom: 24,
                fontSize: 14, color: isLast ? theme.background : 'rgba(255,255,255,0.4)',
                fontWeight: 700,
              }}>
                {i + 1}
              </div>

              <div style={{
                fontSize: 14, fontWeight: 700,
                color: isLast ? theme.primary : 'rgba(255,255,255,0.85)',
                textAlign: 'center', marginBottom: 12,
              }}>
                {step.label ?? ''}
              </div>

              <div style={{
                fontSize: 13, color: 'rgba(255,255,255,0.4)',
                textAlign: 'center', lineHeight: 1.6, padding: '0 16px',
              }}>
                {step.description ?? ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
//  7. CTA — fechamento com autoridade
// ============================================================================

export function SlideCta({ theme, values }: SlideTypeProps) {
  const clientName = pickValue(values, 'client_name', 'contact_name')
  const sellerName = pickValue(values, 'seller_name') || 'Seu Consultor'
  const sellerPhone = pickValue(values, 'seller_phone') || '(51) 99999-9999'

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '80px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 60%, ${theme.primary}17 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div className="anim-up-0" style={{
        fontSize: 11, fontWeight: 600,
        color: theme.primary, letterSpacing: '0.18em',
        textTransform: 'uppercase', marginBottom: 24,
        position: 'relative',
      }}>
        Próximo passo
      </div>

      <div className="anim-up-1" style={{
        fontSize: 56, fontWeight: 800,
        color: '#ffffff', textAlign: 'center',
        letterSpacing: '-0.03em', lineHeight: 1.1,
        marginBottom: 24, position: 'relative',
        maxWidth: 900,
      }}>
        {clientName
          ? `${clientName}, é hora de começar.`
          : 'É hora de transformar isso em realidade.'}
      </div>

      <div className="anim-up-2" style={{
        fontSize: 20, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 1.6,
        marginBottom: 64, position: 'relative',
        maxWidth: 600,
      }}>
        A diferença entre quem realiza e quem adia é uma única decisão.
        Vamos dar esse passo juntos.
      </div>

      <div className="anim-up-3" style={{
        display: 'flex', gap: 32, alignItems: 'center',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            Fale comigo agora
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700, color: theme.primary,
            letterSpacing: '0.02em',
          }}>
            {sellerPhone}
          </div>
        </div>
        <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            Consultor
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
            {sellerName}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  8. TESTIMONIAL — prova social concreta
// ============================================================================

export function SlideTestimonial({ slide, theme }: SlideTypeProps) {
  const quote = slide.quote ?? '"Entrei no consórcio sem saber exatamente como funcionava. Dois anos depois, fui contemplado e comprei o apartamento à vista. Economizei mais de R$ 80.000 comparado ao financiamento que eu ia fazer."'
  const name = slide.testimonial_name ?? 'Marcos Andrade'
  const detail = slide.testimonial_detail ?? 'Contemplado em 24 meses · Imóvel de R$ 320.000'

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        position: 'absolute', top: 40, left: 80,
        fontSize: 240, fontWeight: 800,
        color: `${theme.primary}10`, lineHeight: 1,
        fontFamily: 'Georgia, serif',
        userSelect: 'none',
      }}>
        &ldquo;
      </div>

      <div className="anim-fade-0" style={{
        fontSize: 11, fontWeight: 600,
        color: theme.primary, letterSpacing: '0.16em',
        textTransform: 'uppercase', marginBottom: 32,
        position: 'relative',
      }}>
        Quem já chegou lá
      </div>

      <div className="anim-up-1" style={{
        fontSize: 28, fontWeight: 400,
        color: 'rgba(255,255,255,0.78)',
        textAlign: 'center', lineHeight: 1.7,
        maxWidth: 900, marginBottom: 48,
        fontStyle: 'italic', position: 'relative',
      }}>
        {quote}
      </div>

      <div className="anim-up-2" style={{
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: `${theme.primary}26`,
          border: `2px solid ${theme.primary}4d`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: theme.primary,
        }}>
          {name.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{detail}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  9. ABOUT — prova social do escritório
// ============================================================================

export function SlideAbout({ slide, theme, values }: SlideTypeProps) {
  const stats = slide.stats?.length ? slide.stats : [
    { value: '+500', label: 'Clientes contemplados' },
    { value: 'R$ 120M', label: 'Em crédito entregue' },
    { value: '8 anos', label: 'De experiência' },
  ]

  const differentials = slide.differentials?.length ? slide.differentials : [
    'Atendimento personalizado do início ao fim',
    'Parceria com as principais administradoras',
    'Estratégia de lance para antecipar contemplação',
  ]

  const companyName = pickValue(values, 'company_name') || 'Nosso escritório'

  return (
    <div style={{
      width: SLIDE_WIDTH, height: SLIDE_HEIGHT,
      background: theme.background,
      padding: '64px 80px',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div className="anim-up-0" style={{
        fontSize: 11, fontWeight: 600,
        color: theme.primary, letterSpacing: '0.16em',
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        Por que confiar em nós
      </div>
      <div className="anim-up-1" style={{
        fontSize: 36, fontWeight: 700,
        color: '#fff', marginBottom: 48,
        letterSpacing: '-0.02em',
      }}>
        {companyName} em números
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 16, marginBottom: 48,
      }}>
        {stats.map((stat, i) => (
          <div key={i} className={`anim-up-${i + 2}`} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 32,
          }}>
            <div style={{
              fontSize: 48, fontWeight: 800,
              color: theme.primary, letterSpacing: '-0.03em',
              lineHeight: 1, marginBottom: 12,
            }}>
              {stat.value ?? ''}
            </div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>
              {stat.label ?? ''}
            </div>
          </div>
        ))}
      </div>

      <div className="anim-fade-1" style={{
        display: 'flex', gap: 32, flexWrap: 'wrap',
      }}>
        {differentials.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: theme.primary, flexShrink: 0,
            }} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
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
