'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Camera, Trophy, Target, Gift, Edit2, Star, Medal, Check, X, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'

type Seller = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; is_active: boolean; whatsapp_phone: string | null }
type Lead = { seller_id: string | null; desired_credit: number | null }
type Commission = { seller_id: string; rate_percent: number; monthly_goal_leads: number; monthly_goal_credit: number }
type Prize = { seller_id: string; month: string; prize_description: string; is_revealed: boolean }
type Ranked = Seller & { rank: number; converted: number; credit: number; commission_earned: number; goal_pct: number; comm: Commission | null; prize: Prize | null }

function calcRanking(sellers: Seller[], leads: Lead[], commissions: Commission[], prizes: Prize[]): Ranked[] {
  return sellers
    .map(s => {
      const mine = leads.filter(l => l.seller_id === s.id)
      const credit = mine.reduce((sum, l) => sum + (l.desired_credit || 0), 0)
      const comm = commissions.find(c => c.seller_id === s.id) || null
      const prize = prizes.find(p => p.seller_id === s.id) || null
      const commission_earned = credit * ((comm?.rate_percent || 0) / 100)
      const goal_pct = comm?.monthly_goal_leads ? Math.min(100, Math.round((mine.length / comm.monthly_goal_leads) * 100)) : 0
      return { ...s, converted: mine.length, credit, commission_earned, goal_pct, comm, prize }
    })
    .sort((a, b) => b.converted - a.converted || b.credit - a.credit)
    .map((s, i) => ({ ...s, rank: i + 1 }))
}

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_H = [90, 130, 60] // heights for 2nd, 1st, 3rd
const PODIUM_COLORS = [
  { bg: 'rgba(192,192,192,0.15)', accent: '#C0C0C0', text: '#C0C0C0' },
  { bg: 'rgba(212,175,55,0.2)', accent: '#D4AF37', text: '#FFD700' },
  { bg: 'rgba(205,127,50,0.15)', accent: '#CD7F32', text: '#CD7F32' },
]

function Avatar({ url, name, size = 48 }: { url: string | null; name: string | null; size?: number }) {
  if (url) return <img src={url} alt={name || ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--tenant-primary), #7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  )
}

interface Props {
  tenantId: string
  sellers: Seller[]
  monthLeads: Lead[]
  commissions: Commission[]
  prizes: Prize[]
  currentMonth: string
}

export default function EquipeAdminClient({ tenantId, sellers, monthLeads, commissions, prizes, currentMonth }: Props) {
  const [ranking, setRanking] = useState<Ranked[]>(() => calcRanking(sellers, monthLeads, commissions, prizes))
  const [tab, setTab] = useState<'podium' | 'config'>('podium')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{ rate: string; goalLeads: string; goalCredit: string; prize: string; prizeRevealed: boolean }>({ rate: '', goalLeads: '', goalCredit: '', prize: '', prizeRevealed: false })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set())
  const prevRankRef = useRef<Record<string, number>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadingFor = useRef<string | null>(null)
  const [localAvatars, setLocalAvatars] = useState<Record<string, string>>({})

  // Real-time ranking refresh
  const fetchRanking = useCallback(async () => {
    const res = await fetch('/api/equipe/ranking')
    if (!res.ok) return
    const { ranking: raw } = await res.json()
    if (!raw) return

    const newRanking = (raw as Array<Ranked & { comm?: Commission }>).map((s, i) => {
      const original = sellers.find(sel => sel.id === s.id)
      const comm = commissions.find(c => c.seller_id === s.id) || null
      const prize = prizes.find(p => p.seller_id === s.id) || null
      const goal_pct = comm?.monthly_goal_leads ? Math.min(100, Math.round((s.converted / comm.monthly_goal_leads) * 100)) : 0
      return { ...(original || s), ...s, rank: i + 1, comm, prize, goal_pct, commission_earned: s.commission_earned }
    })

    // Detect position changes
    const changed = new Set<string>()
    newRanking.forEach((s, i) => {
      if (prevRankRef.current[s.id] !== undefined && prevRankRef.current[s.id] !== i) changed.add(s.id)
    })
    if (changed.size > 0) {
      setChangedIds(changed)
      setTimeout(() => setChangedIds(new Set()), 2500)
    }
    prevRankRef.current = Object.fromEntries(newRanking.map((s, i) => [s.id, i]))
    setRanking(newRanking as Ranked[])
  }, [sellers, commissions, prizes])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('equipe-ranking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, fetchRanking)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, fetchRanking)
      .subscribe()
    const interval = setInterval(fetchRanking, 30000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [fetchRanking])

  function openEdit(s: Ranked) {
    setEditingId(s.id)
    setForm({
      rate: String(s.comm?.rate_percent ?? 1),
      goalLeads: String(s.comm?.monthly_goal_leads ?? 10),
      goalCredit: String(s.comm?.monthly_goal_credit ?? 500000),
      prize: s.prize?.prize_description ?? '',
      prizeRevealed: s.prize?.is_revealed ?? false,
    })
  }

  async function handleSave(sellerId: string) {
    setSaving(true)
    await Promise.all([
      fetch('/api/equipe/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: sellerId, rate_percent: form.rate, monthly_goal_leads: form.goalLeads, monthly_goal_credit: form.goalCredit }),
      }),
      form.prize ? fetch('/api/equipe/prize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: sellerId, month: currentMonth, prize_description: form.prize, is_revealed: form.prizeRevealed }),
      }) : Promise.resolve(),
    ])
    setSaving(false)
    setEditingId(null)
    fetchRanking()
  }

  async function handlePhotoClick(sellerId: string) {
    uploadingFor.current = sellerId
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const sid = uploadingFor.current
    if (!file || !sid) return
    setUploading(sid)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('seller_id', sid)
    const res = await fetch('/api/equipe/photo', { method: 'POST', body: fd })
    if (res.ok) {
      const { avatar_url } = await res.json()
      setLocalAvatars(prev => ({ ...prev, [sid]: avatar_url }))
    }
    setUploading(null)
    e.target.value = ''
  }

  // Podium order: 2nd, 1st, 3rd
  const top3 = [ranking[1], ranking[0], ranking[2]].filter(Boolean)
  const podiumOrder = [1, 0, 2] // display order → original rank

  return (
    <>
      <style>{`
        @keyframes riseUp { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); transform-origin: bottom; } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-24px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes goldGlow { 0%,100% { box-shadow: 0 0 16px rgba(212,175,55,0.4), 0 0 32px rgba(212,175,55,0.2); } 50% { box-shadow: 0 0 28px rgba(212,175,55,0.7), 0 0 56px rgba(212,175,55,0.3); } }
        @keyframes floatPhoto { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes flashGreen { 0%{background:rgba(0,212,200,0.3)} 100%{background:transparent} }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .podium-block { animation: riseUp 0.7s cubic-bezier(.22,1,.36,1) both; }
        .podium-photo { animation: dropIn 0.5s cubic-bezier(.22,1,.36,1) 0.3s both; }
        .photo-float { animation: floatPhoto 4s ease-in-out infinite; }
        .gold-glow { animation: goldGlow 2.5s ease-in-out infinite; }
        .rank-changed { animation: flashGreen 2s ease forwards; }
        .tab-btn { padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: all .2s; }
      `}</style>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Equipe</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {sellers.length} vendedor{sellers.length !== 1 ? 'es' : ''} · {currentMonth.split('-').reverse().join('/')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-tertiary)', borderRadius: 12, padding: 4 }}>
          {(['podium', 'config'] as const).map(t => (
            <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
              background: tab === t ? 'var(--bg-secondary)' : 'transparent',
              color: tab === t ? 'var(--tenant-primary)' : 'var(--text-muted)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}>
              {t === 'podium' ? '🏆 Ranking' : '⚙️ Configurar'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'podium' && (
        <>
          {/* PODIUM */}
          <div style={{
            borderRadius: 20, padding: '32px 24px 0',
            background: 'linear-gradient(160deg, #0a1628, #0d1f3c)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
              Ranking do Mês
            </p>

            {ranking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                Nenhuma conversão ainda este mês
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
                {[ranking[1], ranking[0], ranking[2]].map((s, displayIdx) => {
                  if (!s) return <div key={displayIdx} style={{ width: 110 }} />
                  const rankIdx = displayIdx === 0 ? 1 : displayIdx === 1 ? 0 : 2
                  const h = PODIUM_H[displayIdx]
                  const pc = PODIUM_COLORS[rankIdx]
                  const avatarSrc = localAvatars[s.id] || s.avatar_url
                  return (
                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110 }}>
                      {/* Photo */}
                      <div className={`podium-photo ${rankIdx === 0 ? 'photo-float' : ''}`} style={{ marginBottom: 8, position: 'relative' }}>
                        <div className={rankIdx === 0 ? 'gold-glow' : ''} style={{
                          borderRadius: '50%',
                          border: `3px solid ${pc.accent}`,
                          padding: 2,
                        }}>
                          <Avatar url={avatarSrc} name={s.full_name} size={rankIdx === 0 ? 68 : 52} />
                        </div>
                        {rankIdx === 0 && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 20 }}>👑</span>}
                      </div>
                      <p style={{ fontSize: rankIdx === 0 ? 13 : 11, fontWeight: 700, color: pc.text, textAlign: 'center', marginBottom: 2, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.full_name?.split(' ')[0] || '—'}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                        {s.converted} conv.
                      </p>
                      {/* Block */}
                      <div className="podium-block" style={{
                        width: '100%', height: h, borderRadius: '10px 10px 0 0',
                        background: pc.bg, border: `1px solid ${pc.accent}44`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        animationDelay: `${displayIdx * 0.1}s`,
                      }}>
                        <span style={{ fontSize: rankIdx === 0 ? 28 : 22 }}>{MEDALS[rankIdx]}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: pc.text }}>{rankIdx + 1}º</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Full ranking list */}
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={14} style={{ color: 'var(--tenant-primary)' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Ranking Completo</p>
            </div>
            {ranking.length === 0 ? (
              <p style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma conversão registrada este mês.</p>
            ) : ranking.map((s, i) => {
              const avatarSrc = localAvatars[s.id] || s.avatar_url
              const isChanged = changedIds.has(s.id)
              const goalMet = s.goal_pct >= 100
              return (
                <div key={s.id} className={isChanged ? 'rank-changed' : ''} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: i < ranking.length - 1 ? '1px solid var(--border-color)' : 'none',
                  transition: 'background 0.3s',
                }}>
                  <span style={{ fontSize: 16, width: 28, textAlign: 'center' }}>{i < 3 ? MEDALS[i] : `${i + 1}º`}</span>
                  <Avatar url={avatarSrc} name={s.full_name} size={36} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.full_name || '—'}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--bg-tertiary)' }}>
                        <div style={{ height: 4, borderRadius: 4, width: `${s.goal_pct}%`, background: goalMet ? '#00D4C8' : 'var(--tenant-primary)', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ fontSize: 10, color: goalMet ? '#00D4C8' : 'var(--text-muted)', fontWeight: 700 }}>{s.goal_pct}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{s.converted} conv.</p>
                    <p style={{ fontSize: 11, color: 'var(--tenant-primary)' }}>{formatCurrency(s.commission_earned)}</p>
                  </div>
                  {isChanged && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#00D4C8', marginLeft: 4 }}>⬆</span>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clique em um vendedor para editar suas configurações.</p>
          {sellers.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>Nenhum vendedor cadastrado ainda.</p>
          )}
          {ranking.map((s) => {
            const isEditing = editingId === s.id
            const avatarSrc = localAvatars[s.id] || s.avatar_url
            const goalMet = s.goal_pct >= 100
            return (
              <div key={s.id} style={{
                borderRadius: 16, border: `1px solid ${isEditing ? 'var(--tenant-primary)' : 'var(--border-color)'}`,
                background: 'var(--bg-secondary)', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  {/* Avatar with upload */}
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => handlePhotoClick(s.id)}>
                    <Avatar url={avatarSrc} name={s.full_name} size={44} />
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: uploading === s.id ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
                    >
                      <Camera size={14} color="#fff" />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.full_name || '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.rank <= 3 ? MEDALS[s.rank - 1] : `${s.rank}º`}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: goalMet ? '#00D4C8' : 'var(--text-muted)', padding: '2px 8px', borderRadius: 20, background: goalMet ? 'rgba(0,212,200,0.1)' : 'var(--bg-tertiary)' }}>
                      {s.converted} conv · {s.goal_pct}% da meta
                    </span>
                    <button onClick={() => isEditing ? setEditingId(null) : openEdit(s)} style={{
                      padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
                      background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
                    }}>
                      {isEditing ? 'Fechar' : <Edit2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="slideUp" style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Commission + Goals */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {[
                        { label: '% Comissão', key: 'rate', suffix: '%', hint: 'Ex: 1.5' },
                        { label: 'Meta (conversões)', key: 'goalLeads', suffix: '', hint: 'Ex: 10' },
                        { label: 'Meta (crédito R$)', key: 'goalCredit', suffix: '', hint: 'Ex: 500000' },
                      ].map(({ label, key, suffix, hint }) => (
                        <div key={key}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</p>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              value={form[key as keyof typeof form] as string}
                              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                              placeholder={hint}
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: `8px ${suffix ? '28px' : '10px'} 8px 10px`,
                                borderRadius: 8, border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13,
                              }}
                            />
                            {suffix && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)' }}>{suffix}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Prize */}
                    <div style={{ borderRadius: 12, padding: 14, background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Gift size={15} style={{ color: '#FFD700' }} />
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#FFD700' }}>Prêmio Secreto — {currentMonth.split('-').reverse().join('/')}</p>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{form.prizeRevealed ? 'Revelado ao vendedor' : 'Oculto ao vendedor'}</span>
                          <button onClick={() => setForm(f => ({ ...f, prizeRevealed: !f.prizeRevealed }))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: form.prizeRevealed ? '#00D4C8' : 'var(--text-muted)' }}>
                            {form.prizeRevealed ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={form.prize}
                        onChange={e => setForm(f => ({ ...f, prize: e.target.value }))}
                        placeholder="Descreva o prêmio secreto... (ex: iPhone 15, Viagem para Cancún, Bônus de R$ 2.000)"
                        rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box', borderRadius: 8,
                          padding: 10, border: '1px solid rgba(255,215,0,0.2)',
                          background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: 13,
                          resize: 'none', fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    {/* Save button */}
                    <button onClick={() => handleSave(s.id)} disabled={saving} style={{
                      padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                      background: 'var(--tenant-primary)', color: '#fff', border: 'none', cursor: 'pointer',
                      opacity: saving ? 0.7 : 1,
                    }}>
                      {saving ? 'Salvando...' : '✓ Salvar configurações'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
