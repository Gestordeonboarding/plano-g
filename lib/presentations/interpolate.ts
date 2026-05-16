/**
 * Sistema de variáveis pros slides.
 *
 * Substitui {{key}} pelos valores do briefing, formatando moeda e
 * outros tipos automaticamente. Usado pelo SlideRenderer pra
 * personalizar textos antes de renderizar.
 *
 * Ex: "Olá, {{client_name}}!" + { client_name: "João" }
 *     → "Olá, João!"
 */

export type FieldValues = Record<string, string>

export interface FieldDef {
  key: string
  type: string
  placeholder?: string
  options?: string[]
  label?: string
  required?: boolean
}

// ----------------------------------------------------------------------------
// Substituição básica de {{key}}
// ----------------------------------------------------------------------------

/**
 * Substitui ocorrências de {{key}} em uma string. Se a chave não existir
 * ou estiver vazia, MANTÉM o {{key}} original (útil pra detectar campos
 * não preenchidos no preview).
 */
export function interpolate(template: string, values: FieldValues): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = values[key]
    if (!value || value.trim() === '') return match
    return value
  })
}

/**
 * Aplica interpolação em todas as strings de um objeto/slide.
 * Usa JSON round-trip pra processar recursivamente.
 */
export function interpolateSlide<T>(slide: T, values: FieldValues): T {
  return JSON.parse(interpolate(JSON.stringify(slide), values)) as T
}

// ----------------------------------------------------------------------------
// Formatação por tipo
// ----------------------------------------------------------------------------

/**
 * Formata valor pra moeda brasileira. Aceita string ou number.
 * - "300000" → "R$ 300.000"
 * - "1400.50" → "R$ 1.400,50"
 * - 1400 → "R$ 1.400"
 */
export function formatCurrencyBR(value: string | number): string {
  if (value === null || value === undefined || value === '') return ''

  let num: number
  if (typeof value === 'number') {
    num = value
  } else {
    // Remove tudo que não é dígito, vírgula ou ponto
    const cleaned = String(value).replace(/[^\d,.-]/g, '')
    // Se tem vírgula, trata como separador decimal BR
    const normalized = cleaned.includes(',')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned
    num = parseFloat(normalized)
  }

  if (isNaN(num)) return ''

  // Sem decimais se for inteiro, com decimais caso contrário
  const hasDecimal = num % 1 !== 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Formata telefone BR. Aceita 10 ou 11 dígitos.
 * - "51999999999" → "(51) 99999-9999"
 * - "1133334444"  → "(11) 3333-4444"
 */
export function formatPhoneBR(value: string): string {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return value
}

// ----------------------------------------------------------------------------
// Pipeline: processa valores brutos do briefing antes de interpolar
// ----------------------------------------------------------------------------

/**
 * Processa os valores brutos do briefing aplicando formatação por tipo.
 * - currency → R$ X.XXX
 * - text → trim
 * - phone (heurística) → (XX) XXXXX-XXXX
 *
 * Não modifica o objeto original.
 */
export function processFieldValues(
  rawValues: FieldValues,
  fields: FieldDef[],
): FieldValues {
  const processed: FieldValues = {}

  for (const field of fields) {
    const raw = rawValues[field.key] ?? ''

    if (!raw.trim()) {
      processed[field.key] = ''
      continue
    }

    if (field.type === 'currency') {
      processed[field.key] = formatCurrencyBR(raw)
    } else if (field.key.toLowerCase().includes('phone') || field.key.toLowerCase().includes('whatsapp')) {
      processed[field.key] = formatPhoneBR(raw)
    } else {
      processed[field.key] = raw.trim()
    }
  }

  return processed
}
