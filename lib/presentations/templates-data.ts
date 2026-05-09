/**
 * 8 templates de apresentação — todos compartilham o DNA Dark Tech Premium
 * mas cada um aplica um theme distinto (paleta + tipografia + ornamento).
 *
 * Estratégia:
 *   - O conteúdo de consórcio (CONSORCIO_CONTENT) é COMPARTILHADO entre todos
 *     os templates — assim a venda é coerente independente do theme escolhido.
 *   - Cada template define apenas: theme_id, nome, descrição, categoria e
 *     admin default (para sugestão inicial — usuário pode trocar).
 *   - Os 10 slides são gerados pelos builders genéricos em slide-builders.ts.
 */

import {
  Slide, PresentationCustomization, PresentationTemplate, TemplateCategory,
} from './types'
import { ThemeId } from './themes'
import {
  buildCapa, buildSobre, buildAlinhamento, buildTransicao,
  buildFases, buildFeaturesDuplo, buildCardsGrid, buildPricing,
  buildProcessoHorizontal, buildProposta,
  CapaContent, SobreContent, AlinhamentoContent, TransicaoContent,
  FasesContent, FeaturesDuploContent, CardsGridContent, PricingContent,
  ProcessoContent, PropostaContent,
} from './slide-builders'
import { getTheme } from './themes'

// ============================================================================
//  Conteúdo de consórcio — compartilhado entre os 8 templates
// ============================================================================

const COVER_CONTENT: CapaContent = {
  welcomeText: 'PROPOSTA EXCLUSIVA PARA',
  title: 'O CAMINHO INTELIGENTE\nPARA SEU PRÓXIMO BEM',
  titleFieldKey: 'cover_title',
}

const SOBRE_CONTENT: SobreContent = {
  smallLabel: 'SOBRE NÓS',
  heading: 'SOMOS A SUA PARCEIRA\nDE PLANEJAMENTO',
  paragraph:
    'Há mais de 10 anos transformando sonhos em realidade através de planejamento financeiro inteligente, com a transparência e a previsibilidade que o consórcio oferece.',
  stats: [
    { value: '+1.500', label: 'Famílias Atendidas' },
    { value: '+R$ 120M', label: 'em Cartas Contempladas' },
    { value: '10+', label: 'Anos de Mercado' },
  ],
  ctaFooter: 'Especialistas em consórcio de imóvel, automóvel e serviços.',
  imageUrl: null,
}

const ALINHAMENTO_CONTENT: AlinhamentoContent = {
  heading: 'O QUE É (E NÃO É) CONSÓRCIO',
  subheading: 'Antes de começar, é importante alinhar o que esperar deste planejamento.',
  positiveLabel: 'O QUE FAZEMOS',
  negativeLabel: 'O QUE NÃO FAZEMOS',
  positives: [
    'Planejamos seu próximo bem com previsibilidade',
    'Buscamos a melhor estratégia de lance pra você',
    'Acompanhamos do início até a contemplação',
    'Parcelas até 70% menores que financiamento bancário',
    'Sem juros — apenas taxa de administração transparente',
  ],
  negatives: [
    'Não somos financiamento — não há juros mensais',
    'Não há garantia de contemplação imediata',
    'Não cobramos taxas escondidas ou surpresas',
    'Não tomamos decisão sem você entender cada etapa',
    'Não trabalhamos com promessas falsas de prazo',
  ],
}

const TRANSICAO_CONTENT: TransicaoContent = {
  watermark: '01',
  topBadge: 'METODOLOGIA',
  sectionName: 'COMO FUNCIONA',
  iconName: 'TrendingUp',
  tagline: 'Um processo simples, transparente e auditável',
}

const FASES_CONTENT: FasesContent = {
  heading: 'JORNADA ATÉ A CONTEMPLAÇÃO',
  watermark: 'PROCESSO',
  centerIcon: 'RefreshCw',
  currentPhaseLabel: 'CICLO MENSAL',
  pastPhases: [
    'Análise de perfil e orçamento',
    'Escolha da carta ideal',
    'Adesão ao grupo',
    'Primeira parcela paga',
  ],
  futurePhases: [
    'Assembleia mensal',
    'Estratégia de lance',
    'Contemplação',
    'Uso da carta de crédito',
  ],
}

const FEATURES_CONTENT: FeaturesDuploContent = {
  smallLabel: 'PLATAFORMA EXCLUSIVA',
  heading: 'TUDO NA PALMA DA SUA MÃO',
  left: {
    subtitle: 'PORTAL DO CONSORCIADO',
    title: 'ACOMPANHAMENTO\nEM TEMPO REAL',
    description:
      'Extrato, próxima assembleia, status de lance e simulações — tudo online, 24 horas por dia.',
    mockup: 'portal',
  },
  right: {
    subtitle: 'TIME ESPECIALIZADO',
    title: 'CONSULTORIA\nHUMANIZADA',
    description:
      'Atendimento humano via WhatsApp + IA pra sugerir o melhor momento de dar lance.',
    mockup: 'whatsapp',
  },
}

const CARDS_GRID_CONTENT: CardsGridContent = {
  heading: 'POR QUE CONSÓRCIO',
  subheading: '6 razões pelas quais é a escolha de quem planeja com inteligência.',
  cards: [
    { icon: 'Shield', name: 'SEGURANÇA', detail: 'Administradoras autorizadas pelo Banco Central, com fiscalização constante.' },
    { icon: 'TrendingUp', name: 'CRÉDITO CORRIGIDO', detail: 'Sua carta acompanha índices oficiais — sem perda de poder de compra.' },
    { icon: 'Zap', name: 'FLEXIBILIDADE', detail: 'Use a carta para imóvel, auto, reforma, construção ou serviços. Você decide.' },
    { icon: 'Calculator', name: 'PARCELAS QUE CABEM', detail: 'Até 70% menor que financiamento. Sem juros — só taxa de administração.' },
    { icon: 'Users', name: 'ATENDIMENTO HUMANO', detail: 'Especialistas com você do início ao fim — sem chatbots, sem URA.' },
    { icon: 'Award', name: 'HISTÓRICO COMPROVADO', detail: 'Mais de 1.500 famílias contempladas. A maior taxa de satisfação da região.' },
  ],
  closingLine: 'Tudo isso com a transparência que você espera de um especialista.',
}

const PRICING_CONTENT: PricingContent = {
  heading: 'CARTAS DISPONÍVEIS HOJE',
  subheading: 'Duas opções pensadas pro seu momento — escolha a que faz mais sentido.',
  plans: [
    {
      name: 'CARTA ESSENCIAL',
      items: [
        'Crédito de R$ 250.000',
        'Prazo de 180 meses',
        'Taxa de administração 18%',
        'Lance livre permitido',
        'Sem fundo de reserva extra',
      ],
      oldPrice: 'De R$ 1.890/mês',
      price: 'R$ 1.450',
      priceLabel: 'PARCELA MENSAL',
      ctaLabel: 'PAGAMENTO MENSAL — SEM JUROS',
    },
    {
      name: 'CARTA EXPANSIVA',
      items: [
        'Crédito de R$ 500.000',
        'Prazo de 200 meses',
        'Taxa de administração 20%',
        'Lance livre + lance fixo de 25%',
        'Seguro de quitação incluso',
      ],
      oldPrice: 'De R$ 3.420/mês',
      price: 'R$ 2.890',
      priceLabel: 'PARCELA MENSAL',
      ctaLabel: 'CONTEMPLAÇÃO ACELERADA',
      highlighted: true,
    },
  ],
}

const PROCESSO_CONTENT: ProcessoContent = {
  heading: 'OS 5 PASSOS DA SUA JORNADA',
  steps: [
    { name: 'SIMULAÇÃO', description: 'Escolhemos juntos a carta que cabe no seu orçamento e prazo.' },
    { name: 'ADESÃO', description: 'Assinatura digital. Você entra no grupo já com plano de lance.' },
    { name: 'ASSEMBLEIA', description: 'Mensal. Sua chance de ser contemplado por sorteio ou lance.' },
    { name: 'CONTEMPLAÇÃO', description: 'Carta liberada. Você usa o crédito ou aguarda valorização.' },
    { name: 'USO + QUITAÇÃO', description: 'Compra do bem com a carta + parcelas até o fim do prazo.' },
  ],
  fineprint:
    'Os prazos de contemplação dependem da assembleia e da estratégia de lance. Consulte sempre o regulamento do grupo. Administradora autorizada pelo Banco Central do Brasil.',
}

const PROPOSTA_CONTENT: PropostaContent = {
  heading: 'PROPOSTA PERSONALIZADA',
  subheading: 'Duas configurações pensadas pro perfil que você compartilhou.',
  panels: [
    {
      panelTitle: 'CARTA ESSENCIAL',
      items: [
        'Crédito R$ 250.000 corrigido pelo INCC',
        '180 meses (15 anos)',
        'Lance livre + estratégia consultiva',
        'Atendimento dedicado pelo painel',
        'Sem entrada — primeira parcela só após adesão',
        'Quitação ao final ou via lance',
      ],
      priceBadge: 'R$ 1.450/MÊS',
      priceCaption: 'Pagamento mensal sem juros',
    },
    {
      panelTitle: 'CARTA EXPANSIVA',
      items: [
        'Crédito R$ 500.000 corrigido pelo INCC',
        '200 meses (16,6 anos)',
        'Lance fixo 25% pra contemplação acelerada',
        'Seguro de quitação por morte/invalidez',
        'Atendimento prioritário em assembleia',
        'Possibilidade de dois lances na mesma assembleia',
      ],
      priceBadge: 'R$ 2.890/MÊS',
      priceCaption: 'Pagamento mensal sem juros',
    },
  ],
}

// ============================================================================
//  Composição dos slides para um theme
// ============================================================================

function buildAllSlides(themeId: ThemeId): Slide[] {
  const t = getTheme(themeId)
  return [
    buildCapa(t, COVER_CONTENT),
    buildSobre(t, SOBRE_CONTENT),
    buildAlinhamento(t, ALINHAMENTO_CONTENT),
    buildTransicao(t, TRANSICAO_CONTENT),
    buildFases(t, FASES_CONTENT),
    buildFeaturesDuplo(t, FEATURES_CONTENT),
    buildCardsGrid(t, CARDS_GRID_CONTENT),
    buildPricing(t, PRICING_CONTENT),
    buildProcessoHorizontal(t, PROCESSO_CONTENT),
    buildProposta(t, PROPOSTA_CONTENT),
  ]
}

// ============================================================================
//  Customização default
// ============================================================================

function defaultCustomization(themeId: ThemeId, adminId: string): PresentationCustomization {
  return {
    theme_id: themeId,
    admin_id: adminId,
    primary_override: null,
    secondary_override: null,
    dark_override: null,
    company_logo_url: null,
    seller_photo_url: null,
    company_name: 'Sua Empresa',
    seller_name: 'Seu Nome',
    seller_phone: '(11) 99999-9999',
    seller_email: 'voce@empresa.com',
    font: 'inter',  // legacy — themes drive a tipografia em runtime
    transition: 'slide',
    animation_speed: 1,
  }
}

// ============================================================================
//  Definição dos 8 templates
// ============================================================================

interface TemplateSeed {
  themeId: ThemeId
  name: string
  description: string
  category: TemplateCategory
  defaultAdmin: string
  transition: PresentationCustomization['transition']
}

export const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    themeId: 'teal-terminal',
    name: 'Teal Terminal',
    description: 'Tech-forward, futurista. Verde-petróleo profundo com ciano vibrante.',
    category: 'universal',
    defaultAdmin: 'custom',
    transition: 'slide',
  },
  {
    themeId: 'onyx-gold',
    name: 'Onyx & Gold',
    description: 'Discreto e sofisticado. Preto onyx com filete dourado — para imóvel alto padrão.',
    category: 'imovel',
    defaultAdmin: 'custom',
    transition: 'fade',
  },
  {
    themeId: 'cobalt-capital',
    name: 'Cobalt Capital',
    description: 'Terminal de trading. Navy com azul elétrico e dados em mono — para investidor.',
    category: 'investimento',
    defaultAdmin: 'porto',
    transition: 'slide',
  },
  {
    themeId: 'carbon-crimson',
    name: 'Carbon Crimson',
    description: 'Pista de corrida. Carbono puro com vermelho racing — para auto premium.',
    category: 'auto',
    defaultAdmin: 'honda',
    transition: 'zoom',
  },
  {
    themeId: 'forest-emerald',
    name: 'Forest Emerald',
    description: 'Verde escuro orgânico com esmeralda — para imóvel familiar / herança.',
    category: 'imovel',
    defaultAdmin: 'embracon',
    transition: 'reveal',
  },
  {
    themeId: 'aurora-violet',
    name: 'Aurora Violet',
    description: 'Aurora boreal. Roxo profundo com violeta neon — para tech jovem / lifestyle.',
    category: 'servicos',
    defaultAdmin: 'custom',
    transition: 'fade',
  },
  {
    themeId: 'bronze-heritage',
    name: 'Bronze Heritage',
    description: 'Marrom profundo com bronze art-deco — tradicional, "60 anos de história".',
    category: 'universal',
    defaultAdmin: 'custom',
    transition: 'fade',
  },
  {
    themeId: 'platinum-mono',
    name: 'Platinum Mono',
    description: 'Editorial minimalista. Preto puro com platina, sem cor, tipografia gigante.',
    category: 'universal',
    defaultAdmin: 'custom',
    transition: 'fade',
  },
]

// ============================================================================
//  Templates exportados
// ============================================================================

type StoredTemplate = Omit<PresentationTemplate, 'id'>

export const TEMPLATES: StoredTemplate[] = TEMPLATE_SEEDS.map((seed, i) => {
  const customization = defaultCustomization(seed.themeId, seed.defaultAdmin)
  customization.transition = seed.transition

  return {
    name: seed.name,
    description: seed.description,
    category: seed.category,
    thumbnail_url: null,
    slides: buildAllSlides(seed.themeId),
    default_customization: customization,
    is_active: true,
    sort_order: i + 1,
    schema_version: 2 as const,
  }
})
