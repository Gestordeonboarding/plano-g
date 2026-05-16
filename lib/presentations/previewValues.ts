/**
 * Gera valores de demonstração pra renderizar thumbnails da biblioteca
 * de templates SEM exigir que o vendedor preencha briefing antes.
 *
 * A ideia: a partir do `fields` de cada template, inferir valores
 * razoáveis pra cada campo (placeholder, primeira option, valor exemplo
 * pra moeda) — assim os thumbnails mostram conteúdo realista em vez
 * de "{{client_name}}" literal.
 */

import { FieldDef, FieldValues } from './interpolate'

/**
 * Gera valores de preview pra cada field do template. Heurísticas:
 *  - currency: usa exemplo numérico baseado na chave (credit, installment, etc)
 *  - select: usa a primeira option
 *  - text com chaves conhecidas (client_name, seller_name, company_name): nomes plausíveis
 *  - resto: usa o placeholder sem "Ex: "
 */
export function generatePreviewValues(fields: FieldDef[]): FieldValues {
  const values: FieldValues = {}

  for (const field of fields) {
    if (field.type === 'currency') {
      values[field.key] = currencyPreview(field.key)
    } else if (field.type === 'select' && field.options?.length) {
      values[field.key] = field.options[0]
    } else {
      values[field.key] = textPreview(field.key, field.placeholder)
    }
  }

  return values
}

// ----------------------------------------------------------------------------
// Heurísticas internas
// ----------------------------------------------------------------------------

function currencyPreview(key: string): string {
  const lower = key.toLowerCase()
  if (lower.includes('total')) return 'R$ 600.000'
  if (lower.includes('credit') || lower.includes('credito')) return 'R$ 300.000'
  if (lower.includes('installment') || lower.includes('parcela')) return 'R$ 1.400'
  if (lower.includes('income') || lower.includes('renda')) return 'R$ 8.000'
  if (lower.includes('unit')) return 'R$ 120.000'
  if (lower.includes('bank')) return 'R$ 3.200'
  if (lower.includes('consortium')) return 'R$ 1.400'
  return 'R$ 5.000'
}

function textPreview(key: string, placeholder?: string): string {
  const lower = key.toLowerCase()

  // Nomes plausíveis pra chaves conhecidas
  if (lower === 'client_name') return 'Maria Silva'
  if (lower === 'contact_name') return 'João Souza'
  if (lower === 'company_client_name') return 'Transportes Silva Ltda'
  if (lower === 'seller_name') return 'Carlos Oliveira'
  if (lower === 'company_name') return 'Consórcios Exemplo'
  if (lower === 'seller_phone' || lower.includes('whatsapp')) return '(51) 99999-9999'
  if (lower === 'client_dream') return 'a casa própria da minha família'
  if (lower === 'fleet_size') return '5 veículos'
  if (lower === 'bank_rate') return '12,5'

  // Fallback: usa o placeholder removendo "Ex: "
  if (placeholder) {
    return placeholder.replace(/^Ex:\s*/i, '').trim()
  }

  return ''
}
