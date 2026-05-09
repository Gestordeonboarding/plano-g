'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Sparkles, User, DollarSign,
  Briefcase, Award, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { PresentationTemplate, BriefingData } from '@/lib/presentations/types'
import { ADMIN_PALETTES, getPalette } from '@/lib/presentations/admin-colors'
import {
  applyBriefing,
  DEFAULT_DIFFS_BY_CATEGORY,
  DEFAULT_CONTEXT_BY_CATEGORY,
} from '@/lib/presentations/apply-briefing'
import ImageUpload from './ImageUpload'

interface Props {
  template: PresentationTemplate
  tenantId: string
  sellerId: string
  defaultSellerName?: string
  defaultSellerPhone?: string
  defaultSellerEmail?: string
  defaultCompanyName?: string
}

const STEPS = [
  { id: 'cliente', label: 'Cliente', icon: User },
  { id: 'plano', label: 'Plano', icon: DollarSign },
  { id: 'vendedor', label: 'Você', icon: Briefcase },
  { id: 'diferenciais', label: 'Diferenciais', icon: Award },
] as const

export default function BriefingWizard({
  template,
  tenantId,
  sellerId,
  defaultSellerName,
  defaultSellerPhone,
  defaultSellerEmail,
  defaultCompanyName,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cat = template.category
  const defaultDiffs = DEFAULT_DIFFS_BY_CATEGORY[cat] || DEFAULT_DIFFS_BY_CATEGORY.universal
  const defaultContext = DEFAULT_CONTEXT_BY_CATEGORY[cat] || ''
  const palette = getPalette(template.default_customization.admin_id)

  const [data, setData] = useState<BriefingData>({
    client_name: '',
    client_context: defaultContext,
    admin_id: template.default_customization.admin_id,
    credit_value: '',
    monthly_payment: '',
    term_months: '',
    financing_comparison: '',
    seller_name: defaultSellerName || '',
    seller_role: 'Especialista em consórcios',
    seller_phone: defaultSellerPhone || '',
    seller_email: defaultSellerEmail || '',
    seller_photo_url: null,
    seller_experience: '+10 anos no mercado',
    company_name: defaultCompanyName || '',
    company_logo_url: null,
    company_about: 'Atuamos no mercado de consórcios há mais de 10 anos, ajudando centenas de famílias a realizar seus sonhos com inteligência financeira.',
    diff1: defaultDiffs[0],
    diff2: defaultDiffs[1],
    diff3: defaultDiffs[2],
    diff4: defaultDiffs[3],
  })

  function set<K extends keyof BriefingData>(k: K, v: BriefingData[K]) {
    setData((d) => ({ ...d, [k]: v }))
  }

  function canProceed(): boolean {
    if (step === 0) return data.client_name.trim().length > 0
    if (step === 1) return data.credit_value.trim().length > 0
    if (step === 2) return data.seller_name.trim().length > 0
    return true
  }

  function nextStep() {
    if (step < STEPS.length - 1 && canProceed()) setStep((s) => s + 1)
  }

  function prevStep() {
    if (step > 0) setStep((s) => s - 1)
  }

  async function handleGenerate() {
    setSaving(true)
    setError(null)
    try {
      const { slides, customization } = applyBriefing(template, data)
      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${template.name} — ${data.client_name}`,
          slides,
          customization,
          status: 'rascunho',
          tenant_id: tenantId,
          seller_id: sellerId,
          template_id: template.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error || 'Erro ao criar apresentação')
      }
      const created = await res.json() as { id: string }
      router.push(`/dashboard/apresentacoes/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  const currentStep = STEPS[step]

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-2">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/apresentacoes"
          className="flex items-center gap-1.5 text-sm w-fit"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={13} /> Voltar para templates
        </Link>
        <div className="flex items-start gap-3">
          <span
            className="inline-block w-3 h-3 rounded-full mt-2 shrink-0"
            style={{ backgroundColor: palette.primary }}
          />
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider"
              style={{ color: palette.primary, letterSpacing: 2 }}>
              {template.name}
            </p>
            <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              Vamos personalizar sua proposta
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Em 4 passos rápidos o sistema gera a apresentação preenchida — você só ajusta os detalhes finais.
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active = i === step
          const done = i < step
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className="flex flex-col items-center gap-1.5 transition-all"
                style={{ cursor: i < step ? 'pointer' : 'default' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: done
                      ? 'var(--accent)'
                      : active ? 'rgba(0,212,200,0.15)' : 'var(--bg-tertiary)',
                    color: done
                      ? 'var(--bg-primary)'
                      : active ? 'var(--accent)' : 'var(--text-muted)',
                    border: active ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  <Icon size={15} />
                </div>
                <span
                  className="text-[10px] font-medium whitespace-nowrap"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-2"
                  style={{
                    backgroundColor: i < step ? 'var(--accent)' : 'var(--border-color)',
                    marginTop: -16,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Card do step */}
      <div className="card-pg p-6 flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide"
            style={{ color: 'var(--text-muted)', letterSpacing: 1.5 }}>
            Passo {step + 1} de {STEPS.length}
          </p>
          <h2 className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
            {step === 0 && 'Sobre o cliente'}
            {step === 1 && 'O plano financeiro'}
            {step === 2 && 'Sobre você e a empresa'}
            {step === 3 && 'Seus diferenciais'}
          </h2>
        </div>

        {step === 0 && <StepCliente data={data} set={set} />}
        {step === 1 && <StepPlano data={data} set={set} />}
        {step === 2 && <StepVendedor data={data} set={set} />}
        {step === 3 && <StepDiferenciais data={data} set={set} />}
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg"
          style={{ color: 'var(--danger)', backgroundColor: 'rgba(255,92,92,0.10)' }}>
          {error}
        </p>
      )}

      {/* Ações */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 0 || saving}
          className="btn-outline text-sm flex items-center gap-1.5 disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Voltar
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            Próximo <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={saving}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {saving ? 'Gerando...' : 'Gerar apresentação'}
          </button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
//  Steps
// ──────────────────────────────────────────────────────────

type SetFn = <K extends keyof BriefingData>(k: K, v: BriefingData[K]) => void

function StepCliente({ data, set }: { data: BriefingData; set: SetFn }) {
  return (
    <>
      <Field label="Nome completo do cliente" required>
        <input
          className="input-pg"
          value={data.client_name}
          onChange={(e) => set('client_name', e.target.value)}
          placeholder="Ex: João da Silva"
          autoFocus
        />
      </Field>
      <Field
        label="Sonho ou contexto do cliente"
        hint="Aparece em capas e textos. Pode editar depois."
      >
        <input
          className="input-pg"
          value={data.client_context}
          onChange={(e) => set('client_context', e.target.value)}
          placeholder="Ex: Conquistar a casa própria"
        />
      </Field>
    </>
  )
}

function StepPlano({ data, set }: { data: BriefingData; set: SetFn }) {
  return (
    <>
      <Field label="Administradora" hint="A paleta da apresentação se ajusta automaticamente">
        <select
          className="input-pg"
          value={data.admin_id}
          onChange={(e) => set('admin_id', e.target.value)}
        >
          {ADMIN_PALETTES.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Crédito (R$)" required>
          <input
            className="input-pg"
            value={data.credit_value}
            onChange={(e) => set('credit_value', e.target.value)}
            placeholder="R$ 350.000"
          />
        </Field>
        <Field label="Parcela mensal">
          <input
            className="input-pg"
            value={data.monthly_payment}
            onChange={(e) => set('monthly_payment', e.target.value)}
            placeholder="R$ 1.890"
          />
        </Field>
        <Field label="Prazo">
          <input
            className="input-pg"
            value={data.term_months}
            onChange={(e) => set('term_months', e.target.value)}
            placeholder="180 meses"
          />
        </Field>
      </div>

      <Field
        label="Custo total no financiamento (opcional)"
        hint="Para o slide de comparação consórcio vs financiamento"
      >
        <input
          className="input-pg"
          value={data.financing_comparison}
          onChange={(e) => set('financing_comparison', e.target.value)}
          placeholder="Ex: R$ 720.000"
        />
      </Field>
    </>
  )
}

function StepVendedor({ data, set }: { data: BriefingData; set: SetFn }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Seu nome" required>
          <input
            className="input-pg"
            value={data.seller_name}
            onChange={(e) => set('seller_name', e.target.value)}
            placeholder="Ana Silva"
          />
        </Field>
        <Field label="Cargo / especialidade">
          <input
            className="input-pg"
            value={data.seller_role}
            onChange={(e) => set('seller_role', e.target.value)}
            placeholder="Especialista em consórcios"
          />
        </Field>
        <Field label="WhatsApp">
          <input
            className="input-pg"
            value={data.seller_phone}
            onChange={(e) => set('seller_phone', e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            className="input-pg"
            value={data.seller_email}
            onChange={(e) => set('seller_email', e.target.value)}
            placeholder="voce@empresa.com"
          />
        </Field>
        <Field label="Experiência (badge)" hint="Aparece como destaque ao lado da foto">
          <input
            className="input-pg"
            value={data.seller_experience}
            onChange={(e) => set('seller_experience', e.target.value)}
            placeholder="+10 anos no mercado"
          />
        </Field>
      </div>

      <ImageUpload
        value={data.seller_photo_url}
        onChange={(url) => set('seller_photo_url', url)}
        kind="photo"
        label="Sua foto"
        hint="Aparece no slide de apresentação. Recomendado: 500×500px"
        shape="circle"
        size={88}
      />

      <div className="grid grid-cols-2 gap-3 items-start">
        <Field label="Nome da empresa">
          <input
            className="input-pg"
            value={data.company_name}
            onChange={(e) => set('company_name', e.target.value)}
            placeholder="Sua Empresa Ltda"
          />
        </Field>
        <ImageUpload
          value={data.company_logo_url}
          onChange={(url) => set('company_logo_url', url)}
          kind="logo"
          label="Logo da empresa"
          hint="PNG transparente ideal"
          shape="rect"
          size={72}
        />
      </div>

      <Field
        label="Sobre a empresa"
        hint="Texto livre que aparece no slide de apresentação"
      >
        <textarea
          className="input-pg resize-none"
          rows={3}
          value={data.company_about}
          onChange={(e) => set('company_about', e.target.value)}
        />
      </Field>
    </>
  )
}

function StepDiferenciais({ data, set }: { data: BriefingData; set: SetFn }) {
  return (
    <>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Os 4 diferenciais aparecem no slide de proposta final. Pré-preenchemos com sugestões da
        categoria do template — ajuste como achar melhor.
      </p>
      {([1, 2, 3, 4] as const).map((n) => {
        const key = `diff${n}` as 'diff1' | 'diff2' | 'diff3' | 'diff4'
        return (
          <Field key={n} label={`Diferencial ${n}`}>
            <input
              className="input-pg"
              value={data[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </Field>
        )
      })}
    </>
  )
}

// ──────────────────────────────────────────────────────────
//  Field wrapper
// ──────────────────────────────────────────────────────────

function Field({
  label, hint, required, children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
    </div>
  )
}
