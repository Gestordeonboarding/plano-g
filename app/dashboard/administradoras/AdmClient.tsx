'use client'

import { useState, useCallback } from 'react'
import { Plus, X, ChevronDown, ToggleLeft, ToggleRight, Pencil, Trash2, TrendingUp, Building2, LayoutGrid, FileText } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────
type Adm = { id: string; nome: string; slug: string; cor: string }
type TAdm = {
  id: string
  taxa_administracao: number
  fundo_reserva: number
  comissao_venda: number
  comissao_lance: number
  ativa: boolean
  administradora: Adm
}
type Carta = {
  id: string
  tenant_administradora_id: string
  tipo: string
  valor_credito: number
  prazo_meses: number
  parcela_estimada: number | null
  contemplacao_media: number | null
  disponivel: boolean
  descricao: string | null
}

const TIPOS: Record<string, string> = {
  imovel: 'Imóvel', auto: 'Automóvel', moto: 'Moto', servico: 'Serviço', outros: 'Outros',
}

const TIPO_ICONS: Record<string, string> = {
  imovel: '🏠', auto: '🚗', moto: '🏍️', servico: '⚙️', outros: '📦',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

// ── Componente Inicial de cada Administradora ──────────────────────
function AdmLogo({ adm, size = 40 }: { adm: Adm; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: `${adm.cor}20`, border: `2px solid ${adm.cor}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 800, color: adm.cor,
    }}>
      {adm.nome.charAt(0)}
    </div>
  )
}

// ── Modal genérico ─────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 20, padding: '28px 32px',
        width: '100%', maxWidth: 520, border: '1px solid var(--border-color)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Input numérico reutilizável ────────────────────────────────────
function NumInput({ label, value, onChange, suffix = '%', hint }: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
        <input
          type="number" step="0.01" value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, padding: '10px 12px', background: 'var(--bg-primary)',
            border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15,
          }}
        />
        <span style={{ padding: '0 12px', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-color)' }}>
          {suffix}
        </span>
      </div>
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

// ── Modal configurar taxas ─────────────────────────────────────────
function ModalTaxas({ adm, initial, onSave, onClose }: {
  adm: Adm
  initial?: TAdm
  onSave: (data: { taxa_administracao: number; fundo_reserva: number; comissao_venda: number; comissao_lance: number }) => Promise<void>
  onClose: () => void
}) {
  const [taxa, setTaxa] = useState(String(initial?.taxa_administracao ?? ''))
  const [fundo, setFundo] = useState(String(initial?.fundo_reserva ?? ''))
  const [comVenda, setComVenda] = useState(String(initial?.comissao_venda ?? ''))
  const [comLance, setComLance] = useState(String(initial?.comissao_lance ?? ''))
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    await onSave({
      taxa_administracao: parseFloat(taxa) || 0,
      fundo_reserva: parseFloat(fundo) || 0,
      comissao_venda: parseFloat(comVenda) || 0,
      comissao_lance: parseFloat(comLance) || 0,
    })
    setLoading(false)
  }

  return (
    <Modal title={`Configurar ${adm.nome}`} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: `${adm.cor}10`, borderRadius: 12 }}>
        <AdmLogo adm={adm} />
        <div>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{adm.nome}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Defina as taxas que você pratica com essa administradora</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <NumInput label="Taxa de Administração" value={taxa} onChange={setTaxa} hint="Cobrada sobre o crédito total" />
        <NumInput label="Fundo de Reserva" value={fundo} onChange={setFundo} hint="Cobrado sobre o crédito total" />
        <NumInput label="Comissão na Venda" value={comVenda} onChange={setComVenda} hint="Sua comissão por cota vendida" />
        <NumInput label="Comissão no Lance" value={comLance} onChange={setComLance} hint="Comissão em lances contemplados" />
      </div>

      <button
        onClick={handleSave} disabled={loading}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: adm.cor, color: '#fff', fontWeight: 800, fontSize: 15,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </Modal>
  )
}

// ── Modal adicionar/editar carta ────────────────────────────────────
function ModalCarta({ tadmId, initial, onSave, onClose }: {
  tadmId: string
  initial?: Carta
  onSave: (data: Omit<Carta, 'id' | 'tenant_administradora_id' | 'disponivel'>) => Promise<void>
  onClose: () => void
}) {
  const [tipo, setTipo] = useState(initial?.tipo ?? 'imovel')
  const [valor, setValor] = useState(String(initial?.valor_credito ?? ''))
  const [prazo, setPrazo] = useState(String(initial?.prazo_meses ?? ''))
  const [parcela, setParcela] = useState(String(initial?.parcela_estimada ?? ''))
  const [contemp, setContemp] = useState(String(initial?.contemplacao_media ?? ''))
  const [descricao, setDescricao] = useState(initial?.descricao ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!valor || !prazo) return
    setLoading(true)
    await onSave({
      tipo,
      valor_credito: parseFloat(valor),
      prazo_meses: parseInt(prazo),
      parcela_estimada: parcela ? parseFloat(parcela) : null,
      contemplacao_media: contemp ? parseFloat(contemp) : null,
      descricao: descricao || null,
    })
    setLoading(false)
  }

  return (
    <Modal title={initial ? 'Editar Carta' : 'Adicionar Carta'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* Tipo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tipo de Carta
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(TIPOS).map(([k, v]) => (
              <button key={k} onClick={() => setTipo(k)} style={{
                padding: '7px 14px', borderRadius: 20, border: '1.5px solid',
                borderColor: tipo === k ? 'var(--accent)' : 'var(--border-color)',
                background: tipo === k ? 'rgba(0,212,200,0.1)' : 'transparent',
                color: tipo === k ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}>
                {TIPO_ICONS[k]} {v}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <NumInput label="Valor do Crédito (R$)" value={valor} onChange={setValor} suffix="R$" hint="Ex: 200000" />
          <NumInput label="Prazo" value={prazo} onChange={setPrazo} suffix="meses" hint="Ex: 200" />
          <NumInput label="Parcela Estimada (R$)" value={parcela} onChange={setParcela} suffix="R$" hint="Opcional" />
          <NumInput label="Contemplação Média" value={contemp} onChange={setContemp} hint="% histórica — opcional" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Descrição / Observação
          </label>
          <textarea
            value={descricao} onChange={(e) => setDescricao(e.target.value)}
            rows={2} placeholder="Ex: Carta com lance embutido disponível…"
            style={{
              padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical',
              fontSize: 14, outline: 'none',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleSave} disabled={loading || !valor || !prazo}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'var(--accent)', color: 'var(--bg-primary)', fontWeight: 800, fontSize: 15,
          opacity: loading || !valor || !prazo ? 0.6 : 1,
        }}
      >
        {loading ? 'Salvando…' : initial ? 'Salvar alterações' : 'Adicionar Carta'}
      </button>
    </Modal>
  )
}

// ── Componente principal ───────────────────────────────────────────
export default function AdmClient({
  allAdministradoras, initialTenantAdm, initialCartas,
}: {
  allAdministradoras: Adm[]
  initialTenantAdm: TAdm[]
  initialCartas: Carta[]
}) {
  const [tab, setTab] = useState<'administradoras' | 'cartas' | 'comparativo'>('administradoras')
  const [tenantAdm, setTenantAdm] = useState<TAdm[]>(initialTenantAdm)
  const [cartas, setCartas] = useState<Carta[]>(initialCartas)

  // Modals
  const [modalTaxas, setModalTaxas] = useState<{ adm: Adm; existing?: TAdm } | null>(null)
  const [modalCarta, setModalCarta] = useState<{ tadmId: string; existing?: Carta } | null>(null)
  const [cartaTab, setCartaTab] = useState<string>('') // selected tadm id for cartas tab

  // Comparativo
  const [cmpTipo, setCmpTipo] = useState('imovel')
  const [cmpValor, setCmpValor] = useState('')

  // ── Handlers administradoras ────────────────────────────────────
  async function handleAddAdm(adm: Adm) {
    // Se já existe, só abre configuração
    const existing = tenantAdm.find((t) => t.administradora.id === adm.id)
    setModalTaxas({ adm, existing })
  }

  async function handleSaveTaxas(data: { taxa_administracao: number; fundo_reserva: number; comissao_venda: number; comissao_lance: number }) {
    if (!modalTaxas) return
    const existing = tenantAdm.find((t) => t.administradora.id === modalTaxas.adm.id)

    if (existing) {
      const res = await fetch(`/api/tenant-administradoras/${existing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const { tenant_administradora } = await res.json() as { tenant_administradora: TAdm }
      setTenantAdm((prev) => prev.map((t) => t.id === existing.id ? { ...t, ...tenant_administradora } : t))
    } else {
      const res = await fetch('/api/tenant-administradoras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ administradora_id: modalTaxas.adm.id, ...data }),
      })
      const json = await res.json() as { tenant_administradora: { id: string; taxa_administracao: number; fundo_reserva: number; comissao_venda: number; comissao_lance: number; ativa: boolean } }
      setTenantAdm((prev) => [...prev, { ...json.tenant_administradora, administradora: modalTaxas.adm }])
    }
    setModalTaxas(null)
  }

  async function handleRemoveAdm(tadm: TAdm) {
    if (!confirm(`Remover ${tadm.administradora.nome}? Todas as cartas desta administradora serão apagadas.`)) return
    await fetch(`/api/tenant-administradoras/${tadm.id}`, { method: 'DELETE' })
    setTenantAdm((prev) => prev.filter((t) => t.id !== tadm.id))
    setCartas((prev) => prev.filter((c) => c.tenant_administradora_id !== tadm.id))
  }

  async function handleToggleAtiva(tadm: TAdm) {
    await fetch(`/api/tenant-administradoras/${tadm.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativa: !tadm.ativa }),
    })
    setTenantAdm((prev) => prev.map((t) => t.id === tadm.id ? { ...t, ativa: !t.ativa } : t))
  }

  // ── Handlers cartas ─────────────────────────────────────────────
  async function handleSaveCarta(data: Omit<Carta, 'id' | 'tenant_administradora_id' | 'disponivel'>) {
    if (!modalCarta) return
    if (modalCarta.existing) {
      const res = await fetch(`/api/cartas/${modalCarta.existing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const { carta } = await res.json() as { carta: Carta }
      setCartas((prev) => prev.map((c) => c.id === modalCarta.existing!.id ? carta : c))
    } else {
      const res = await fetch('/api/cartas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tenant_administradora_id: modalCarta.tadmId }),
      })
      const { carta } = await res.json() as { carta: Carta }
      setCartas((prev) => [...prev, carta])
    }
    setModalCarta(null)
  }

  async function handleDeleteCarta(carta: Carta) {
    if (!confirm('Apagar esta carta?')) return
    await fetch(`/api/cartas/${carta.id}`, { method: 'DELETE' })
    setCartas((prev) => prev.filter((c) => c.id !== carta.id))
  }

  async function handleToggleDisponivel(carta: Carta) {
    await fetch(`/api/cartas/${carta.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponivel: !carta.disponivel }),
    })
    setCartas((prev) => prev.map((c) => c.id === carta.id ? { ...c, disponivel: !c.disponivel } : c))
  }

  // ── Comparativo ─────────────────────────────────────────────────
  const cartasParaComparar = cartas.filter((c) => {
    const valorAlvo = parseFloat(cmpValor)
    const tipoOk = c.tipo === cmpTipo && c.disponivel
    if (!valorAlvo) return tipoOk
    return tipoOk && c.valor_credito >= valorAlvo * 0.8 && c.valor_credito <= valorAlvo * 1.25
  }).map((c) => {
    const tadm = tenantAdm.find((t) => t.id === c.tenant_administradora_id)
    const custo = ((tadm?.taxa_administracao ?? 0) + (tadm?.fundo_reserva ?? 0))
    return { ...c, tadm, custo }
  }).sort((a, b) => a.custo - b.custo)

  const admSelecionadas = tenantAdm.filter((t) => t.ativa)
  const currentCartaTabTadm = tenantAdm.find((t) => t.id === (cartaTab || tenantAdm[0]?.id))
  const currentCartaTabId = currentCartaTabTadm?.id ?? ''
  const cartasDoTab = cartas.filter((c) => c.tenant_administradora_id === currentCartaTabId)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Administradoras</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          Gerencie as administradoras que você representa, suas taxas e cartas disponíveis
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        {([
          { key: 'administradoras', label: 'Administradoras', icon: Building2 },
          { key: 'cartas',         label: 'Cartas',           icon: FileText },
          { key: 'comparativo',    label: 'Comparativo',      icon: TrendingUp },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key} onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
              borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              background: tab === key ? 'var(--bg-secondary)' : 'transparent',
              color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            <Icon size={16} /> {label}
            {key === 'administradoras' && admSelecionadas.length > 0 && (
              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>
                {admSelecionadas.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ TAB: ADMINISTRADORAS ════════════════════════════════════ */}
      {tab === 'administradoras' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Minhas administradoras */}
          {admSelecionadas.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Minhas administradoras ({admSelecionadas.length})
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {admSelecionadas.map((tadm) => (
                  <div key={tadm.id} className="card-hover" style={{
                    background: 'var(--bg-secondary)', borderRadius: 16,
                    border: `1.5px solid ${tadm.administradora.cor}40`,
                    padding: '20px 22px', transition: 'all 0.2s',
                    boxShadow: `0 0 0 0 ${tadm.administradora.cor}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <AdmLogo adm={tadm.administradora} />
                        <div>
                          <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>{tadm.administradora.nome}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {cartas.filter((c) => c.tenant_administradora_id === tadm.id).length} cartas cadastradas
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleToggleAtiva(tadm)} title={tadm.ativa ? 'Desativar' : 'Ativar'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: tadm.ativa ? 'var(--accent)' : 'var(--text-muted)', padding: 4 }}>
                          {tadm.ativa ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button onClick={() => setModalTaxas({ adm: tadm.administradora, existing: tadm })} title="Configurar taxas"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleRemoveAdm(tadm)} title="Remover"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Taxas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'Tx. Adm.', value: tadm.taxa_administracao },
                        { label: 'F. Reserva', value: tadm.fundo_reserva },
                        { label: 'Com. Venda', value: tadm.comissao_venda },
                        { label: 'Com. Lance', value: tadm.comissao_lance },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{value}%</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => { setTab('cartas'); setCartaTab(tadm.id) }}
                      style={{
                        width: '100%', padding: '8px 0', borderRadius: 10, border: `1px solid ${tadm.administradora.cor}40`,
                        background: `${tadm.administradora.cor}10`, color: tadm.administradora.cor,
                        fontWeight: 700, cursor: 'pointer', fontSize: 13,
                      }}>
                      Gerenciar cartas →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar novas */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              {admSelecionadas.length > 0 ? 'Adicionar outra administradora' : 'Selecione as administradoras que você representa'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {allAdministradoras
                .filter((adm) => !tenantAdm.some((t) => t.administradora.id === adm.id))
                .map((adm) => (
                  <button
                    key={adm.id} onClick={() => handleAddAdm(adm)}
                    className="card-hover"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                      background: 'var(--bg-secondary)', borderRadius: 14,
                      border: '1.5px solid var(--border-color)', cursor: 'pointer',
                      transition: 'all 0.2s', textAlign: 'left',
                    }}
                  >
                    <AdmLogo adm={adm} size={36} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{adm.nome}</p>
                      <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>+ Adicionar</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: CARTAS ═════════════════════════════════════════════ */}
      {tab === 'cartas' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {tenantAdm.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Building2 size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>Nenhuma administradora cadastrada</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Adicione administradoras primeiro na aba anterior</p>
              <button onClick={() => setTab('administradoras')} style={{
                marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: 'var(--bg-primary)', fontWeight: 700, cursor: 'pointer',
              }}>Ir para Administradoras</button>
            </div>
          ) : (
            <>
              {/* Selector de administradora */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                {tenantAdm.map((tadm) => (
                  <button
                    key={tadm.id}
                    onClick={() => setCartaTab(tadm.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                      borderRadius: 20, border: '1.5px solid',
                      borderColor: (cartaTab || tenantAdm[0]?.id) === tadm.id ? tadm.administradora.cor : 'var(--border-color)',
                      background: (cartaTab || tenantAdm[0]?.id) === tadm.id ? `${tadm.administradora.cor}15` : 'transparent',
                      cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)',
                    }}
                  >
                    <AdmLogo adm={tadm.administradora} size={24} />
                    {tadm.administradora.nome}
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, background: `${tadm.administradora.cor}20`, color: tadm.administradora.cor }}>
                      {cartas.filter((c) => c.tenant_administradora_id === tadm.id).length}
                    </span>
                  </button>
                ))}
              </div>

              {currentCartaTabTadm && (
                <div>
                  {/* Header da aba selecionada */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AdmLogo adm={currentCartaTabTadm.administradora} />
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                          {currentCartaTabTadm.administradora.nome}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Custo total: {(currentCartaTabTadm.taxa_administracao + currentCartaTabTadm.fundo_reserva).toFixed(2)}% · Comissão: {currentCartaTabTadm.comissao_venda}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalCarta({ tadmId: currentCartaTabId })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                        borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: 'var(--accent)', color: 'var(--bg-primary)', fontWeight: 700, fontSize: 14,
                      }}
                    >
                      <Plus size={16} /> Adicionar Carta
                    </button>
                  </div>

                  {/* Tabela de cartas */}
                  {cartasDoTab.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed var(--border-color)', borderRadius: 16 }}>
                      <p style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Nenhuma carta cadastrada</p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Adicione as cartas disponíveis desta administradora</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Agrupado por tipo */}
                      {Object.keys(TIPOS).map((tipo) => {
                        const group = cartasDoTab.filter((c) => c.tipo === tipo)
                        if (group.length === 0) return null
                        return (
                          <div key={tipo}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' }}>
                              {TIPO_ICONS[tipo]} {TIPOS[tipo]}
                            </p>
                            {group.map((carta) => (
                              <div key={carta.id} style={{
                                display: 'flex', alignItems: 'center', gap: 16,
                                padding: '14px 18px', borderRadius: 14,
                                background: carta.disponivel ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border-color)', marginBottom: 8,
                                opacity: carta.disponivel ? 1 : 0.5,
                              }}>
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                                  <div>
                                    <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(carta.valor_credito)}</p>
                                    {carta.descricao && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{carta.descricao}</p>}
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Prazo</p>
                                    <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{carta.prazo_meses}m</p>
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Parcela</p>
                                    <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {carta.parcela_estimada ? fmt(carta.parcela_estimada) : '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Contemplação</p>
                                    <p style={{ fontWeight: 700, color: carta.contemplacao_media ? 'var(--accent)' : 'var(--text-muted)' }}>
                                      {carta.contemplacao_media ? `${carta.contemplacao_media}%` : '—'}
                                    </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                                      background: carta.disponivel ? 'rgba(0,212,200,0.1)' : 'rgba(255,255,255,0.05)',
                                      color: carta.disponivel ? 'var(--accent)' : 'var(--text-muted)',
                                    }}>
                                      {carta.disponivel ? 'Disponível' : 'Esgotada'}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => handleToggleDisponivel(carta)} title={carta.disponivel ? 'Marcar como esgotada' : 'Marcar como disponível'}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: carta.disponivel ? 'var(--accent)' : 'var(--text-muted)', padding: 6 }}>
                                    {carta.disponivel ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                  </button>
                                  <button onClick={() => setModalCarta({ tadmId: currentCartaTabId, existing: carta })} title="Editar"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
                                    <Pencil size={15} />
                                  </button>
                                  <button onClick={() => handleDeleteCarta(carta)} title="Apagar"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 6 }}>
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ TAB: COMPARATIVO ════════════════════════════════════════ */}
      {tab === 'comparativo' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Configure o perfil do seu cliente
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(TIPOS).map(([k, v]) => (
                    <button key={k} onClick={() => setCmpTipo(k)} style={{
                      padding: '8px 14px', borderRadius: 20, border: '1.5px solid',
                      borderColor: cmpTipo === k ? 'var(--accent)' : 'var(--border-color)',
                      background: cmpTipo === k ? 'rgba(0,212,200,0.1)' : 'transparent',
                      color: cmpTipo === k ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    }}>
                      {TIPO_ICONS[k]} {v}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Crédito desejado (R$)</label>
                <input
                  type="number" value={cmpValor} onChange={(e) => setCmpValor(e.target.value)}
                  placeholder="Ex: 200000 (opcional)"
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 15, outline: 'none', width: 220,
                  }}
                />
              </div>
            </div>
          </div>

          {cartasParaComparar.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <TrendingUp size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>
                {cartas.length === 0
                  ? 'Nenhuma carta cadastrada ainda'
                  : 'Nenhuma carta disponível para esse filtro'}
              </p>
              {cartas.length === 0 && (
                <button onClick={() => setTab('cartas')} style={{
                  marginTop: 20, padding: '10px 24px', borderRadius: 12, border: 'none',
                  background: 'var(--accent)', color: 'var(--bg-primary)', fontWeight: 700, cursor: 'pointer',
                }}>Cadastrar cartas</button>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {cartasParaComparar.length} opções encontradas · ordenadas por menor custo total
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cartasParaComparar.map((c, idx) => {
                  const adm = c.tadm?.administradora
                  const custo = c.custo
                  const isFirst = idx === 0
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 20, padding: '18px 22px',
                      borderRadius: 16, border: `1.5px solid ${isFirst ? 'var(--accent)' : 'var(--border-color)'}`,
                      background: isFirst ? 'rgba(0,212,200,0.05)' : 'var(--bg-secondary)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {isFirst && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent)' }} />
                      )}
                      <div style={{ fontSize: 22, fontWeight: 900, color: isFirst ? 'var(--accent)' : 'var(--text-muted)', width: 32, textAlign: 'center' }}>
                        {idx + 1}º
                      </div>
                      {adm && <AdmLogo adm={adm} size={44} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>{adm?.nome}</p>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${adm?.cor}20`, color: adm?.cor, fontWeight: 700 }}>
                            {TIPO_ICONS[c.tipo]} {TIPOS[c.tipo]}
                          </span>
                        </div>
                        {c.descricao && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.descricao}</p>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', gap: '0 24px', textAlign: 'center' }}>
                        {[
                          { label: 'Crédito', value: fmt(c.valor_credito), color: 'var(--text-primary)' },
                          { label: 'Prazo', value: `${c.prazo_meses}m`, color: 'var(--text-secondary)' },
                          { label: 'Parcela', value: c.parcela_estimada ? fmt(c.parcela_estimada) : '—', color: 'var(--text-secondary)' },
                          { label: 'Custo total', value: `${custo.toFixed(2)}%`, color: custo < 18 ? 'var(--accent)' : custo < 22 ? '#FFB547' : 'var(--danger)' },
                          { label: 'Contemplação', value: c.contemplacao_media ? `${c.contemplacao_media}%` : '—', color: 'var(--accent)' },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modalTaxas && (
        <ModalTaxas
          adm={modalTaxas.adm}
          initial={modalTaxas.existing}
          onSave={handleSaveTaxas}
          onClose={() => setModalTaxas(null)}
        />
      )}
      {modalCarta && (
        <ModalCarta
          tadmId={modalCarta.tadmId}
          initial={modalCarta.existing}
          onSave={handleSaveCarta}
          onClose={() => setModalCarta(null)}
        />
      )}
    </div>
  )
}
