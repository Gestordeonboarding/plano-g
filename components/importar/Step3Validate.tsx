'use client'

import { useMemo } from 'react'
import { ColumnMapping } from './types'
import { CheckCircle, XCircle } from 'lucide-react'

interface ValidatedRow {
  index: number
  data: Record<string, string | number | null>
  errors: string[]
  valid: boolean
}

interface Props {
  rows: Record<string, string>[]
  mapping: ColumnMapping
  onComplete: (valid: ValidatedRow[], all: ValidatedRow[]) => void
  onBack: () => void
}

function parseNumber(v: string): number | null {
  if (!v) return null
  const n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseDate(v: string): string | null {
  if (!v) return null
  // tenta varios formatos
  const cleaned = v.trim()
  // dd/mm/yyyy
  const br = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  // yyyy-mm-dd already
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) return cleaned.slice(0, 10)
  // Excel serial date
  const serial = parseInt(cleaned)
  if (!isNaN(serial) && serial > 40000) {
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000))
    return date.toISOString().split('T')[0]
  }
  return null
}

function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(digits[10])
}

export function validateRows(rows: Record<string, string>[], mapping: ColumnMapping): ValidatedRow[] {
  return rows.map((row, i) => {
    const errors: string[] = []
    const get = (key: keyof ColumnMapping) => (mapping[key] ? row[mapping[key]] || '' : '')

    const full_name = get('full_name').trim()
    if (!full_name) errors.push('Nome obrigatório')

    const credit_str = get('credit_value')
    const credit_value = parseNumber(credit_str)
    if (!credit_value) errors.push('Valor do crédito inválido ou ausente')

    const cpf_raw = get('cpf').replace(/\D/g, '')
    if (cpf_raw && !validateCPF(cpf_raw)) errors.push('CPF inválido')

    const next_assembly_date = parseDate(get('next_assembly_date'))
    const installments_paid = parseNumber(get('installments_paid'))
    const total_installments = parseNumber(get('total_installments'))
    const monthly_installment = parseNumber(get('monthly_installment'))

    const rawStatus = get('status').toLowerCase()
    let status = 'ativo'
    if (rawStatus.includes('inadim')) status = 'inadimplente'
    else if (rawStatus.includes('contempl')) status = 'contemplado'
    else if (rawStatus.includes('cancel')) status = 'cancelado'

    return {
      index: i + 2,
      data: {
        full_name,
        cpf: cpf_raw || null,
        phone: get('phone') || null,
        group_number: get('group_number') || null,
        quota_number: get('quota_number') || null,
        credit_value,
        installments_paid: installments_paid ?? 0,
        total_installments,
        monthly_installment,
        next_assembly_date,
        status,
      },
      errors,
      valid: errors.length === 0,
    }
  })
}

export default function Step3Validate({ rows, mapping, onComplete, onBack }: Props) {
  const validated = useMemo(() => validateRows(rows, mapping), [rows, mapping])
  const valid = validated.filter((r) => r.valid)
  const invalid = validated.filter((r) => !r.valid)

  return (
    <div className="flex flex-col gap-5">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-pg p-4 flex items-center gap-3">
          <CheckCircle size={24} style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{valid.length}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Linhas válidas</p>
          </div>
        </div>
        <div className="card-pg p-4 flex items-center gap-3">
          <XCircle size={24} style={{ color: 'var(--danger)' }} />
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>{invalid.length}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Linhas com erro</p>
          </div>
        </div>
      </div>

      {/* Erros */}
      {invalid.length > 0 && (
        <div className="card-pg p-4 flex flex-col gap-2 max-h-60 overflow-y-auto">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Erros encontrados
          </p>
          {invalid.slice(0, 20).map((r) => (
            <div key={r.index} className="text-xs p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255,92,92,0.08)', color: 'var(--danger)' }}>
              <span className="font-semibold">Linha {r.index}:</span> {r.errors.join(' · ')}
            </div>
          ))}
          {invalid.length > 20 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              +{invalid.length - 20} erros adicionais...
            </p>
          )}
        </div>
      )}

      {valid.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          Nenhuma linha válida. Verifique o mapeamento de colunas.
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline text-sm">← Voltar</button>
        {valid.length > 0 && (
          <button onClick={() => onComplete(valid, validated)} className="btn-primary">
            Importar {valid.length} registro{valid.length !== 1 ? 's' : ''} →
          </button>
        )}
      </div>
    </div>
  )
}
