/**
 * Schema v2 do módulo de apresentações (Plano G).
 *
 * Mudança em relação à v1: cada slide deixa de ter "editable_fields" e passa
 * a ter "elements" posicionados em coordenadas absolutas dentro de um canvas
 * 1920×1080. Cada elemento é editável inline (clique para editar texto, foto,
 * cor, etc.) — e no modo avançado também pode ser arrastado/redimensionado.
 */

// ============================================================================
//  Coordenadas
// ============================================================================

/** Canvas usado em todo o módulo. Slides 16:9 sempre mapeiam para isso. */
export const CANVAS_W = 1920
export const CANVAS_H = 1080

// ============================================================================
//  Cores semânticas
// ============================================================================

/**
 * Cores podem ser literais (#hex) ou tokens semânticos resolvidos em runtime
 * a partir da paleta da administradora selecionada. Isso permite que o cliente
 * troque a administradora e todo o template se reaplique automaticamente.
 */
export type ColorToken =
  | 'primary'        // cor principal da administradora
  | 'secondary'      // cor secundária
  | 'dark'           // tom escuro
  | 'on-primary'     // texto sobre primary
  | 'white'
  | 'black'
  | 'transparent'
  | 'surface'        // fundo de cards
  | 'surface-2'      // fundo mais escuro
  | 'text'           // texto principal sobre fundo escuro
  | 'text-muted'     // texto auxiliar

export type ColorValue = ColorToken | string  // string = #hex literal

// ============================================================================
//  Animações
// ============================================================================

export type AnimationType =
  | 'none'
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'pop'
  | 'reveal'        // wipe / clip-path

export interface ElementAnimation {
  type: AnimationType
  delay: number      // ms — ordem de aparição
  duration?: number  // ms — default 600
}

/** Animação aplicada na transição entre slides. */
export type SlideTransition = 'fade' | 'slide' | 'zoom' | 'flip' | 'reveal'

// ============================================================================
//  Elementos posicionáveis
// ============================================================================

export type ElementType =
  // Texto
  | 'heading'        // título (texto grande)
  | 'subheading'     // subtítulo (médio)
  | 'text'           // texto regular
  | 'caption'        // texto pequeno / legenda
  // Mídia
  | 'image'          // imagem do usuário
  | 'logo-admin'     // logo da administradora (auto)
  | 'logo-company'   // logo da empresa do vendedor
  // Formas
  | 'shape'          // rect / circle / blob / line
  | 'icon'           // ícone do lucide-react
  // Componentes ricos
  | 'stat-card'      // card de número grande + label
  | 'list-item'      // item de lista com bullet/check/numero
  | 'comparison'     // bloco vs (consórcio x outro)
  | 'timeline-step'  // passo numerado da timeline
  | 'mockup'         // screenshot mock do sistema Plano G
  | 'badge'          // tag/etiqueta colorida

export type ShapeKind = 'rect' | 'circle' | 'blob' | 'line' | 'triangle' | 'arrow'

export type ListBulletKind = 'check' | 'number' | 'dot' | 'arrow' | 'star'

export type MockupKind =
  | 'dashboard'      // dashboard do vendedor
  | 'portal'         // portal do consorciado (PWA)
  | 'whatsapp'       // automações de WhatsApp
  | 'reports'        // relatórios e funil
  | 'leads'          // captura de leads
  | 'phone'          // moldura de celular genérica

export interface BaseElement {
  id: string
  type: ElementType
  /** Coordenadas no canvas 1920×1080 */
  x: number
  y: number
  w: number
  h: number
  /** Rotação em graus */
  rotation?: number
  /** Z-index relativo */
  z?: number
  /** Animação de entrada */
  animation?: ElementAnimation
  /** Bloqueado para edição (decorativo / estrutura) */
  locked?: boolean
  /** Não exibir (oculto pelo usuário) */
  hidden?: boolean
  /** Opacidade global do elemento (0-1). Usado para watermarks etc. */
  opacity?: number
}

export interface TextElement extends BaseElement {
  type: 'heading' | 'subheading' | 'text' | 'caption'
  content: string
  placeholder?: string
  fontSize: number
  fontWeight: 300 | 400 | 500 | 600 | 700 | 800 | 900
  color: ColorValue
  textAlign: 'left' | 'center' | 'right'
  italic?: boolean
  uppercase?: boolean
  letterSpacing?: number
  lineHeight?: number
  maxChars?: number
  /** Field key — se preenchido, esse texto é editável pelo painel rápido */
  fieldKey?: string
  fieldLabel?: string
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: ShapeKind
  fill: ColorValue
  stroke?: ColorValue
  strokeWidth?: number
  borderRadius?: number
  opacity?: number
}

export interface IconElement extends BaseElement {
  type: 'icon'
  /** Nome do ícone do lucide-react (ex: "Check", "Home", "Car") */
  icon: string
  color: ColorValue
  strokeWidth?: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string | null
  fit: 'cover' | 'contain'
  borderRadius?: number
  fieldKey?: string
  fieldLabel?: string
}

export interface LogoAdminElement extends BaseElement {
  type: 'logo-admin'
  /** Cor do texto/símbolo do logo */
  color?: ColorValue
}

export interface LogoCompanyElement extends BaseElement {
  type: 'logo-company'
  src: string | null
  fieldKey?: string
}

export interface StatCardElement extends BaseElement {
  type: 'stat-card'
  value: string
  label: string
  icon?: string
  bg: ColorValue
  valueColor: ColorValue
  labelColor: ColorValue
  fieldKeyValue?: string
  fieldKeyLabel?: string
  fieldLabel?: string
}

export interface ListItemElement extends BaseElement {
  type: 'list-item'
  bullet: ListBulletKind
  bulletNumber?: number
  text: string
  bulletColor: ColorValue
  textColor: ColorValue
  fontSize: number
  fieldKey?: string
  fieldLabel?: string
}

export interface ComparisonElement extends BaseElement {
  type: 'comparison'
  /** Lado: 'bad' = financiamento/outro investimento, 'good' = consórcio */
  side: 'bad' | 'good'
  label: string
  value: string
  description?: string
  bgColor: ColorValue
  fieldKeyValue?: string
  fieldKeyDesc?: string
  fieldLabel?: string
}

export interface TimelineStepElement extends BaseElement {
  type: 'timeline-step'
  step: number
  title: string
  description?: string
  bgColor: ColorValue
  textColor: ColorValue
  fieldKeyTitle?: string
  fieldKeyDesc?: string
  fieldLabel?: string
}

export interface MockupElement extends BaseElement {
  type: 'mockup'
  mockup: MockupKind
  /** Cor de destaque dentro do mockup (será resolvida em runtime) */
  accent?: ColorValue
}

export interface BadgeElement extends BaseElement {
  type: 'badge'
  text: string
  bg: ColorValue
  color: ColorValue
  fontSize: number
  uppercase?: boolean
}

export type SlideElement =
  | TextElement
  | ShapeElement
  | IconElement
  | ImageElement
  | LogoAdminElement
  | LogoCompanyElement
  | StatCardElement
  | ListItemElement
  | ComparisonElement
  | TimelineStepElement
  | MockupElement
  | BadgeElement

// ============================================================================
//  Slides
// ============================================================================

/**
 * Tipos semânticos de slide — usados para etiquetar a função do slide na
 * jornada de venda. O renderer usa o array `elements` para desenhar; o tipo
 * é só metadado.
 */
export type SlideKind =
  | 'cover'           // capa
  | 'apresentacao'    // empresa/vendedor
  | 'expectativas'    // alinhamento de expectativas
  | 'condicao'        // melhor condição (tipo de consórcio)
  | 'passos'          // passos até a contemplação
  | 'sistema'         // sistema Plano G
  | 'comparacao'      // consórcio vs outros investimentos
  | 'proposta'        // propostas + diferenciais
  | 'cta'             // próximos passos / contato
  | 'custom'

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'radial' | 'pattern' | 'theme'
  color: ColorValue
  /** segunda cor para gradient */
  color2?: ColorValue
  /** ângulo do gradient em graus */
  angle?: number
  /** padrão decorativo. 'theme' delega ao theme atual. */
  pattern?: 'dots' | 'grid' | 'blobs' | 'lines' | 'mesh' | 'noise' | 'art-deco' | 'diagonals'
}

export interface Slide {
  id: string
  kind: SlideKind
  title: string
  background: SlideBackground
  elements: SlideElement[]
  visible: boolean
  /** Override da animação de transição global */
  transition?: SlideTransition
}

// ============================================================================
//  Customização
// ============================================================================

export type FontFamily =
  | 'inter'
  | 'inter-tight'
  | 'playfair'
  | 'montserrat'
  | 'poppins'
  | 'rajdhani'
  | 'cormorant'
  | 'jetbrains-mono'
  | 'bebas-neue'
  | 'space-grotesk'
  | 'libre-baskerville'

/**
 * ID do theme aplicado (ver lib/presentations/themes.ts).
 * Mantido como `string` pra evitar dependência circular com themes.ts.
 */
export type ThemeIdRef = string

export interface PresentationCustomization {
  /** ID do theme visual (ver lib/presentations/themes.ts). */
  theme_id: ThemeIdRef
  /** ID da administradora — define a paleta automaticamente */
  admin_id: string
  /** Override manual da cor primária (se vazio, usa da administradora) */
  primary_override: string | null
  /** Override manual da cor secundária */
  secondary_override: string | null
  /** Cor de fundo escura padrão (ou override) */
  dark_override: string | null
  /** Logo da empresa do vendedor (URL pública do bucket) */
  company_logo_url: string | null
  /** Foto do vendedor (URL pública do bucket) */
  seller_photo_url: string | null
  /** Nome da empresa do vendedor */
  company_name: string
  /** Nome do vendedor */
  seller_name: string
  /** WhatsApp do vendedor */
  seller_phone: string
  /** Email do vendedor */
  seller_email: string
  font: FontFamily
  /** Animação de transição entre slides */
  transition: SlideTransition
  /** Velocidade global das animações: 0.5 = lenta, 1 = normal, 1.5 = rápida */
  animation_speed: number
}

// ============================================================================
//  Briefing — dados capturados pelo wizard ao criar uma apresentação
// ============================================================================

/**
 * Dados que o vendedor preenche no wizard ao criar uma apresentação. O sistema
 * usa esses dados para preencher automaticamente os fieldKeys dos elementos
 * dos slides, gerando uma apresentação personalizada de cara.
 */
export interface BriefingData {
  // ── Cliente ────────────────────────────────────────────────────
  client_name: string
  /** Sonho/contexto do cliente — ex: "Conquistar a casa própria" */
  client_context: string

  // ── Plano financeiro ───────────────────────────────────────────
  /** ID da administradora (ver lib/presentations/admin-colors.ts) */
  admin_id: string
  /** Valor do crédito formatado — ex: "R$ 350.000" */
  credit_value: string
  /** Parcela mensal formatada — ex: "R$ 1.890" */
  monthly_payment: string
  /** Prazo em texto — ex: "180 meses" */
  term_months: string
  /** Comparação opcional com financiamento — ex: "R$ 720.000" */
  financing_comparison: string

  // ── Vendedor ───────────────────────────────────────────────────
  seller_name: string
  /** Cargo / especialidade — ex: "Especialista em consórcios" */
  seller_role: string
  seller_phone: string
  seller_email: string
  /** URL pública da foto (Supabase Storage) */
  seller_photo_url: string | null
  /** Tempo de experiência — ex: "+10 anos no mercado" */
  seller_experience: string

  // ── Empresa ────────────────────────────────────────────────────
  company_name: string
  /** URL pública do logo (Supabase Storage) */
  company_logo_url: string | null
  /** Bio livre da empresa */
  company_about: string

  // ── Diferenciais (4 pontos do slide de proposta) ───────────────
  diff1: string
  diff2: string
  diff3: string
  diff4: string
}

// ============================================================================
//  Templates e apresentações
// ============================================================================

export type TemplateCategory = 'imovel' | 'auto' | 'servicos' | 'investimento' | 'universal'

export interface PresentationTemplate {
  id: string
  name: string
  description: string | null
  category: TemplateCategory
  thumbnail_url: string | null
  slides: Slide[]
  /** Customização padrão (cliente sobrescreve no editor) */
  default_customization: PresentationCustomization
  is_active: boolean
  sort_order: number
  /** Versão do schema — para migrar quando mudar */
  schema_version: 2
}

export interface Presentation {
  id: string
  title: string
  slides: Slide[]
  customization: PresentationCustomization
  share_token: string | null
  share_expires_at: string | null
  view_count: number
  last_viewed_at: string | null
  status: 'rascunho' | 'finalizada' | 'enviada' | 'visualizada'
  template_id: string | null
  lead_id: string | null
  tenant_id: string
  seller_id: string | null
  created_at: string
  updated_at: string
  schema_version: 2
}

// ============================================================================
//  Helpers
// ============================================================================

export function isTextElement(el: SlideElement): el is TextElement {
  return el.type === 'heading' || el.type === 'subheading' || el.type === 'text' || el.type === 'caption'
}

export function isEditable(el: SlideElement): boolean {
  if (el.locked) return false
  return true
}
