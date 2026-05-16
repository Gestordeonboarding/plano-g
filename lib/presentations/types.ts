/**
 * Schema v3 do módulo de apresentações (Plano G).
 *
 * Mudança em relação à v2: slides deixam de ter `elements[]` posicionados
 * em coordenadas absolutas. Cada slide agora é TIPADO (`type`) e tem um
 * LAYOUT predefinido (`layout`). Cada combinação type+layout vira um
 * componente React próprio que sabe se renderizar — muito mais simples
 * de manter e estilizar.
 *
 * Canvas canônico: 1280×720 (16:9). Renderização sempre escalada via
 * SlideStage, nunca em px fixos no DOM.
 */

import { FieldDef } from './interpolate'

// ============================================================================
//  Canvas
// ============================================================================

export const SLIDE_WIDTH = 1280
export const SLIDE_HEIGHT = 720

// ============================================================================
//  Slide tipado
// ============================================================================

/**
 * Tipos semânticos de slide. Cada tipo tem um propósito narrativo distinto
 * dentro da apresentação. O renderer mapeia cada tipo+layout para um
 * componente React específico.
 */
export type SlideType =
  | 'cover'          // Capa — abertura
  | 'about'          // Sobre — empresa/vendedor/quem somos
  | 'problem'        // Problema — dor que o cliente tem hoje
  | 'education'      // Educação — explica conceito (consórcio, grupo, contemplação)
  | 'comparison'     // Comparação — lado a lado consórcio vs financiamento
  | 'numbers'        // Números — KPIs, simulação, valores
  | 'timeline'       // Linha do tempo — etapas, projeção
  | 'testimonial'    // Depoimento — quem já realizou
  | 'cta'            // Call-to-action — próximo passo

/**
 * Layout do slide — escolhe a estrutura visual dentro de cada tipo.
 * Nem todos os layouts fazem sentido pra todos os tipos.
 */
export type SlideLayout =
  | 'centered'       // Centralizado (texto único no centro)
  | 'split'          // Dividido (esquerda/direita)
  | 'cards'          // Cards em grade (3 colunas)
  | 'grid'           // Grade de KPIs (2x2 ou 3x2)
  | 'comparison'     // Lado a lado simétrico
  | 'timeline'       // Linha horizontal com passos
  | 'full'           // Tela cheia (imagem ou tipografia gigante)

/** Background do slide — dark = fundo principal, accent = fundo na cor accent */
export type SlideBackground = 'dark' | 'accent'

/**
 * Slide tipado. Conteúdo dinâmico vem do FieldValues do briefing via
 * interpolação. Templates definem só a estrutura.
 */
export interface Slide {
  /** ID único dentro da apresentação */
  id: string
  /** Tipo semântico — define o componente que renderiza */
  type: SlideType
  /** Layout visual */
  layout: SlideLayout
  /** Background */
  background: SlideBackground
  /** Título do slide (pode conter {{variaveis}}) */
  title: string
  /** Visível na apresentação (vendedor pode esconder slides individuais) */
  visible?: boolean
}

// ============================================================================
//  Theme — visual do template (não mais 8 themes diferentes — agora é só
//  configuração leve por template)
// ============================================================================

export interface PresentationTheme {
  /** Cor accent principal — usada em destaques, botões, linha decorativa */
  primary: string
  /** Cor de fundo dark */
  background: string
  /** Família tipográfica (Inter sempre por padrão) */
  font: string
  /** Estilo narrativo — usado pra micro-ajustes por componente */
  style: 'minimal' | 'data-driven' | 'premium' | 'urgent' | 'executive' | 'emotional' | string
}

// ============================================================================
//  Customização (dados que mudam por apresentação, não por template)
// ============================================================================

export interface PresentationCustomization {
  /** Logo da empresa do vendedor (URL Supabase Storage) */
  company_logo_url: string | null
  /** Foto do vendedor (URL Supabase Storage) */
  seller_photo_url: string | null
  /** Override manual do theme (ex: trocar cor primary pra do tenant) */
  theme_override?: Partial<PresentationTheme>
  /** ID da administradora (se relevante pra esse template) */
  admin_id?: string | null
}

// ============================================================================
//  Template — vem do banco
// ============================================================================

export type TemplateCategory = 'imovel' | 'auto' | 'moto' | 'servicos' | 'investimento' | 'universal'

export type AnimationStyle = 'fade' | 'slide' | 'zoom' | 'none'

export interface PresentationTemplate {
  id: string
  name: string
  description: string | null
  /** Propósito único do template — "Educar o cliente...", "Demonstrar vantagem..." */
  purpose: string | null
  /** Para qual perfil de cliente — descrição livre */
  target_audience: string | null
  category: TemplateCategory
  animation_style: AnimationStyle
  /** Definição dos campos do briefing específicos deste template */
  fields: FieldDef[]
  /** Slides do template (estrutura) */
  slides: Slide[]
  /** Theme visual */
  theme: PresentationTheme
  thumbnail_url: string | null
  is_active: boolean
  sort_order: number
}

// ============================================================================
//  Apresentação (instância salva por um vendedor)
// ============================================================================

export interface Presentation {
  id: string
  title: string
  template_id: string | null
  tenant_id: string
  seller_id: string | null
  lead_id: string | null
  /** Valores do briefing preenchidos pelo vendedor — todas as {{variaveis}} */
  field_values: Record<string, string>
  /** Customização (logo, foto, override de cor) */
  customization: PresentationCustomization
  /** Slides — copiados do template no momento da criação (pra não perder se template mudar) */
  slides: Slide[]
  /** Theme — copiado do template */
  theme: PresentationTheme
  /** Token público pra compartilhamento */
  share_token: string | null
  share_expires_at: string | null
  view_count: number
  last_viewed_at: string | null
  status: 'rascunho' | 'finalizada' | 'enviada' | 'visualizada'
  created_at: string
  updated_at: string
}

// ============================================================================
//  Re-exports úteis
// ============================================================================

export type { FieldDef, FieldValues } from './interpolate'
