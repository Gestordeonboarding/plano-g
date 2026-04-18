'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, User, UserPlus, UserCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Conversation = {
  id: string
  contact_phone: string
  contact_name: string | null
  last_message: string | null
  last_message_at: string
  unread_count: number
  lead_id: string | null
}

type Tab = 'mensagens' | 'leads'

function timeAgo(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function ConversasClient({ conversations }: { conversations: Conversation[] }) {
  const [tab, setTab] = useState<Tab>('mensagens')
  const [convs, setConvs] = useState(conversations)
  const [converting, setConverting] = useState<string | null>(null)
  const router = useRouter()

  const mensagens = convs.filter((c) => !c.lead_id)
  const leads = convs.filter((c) => !!c.lead_id)
  const shown = tab === 'mensagens' ? mensagens : leads

  async function handleConvert(convId: string) {
    setConverting(convId)
    const res = await fetch('/api/whatsapp/convert-to-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId }),
    })
    const data = await res.json() as { leadId?: string; error?: string }
    if (res.ok && data.leadId) {
      setConvs((prev) =>
        prev.map((c) => c.id === convId ? { ...c, lead_id: data.leadId! } : c)
      )
      router.refresh()
    }
    setConverting(null)
  }

  async function handleRemove(convId: string) {
    setConverting(convId)
    await fetch('/api/whatsapp/convert-to-lead', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId }),
    })
    setConvs((prev) =>
      prev.map((c) => c.id === convId ? { ...c, lead_id: null } : c)
    )
    setConverting(null)
  }

  const tabStyle = (active: boolean) => ({
    flex: 1,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '6px',
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '500',
    backgroundColor: active ? 'var(--bg-primary)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ maxWidth: 672, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Conversas</h1>
        <p style={{ fontSize: 14, marginTop: 4, color: 'var(--text-muted)' }}>
          Mensagens recebidas no seu WhatsApp conectado
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, backgroundColor: 'var(--bg-secondary)' }}>
        <button onClick={() => setTab('mensagens')} style={tabStyle(tab === 'mensagens')}>
          <MessageSquare size={14} />
          Mensagens
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
            backgroundColor: tab === 'mensagens' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: tab === 'mensagens' ? 'var(--bg-primary)' : 'var(--text-muted)',
          }}>{mensagens.length}</span>
        </button>
        <button onClick={() => setTab('leads')} style={tabStyle(tab === 'leads')}>
          <UserCheck size={14} />
          Leads
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
            backgroundColor: tab === 'leads' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: tab === 'leads' ? 'var(--bg-primary)' : 'var(--text-muted)',
          }}>{leads.length}</span>
        </button>
      </div>

      {tab === 'mensagens' && mensagens.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 4 }}>
          Passe o mouse sobre uma conversa e clique em + para converter em lead
        </p>
      )}

      {/* Lista */}
      {shown.length === 0 ? (
        <div className="card-pg" style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
            {tab === 'leads'
              ? <UserCheck size={24} style={{ color: 'var(--text-muted)' }} />
              : <MessageSquare size={24} style={{ color: 'var(--text-muted)' }} />}
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {tab === 'leads' ? 'Nenhum lead ainda' : 'Nenhuma mensagem ainda'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {tab === 'leads'
              ? 'Converta mensagens em leads passando o mouse e clicando em +.'
              : 'Quando alguém enviar uma mensagem para seu WhatsApp, ela aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <div className="card-pg" style={{ overflow: 'hidden' }}>
          {shown.map((conv, i) => {
            const isLead = !!conv.lead_id
            const busy = converting === conv.id
            return (
              <div
                key={conv.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 20px', position: 'relative',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-color)',
                }}
                className="group"
              >
                <Link href={`/dashboard/conversas/${conv.id}`} style={{ flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: 16,
                    backgroundColor: isLead ? 'rgba(0,212,200,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isLead ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {conv.contact_name ? conv.contact_name.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                </Link>

                <Link href={`/dashboard/conversas/${conv.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.contact_name || `+${conv.contact_phone}`}
                      </p>
                      {isLead && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)', flexShrink: 0 }}>
                          LEAD
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message || '—'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span style={{ marginLeft: 8, flexShrink: 0, fontSize: 10, fontWeight: 700, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', color: '#fff' }}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Action */}
                <button
                  onClick={() => isLead ? handleRemove(conv.id) : handleConvert(conv.id)}
                  disabled={busy}
                  title={isLead ? 'Remover dos leads' : 'Converter em lead'}
                  style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', cursor: busy ? 'default' : 'pointer',
                    backgroundColor: isLead ? 'rgba(255,92,92,0.1)' : 'rgba(0,212,200,0.1)',
                    color: isLead ? 'var(--danger)' : 'var(--accent)',
                    opacity: busy ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {isLead ? <X size={14} /> : <UserPlus size={14} />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
