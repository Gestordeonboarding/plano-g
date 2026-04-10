'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings } from 'lucide-react'

export default function ZApiSetup({ userId }: { userId: string }) {
  const router = useRouter()
  const [instanceId, setInstanceId] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!instanceId.trim() || !token.trim()) {
      setError('Preencha os dois campos.')
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('users')
      .update({ zapi_instance_id: instanceId.trim(), zapi_token: token.trim() })
      .eq('id', userId)
    if (err) {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
      return
    }
    router.refresh()
  }

  return (
    <div className="card-pg p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
          <Settings size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Configurar minha instância WhatsApp
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Insira as credenciais da sua instância Z-API para conectar seu número
          </p>
        </div>
      </div>

      <div className="rounded-xl p-4 text-sm flex flex-col gap-1"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Onde encontrar as credenciais:</p>
        <p>1. Acesse <strong style={{ color: 'var(--text-primary)' }}>z-api.io</strong> com seu login</p>
        <p>2. Vá em <strong style={{ color: 'var(--text-primary)' }}>Instâncias Web → clique na instância</strong></p>
        <p>3. Clique em <strong style={{ color: 'var(--text-primary)' }}>Credenciais</strong> e copie o Instance ID e o Token</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Instance ID
          </label>
          <input
            className="input-pg"
            placeholder="Ex: 3E12FA16850140EC05F02242E60F9610"
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Token
          </label>
          <input
            className="input-pg"
            placeholder="Ex: FECEDCB366352AD4D41382EC"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-fit disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar e conectar'}
        </button>
      </form>
    </div>
  )
}
