/**
 * Validação dos campos do briefing antes de avançar para o editor.
 * Bloqueia se algum campo obrigatório está vazio.
 */

import { FieldValues, FieldDef } from './interpolate'

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Valida os valores do briefing contra a definição de campos do template.
 * Retorna { valid: false, errors: {...} } se algum required estiver vazio.
 */
export function validateBriefing(
  fieldValues: FieldValues,
  fields: FieldDef[],
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    if (!field.required) continue
    const value = fieldValues[field.key] ?? ''
    if (!value.trim()) {
      errors[field.key] = `${field.label ?? field.key} é obrigatório`
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
