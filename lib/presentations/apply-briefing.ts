/**
 * Aplica os dados de um Briefing a um Template, devolvendo slides + customization
 * já preenchidos. Usado pelo wizard de criação de apresentação.
 *
 * O mapeamento entre fieldKey do elemento e propriedade do briefing está em
 * FIELD_MAP. Campos do briefing também alimentam URLs de mídia (foto e logo)
 * em elementos `image` e `logo-company`.
 */

import {
  Slide,
  SlideElement,
  BriefingData,
  PresentationCustomization,
  PresentationTemplate,
  isTextElement,
} from './types'

/**
 * Mapeia fieldKey do elemento → propriedade do BriefingData.
 * Quando o renderer encontra um elemento com fieldKey, esse mapa diz qual
 * valor do briefing deve substituir o conteúdo padrão.
 */
const FIELD_MAP: Record<string, keyof BriefingData> = {
  // Capa
  client_name: 'client_name',
  cover_subtitle: 'client_context',
  seller_name: 'seller_name',
  company_name: 'company_name',

  // Apresentação (sobre vendedor + empresa)
  apresentacao_lead: 'client_context',
  apresentacao_bio: 'company_about',
  seller_role: 'seller_role',
  seller_experience: 'seller_experience',

  // Condição (plano financeiro)
  condicao_credit: 'credit_value',
  condicao_payment: 'monthly_payment',
  condicao_term: 'term_months',

  // Comparação
  comparacao_bad_value: 'financing_comparison',
  comparacao_good_value: 'credit_value',

  // Proposta (4 diferenciais)
  proposta_diff1: 'diff1',
  proposta_diff2: 'diff2',
  proposta_diff3: 'diff3',
  proposta_diff4: 'diff4',
}

/**
 * Resolve um fieldKey contra o briefing. Retorna o valor preenchido ou null
 * se o briefing não tiver dado para esse campo (usa o default do template).
 */
function resolveFieldValue(fieldKey: string | undefined, briefing: BriefingData): string | null {
  if (!fieldKey) return null
  const briefKey = FIELD_MAP[fieldKey]
  if (!briefKey) return null
  const value = briefing[briefKey]
  if (typeof value !== 'string') return null
  return value.trim() ? value : null
}

function applyToElement(el: SlideElement, briefing: BriefingData): SlideElement {
  // Texto: usa fieldKey
  if (isTextElement(el)) {
    const v = resolveFieldValue(el.fieldKey, briefing)
    return v ? { ...el, content: v } : el
  }

  // Stat card: usa fieldKeyValue (e label fica como o template definiu)
  if (el.type === 'stat-card') {
    const v = resolveFieldValue(el.fieldKeyValue, briefing)
    return v ? { ...el, value: v } : el
  }

  // List item: usa fieldKey
  if (el.type === 'list-item') {
    const v = resolveFieldValue(el.fieldKey, briefing)
    return v ? { ...el, text: v } : el
  }

  // Comparison: pode ter fieldKeyValue e fieldKeyDesc
  if (el.type === 'comparison') {
    const v = resolveFieldValue(el.fieldKeyValue, briefing)
    const d = resolveFieldValue(el.fieldKeyDesc, briefing)
    if (v || d) {
      return { ...el, value: v ?? el.value, description: d ?? el.description }
    }
    return el
  }

  // Timeline step
  if (el.type === 'timeline-step') {
    const t = resolveFieldValue(el.fieldKeyTitle, briefing)
    const d = resolveFieldValue(el.fieldKeyDesc, briefing)
    if (t || d) {
      return { ...el, title: t ?? el.title, description: d ?? el.description }
    }
    return el
  }

  // Foto do vendedor: image com fieldKey === 'seller_photo'
  if (el.type === 'image' && el.fieldKey === 'seller_photo' && briefing.seller_photo_url) {
    return { ...el, src: briefing.seller_photo_url }
  }

  // Logo da empresa: logo-company com fieldKey === 'company_logo'
  if (el.type === 'logo-company' && briefing.company_logo_url) {
    return { ...el, src: briefing.company_logo_url }
  }

  return el
}

export function applyBriefing(
  template: PresentationTemplate,
  briefing: BriefingData
): { slides: Slide[]; customization: PresentationCustomization } {
  const slides: Slide[] = template.slides.map((slide) => ({
    ...slide,
    elements: slide.elements.map((el) => applyToElement(el, briefing)),
  }))

  const base = template.default_customization
  const customization: PresentationCustomization = {
    ...base,
    admin_id: briefing.admin_id || base.admin_id,
    company_name: briefing.company_name || base.company_name,
    company_logo_url: briefing.company_logo_url ?? base.company_logo_url ?? null,
    seller_name: briefing.seller_name || base.seller_name,
    seller_phone: briefing.seller_phone || base.seller_phone,
    seller_email: briefing.seller_email || base.seller_email,
    seller_photo_url: briefing.seller_photo_url ?? base.seller_photo_url ?? null,
  }

  return { slides, customization }
}

/**
 * Defaults de diferenciais por categoria. Usados como sugestão pré-preenchida
 * no Step 4 do wizard. O vendedor edita para ajustar.
 */
export const DEFAULT_DIFFS_BY_CATEGORY: Record<string, [string, string, string, string]> = {
  imovel: [
    'Atendimento humano e personalizado do início ao fim',
    'Suporte garantido até a contemplação e além',
    'Acompanhamento das melhores oportunidades de imóveis',
    'Estratégia de lance para acelerar sua contemplação',
  ],
  auto: [
    'Curadoria de modelos dentro do seu orçamento',
    'Estratégia de lance para acelerar a contemplação',
    'Suporte até a entrega do veículo na concessionária',
    'Pós-venda com revisão de plano a cada 12 meses',
  ],
  servicos: [
    'Liberdade total de uso da carta de crédito',
    'Parcelas que se ajustam ao seu orçamento',
    'Suporte do início ao fim do plano',
    'Acompanhamento de oportunidades de lance',
  ],
  investimento: [
    'Análise de perfil e capacidade de aporte',
    'Estratégia de múltiplas cotas para diversificar',
    'Acompanhamento trimestral de performance',
    'Plano de reinvestimento com lances calculados',
  ],
  universal: [
    'Atendimento 100% humanizado e personalizado',
    'Mais de 500 famílias atendidas com excelência',
    'Equipe certificada e em constante atualização',
    'Suporte do contrato até a contemplação',
  ],
}

/**
 * Contexto default do cliente por categoria do template.
 */
export const DEFAULT_CONTEXT_BY_CATEGORY: Record<string, string> = {
  imovel: 'Conquistar a casa própria',
  auto: 'Adquirir um veículo novo',
  servicos: 'Realizar um projeto importante',
  investimento: 'Construir patrimônio com inteligência',
  universal: 'Realizar um sonho',
}
