'use client'

import { useState } from 'react'
import Step1Upload from './Step1Upload'
import Step2Mapping from './Step2Mapping'
import Step3Validate, { validateRows } from './Step3Validate'
import Step4Import from './Step4Import'
import { ColumnMapping, EMPTY_MAPPING } from './types'

interface Props {
  tenantId: string
}

const STEPS = ['Upload', 'Mapeamento', 'Validação', 'Importação']

interface ValidatedRow {
  index: number
  data: Record<string, string | number | null>
  errors: string[]
  valid: boolean
}

export default function ImportWizard({ tenantId }: Props) {
  const [step, setStep] = useState(0)

  // Step 1
  const [fileData, setFileData] = useState<{
    rows: Record<string, string>[]
    headers: string[]
    administradora: string
    fileName: string
  } | null>(null)

  // Saved mappings per administradora (localStorage)
  const [savedMappings, setSavedMappings] = useState<Record<string, Record<string, string>>>(() => {
    try {
      return JSON.parse(localStorage.getItem('planog_mappings') || '{}')
    } catch { return {} }
  })

  // Step 2
  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING)

  // Step 3
  const [validRows, setValidRows] = useState<ValidatedRow[]>([])
  const [allRows, setAllRows] = useState<ValidatedRow[]>([])

  function handleSaveMapping(administradora: string, m: ColumnMapping) {
    const updated: Record<string, Record<string, string>> = { ...savedMappings, [administradora]: m as unknown as Record<string, string> }
    setSavedMappings(updated)
    try { localStorage.setItem('planog_mappings', JSON.stringify(updated)) } catch {}
  }

  function handleStep1Complete(data: typeof fileData) {
    if (!data) return
    setFileData(data)
    // Aplicar mapeamento salvo se existir
    if (savedMappings[data.administradora]) {
      setMapping({ ...EMPTY_MAPPING, ...savedMappings[data.administradora] } as ColumnMapping)
    } else {
      setMapping(EMPTY_MAPPING)
    }
    setStep(1)
  }

  function handleStep2Complete(m: ColumnMapping) {
    setMapping(m)
    setStep(2)
  }

  function handleStep3Complete(valid: ValidatedRow[], all: ValidatedRow[]) {
    setValidRows(valid)
    setAllRows(all)
    setStep(3)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                style={i <= step
                  ? { backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }
                  : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs whitespace-nowrap"
                style={{ color: i === step ? 'var(--accent)' : 'var(--text-muted)' }}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 flex-1 mx-2 mt-[-12px]"
                style={{ backgroundColor: i < step ? 'var(--accent)' : 'var(--border-color)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="card-pg p-6">
        {step === 0 && (
          <Step1Upload
            onComplete={handleStep1Complete}
            savedMappings={savedMappings}
          />
        )}
        {step === 1 && fileData && (
          <Step2Mapping
            headers={fileData.headers}
            administradora={fileData.administradora}
            savedMapping={savedMappings[fileData.administradora] || null}
            onComplete={handleStep2Complete}
            onSaveMapping={handleSaveMapping}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && fileData && (
          <Step3Validate
            rows={fileData.rows}
            mapping={mapping}
            onComplete={handleStep3Complete}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && fileData && (
          <Step4Import
            validRows={validRows}
            allRows={allRows}
            tenantId={tenantId}
            administradora={fileData.administradora}
            fileName={fileData.fileName}
            mapping={mapping as unknown as Record<string, string>}
          />
        )}
      </div>
    </div>
  )
}
