/**
 * Carregamento de templates do banco.
 *
 * No modelo novo (v3), templates NÃO ficam mais hardcoded em código.
 * Eles vivem na tabela `presentation_templates` do Supabase, com:
 *   - purpose, target_audience (descrição)
 *   - fields (definição dinâmica do briefing)
 *   - slides (estrutura tipada)
 *   - theme (cores/font/style)
 *
 * Este arquivo só expõe funções de fetch. Sem dados hardcoded.
 */

import { createClient as createAdmin } from '@supabase/supabase-js'
import { PresentationTemplate } from './types'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

/**
 * Carrega todos os templates ativos, ordenados por sort_order.
 * Usado pela página da biblioteca.
 */
export async function fetchActiveTemplates(): Promise<PresentationTemplate[]> {
  const { data, error } = await supabaseAdmin
    .from('presentation_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[templates-data] fetchActiveTemplates error:', error)
    return []
  }

  return (data ?? []) as PresentationTemplate[]
}

/**
 * Carrega UM template pelo ID.
 */
export async function fetchTemplateById(id: string): Promise<PresentationTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from('presentation_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[templates-data] fetchTemplateById error:', error)
    return null
  }

  return data as PresentationTemplate
}
