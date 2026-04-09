export type SlideType =
  | 'cover' | 'problem' | 'solution' | 'numbers'
  | 'comparison' | 'timeline' | 'testimonial' | 'about' | 'cta' | 'custom'

export type FieldType = 'text' | 'number' | 'currency' | 'image' | 'color' | 'textarea' | 'select'

export interface EditableField {
  key: string
  label: string
  type: FieldType
  value: string
  placeholder: string
  required: boolean
  options?: string[]
  max_chars?: number
}

export interface Slide {
  id: string
  type: SlideType
  title: string
  editable_fields: EditableField[]
  layout: 'full' | 'split' | 'centered' | 'cards'
  background: 'dark' | 'accent' | 'image'
  locked: boolean
  visible: boolean
}

export interface PresentationTheme {
  accent_color: string
  bg_color: string
  font: 'inter' | 'playfair' | 'montserrat'
  show_logo: boolean
}

export interface PresentationTemplate {
  id: string
  name: string
  description: string | null
  category: string
  thumbnail_url: string | null
  slides: Slide[]
  theme: PresentationTheme
  animation_style: 'fade' | 'slide' | 'zoom' | 'flip'
  is_active: boolean
  sort_order: number
}

export interface Presentation {
  id: string
  title: string
  slides: Slide[]
  customization: PresentationTheme
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
}
