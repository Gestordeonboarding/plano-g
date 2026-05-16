'use client'

/**
 * Briefing dinâmico — lê os campos específicos do template (template.fields)
 * e renderiza um formulário adequado a cada um.
 *
 * Tipos suportados: text, currency, select.
 *
 * Ao submeter, valida required, salva a presentation no banco com os
 * field_values preenchidos e redireciona pro editor.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  PresentationTemplate,
  FieldDef,
  FieldValues,
} from '@/lib/presentations/types'
import { validateBriefing } from '@/lib/presentations/validate'
import { formatCurrencyBR } from '@/lib/presentations/interpolate'

interface Props {
  template: PresentationTemplate
  tenantId: string
  sellerId: string
  defaultSellerName?: string
  defaultSellerPhone?: string
  defaultCompanyName?: string
}

export default function BriefingWizard({
  template,
  tenantId,
  sellerId,
  defaultSellerName,
  defaultSellerPhone,
  defaultCompanyName,
}: Props) {
  const router = useRouter()
  const fields = (template.fields ?? []) as FieldDef[]

  const [values, setValues] = useState<FieldValues>(() => {
    // Pré-preenche campos conhecidos com defaults do servidor
    const initial: FieldValues = {}
    for (const f of fields) {
      if (f.key === 'seller_name' && defaultSellerName) initial[f.key] = defaultSellerName
      else if (f.key === 'seller_phone' && defaultSellerPhone) initial[f.key] = defaultSellerPhone
      else if (f.key === 'company_name' && defaultCompanyName) initial[f.key] = defaultCompanyName
      else initial[f.key] = ''
    }
    return initial
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  async function handleGenerate() {
    setServerError(null)

    const result = validateBriefing(values, fields)
    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('presentations')
        .insert({
          title: `Proposta — ${values.client_name || values.company_client_name || values.contact_name || template.name}`,
          template_id: template.id,
          tenant_id: tenantId,
          seller_id: sellerId,
          slides: template.slides,
          customization: {
            field_values: values,
            company_logo_url: null,
            seller_photo_url: null,
            theme: template.theme,
          },
          status: 'rascunho',
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      const presentationId = (data as { id: string }).id
      router.push(`/dashboard/apresentacoes/${presentationId}`)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--g-bg-root)', padding: '0 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0' }}>
        <Link
          href="/dashboard/apresentacoes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--g-text-muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Voltar à biblioteca
        </Link>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Template info */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--g-accent)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <Sparkles size={12} />
            {template.name}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--g-text-primary)', marginBottom: 8 }}>
            Preencha os dados da apresentação
          </h1>
          <p style={{ fontSize: 14, color: 'var(--g-text-muted)' }}>
            {template.purpose || template.description}
          </p>
        </div>

        {/* Fields dinâmicos */}
        <div
          style={{
            background: 'var(--g-bg-surface)',
            border: '1px solid var(--g-border)',
            borderRadius: 12,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              onChange={(v) => setValue(field.key, v)}
            />
          ))}

          {serverError && (
            <div
              style={{
                background: 'var(--g-danger-bg)',
                border: '1px solid var(--g-danger-border)',
                color: 'var(--g-danger-text)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {serverError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={saving}
            style={{
              marginTop: 8,
              width: '100%',
              background: 'var(--g-accent)',
              color: 'var(--g-bg-root)',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Gerando...' : 'Gerar apresentação →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  Renderer de campo individual
// ============================================================================

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldDef
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 11,
          color: 'var(--g-text-muted)',
          display: 'block',
          marginBottom: 5,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {field.label}
        {field.required && <span style={{ color: 'var(--g-accent)', marginLeft: 4 }}>*</span>}
      </label>

      {field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ borderColor: error ? 'var(--g-danger-text)' : undefined }}
        >
          <option value="">Selecione...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === 'currency' ? (
        <input
          type="text"
          inputMode="numeric"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            const formatted = digits
              ? new Intl.NumberFormat('pt-BR').format(parseInt(digits, 10))
              : ''
            onChange(formatted)
          }}
          onBlur={(e) => {
            // Ao perder foco, formata como moeda completa
            if (e.target.value.trim()) {
              const digits = e.target.value.replace(/\D/g, '')
              if (digits) {
                onChange(formatCurrencyBR(parseInt(digits, 10)))
              }
            }
          }}
          style={{ borderColor: error ? 'var(--g-danger-text)' : undefined }}
        />
      ) : (
        <input
          type="text"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ borderColor: error ? 'var(--g-danger-text)' : undefined }}
        />
      )}

      {error && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--g-danger-text)',
            marginTop: 4,
            display: 'block',
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}

// Expose ChevronLeft pra evitar dead import warning sem usar
// (mantido caso queiramos adicionar wizard multi-step depois)
export { ChevronLeft }
