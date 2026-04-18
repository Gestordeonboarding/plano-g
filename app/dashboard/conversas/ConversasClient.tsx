'use client'

import { useState, useTransition } from 'react'
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

function ConvItem({
  conv,
  onConvert,
  onRemove,
  converting,
}: {
  conv: Conversation
  onConvert: (id: string) => void
  onRemove: (id: string) => void
  converting: string | null
}) {
  const isLead = !!conv.lead_id
  const busy = converting === conv.id

  return (
    <div className="flex items-center gap-3 px-5 py-4 relative group"
      style={{ borderTop: '1px solid var(--border-color)' }}>

      {/* Avatar */}
      <Link href={`/dashboard/conversas/${conv.id}`} className="shrink-0">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold"
          style={{
            backgroundColor: isLead ? 'rgba(0,212,200,0.15)' : 'rgba(255,255,255,0.06)',
            color: isLead ? 'var(--accent)' : 'var(--text-muted)',
          }}>
          {conv.contact_name
            ? conv.contact_name.charAt(0).toUpperCase()
            : <User size={18} />}
        </div>
      </Link>

      {/* Info */}
      <Link href={`/dashboard/conversas/${conv.id}`} className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {conv.contact_name || `+${conv.contact_phone}`}
            </p>
            {isLead && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>
                LEAD
              </span>
            )}
          </div>
          <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(conv.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            {conv.last_message || '—'}
          </p>
          {conv.unread_count > 0 && (
            <span className="ml-2 shrink-0 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#25D366', color: '#fff' }}>
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
      </Link>

      {/* Action button */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLead ? (
          <button
            onClick={() => onRemove(conv.id)}
            disabled={busy}
            title="Remover dos leads"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,92,92,0.1)', color: 'var(--danger)' }}
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={() => onConvert(conv.id)}
            disabled={busy}
            title="Converter em lead"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(0,212,200,0.1)', color: 'var(--accent)' }}
          >
            {busy ? (
              <span className="text-[10px] font-bold">...</span>
            ) : (
              <UserPlus size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default function ConversasClient({ conversations }: { conversations: Conversation[] }) {
  const [tab, setTab] = useState<'mensagens' | 'leads'>('mensagens')
  const [convs, setConvs] = useState(conversations)
  const [converting, setConverting] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

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
      startTransition(() => router.refresh())
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

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Conversas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Mensagens recebidas no seu WhatsApp conectado
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {([
          { key: 'mensagens', label: 'Mensagens', count: mensagens.length, icon: <MessageSquare size={14}/> },
          { key: 'leads', label: 'Leads', count: leads.length, icon: <UserCheck size={14}/> },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: tab === t.key ? 'var(--bg-primary)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {t.icon}
            {t.label}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: tab === t.key ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: tab === t.key ? 'var(--bg-primary)' : 'var(--text-muted)',
              }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Hint */}
      {tab === 'mensagens' && mensagens.length > 0 && (
        <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
          Passe o mouse sobre uma conversa e clique em <strong style={{ color: 'var(--accent)' }}>+</strong> para converter em lead
        </p>
      )}

      {/* Lista */}
      {shown.length === 0 ? (
        <div className="card-pg p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {tab === 'leads' ? <UserCheck size={24} style={{ color: 'var(--text-muted)' }} /> : <MessageSquare size={24} style={{ color: 'var(--text-muted)' }} />}
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {tab === 'leads' ? 'Nenhum lead ainda' : 'Nenhuma mensagem ainda'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {tab === 'leads'
              ? 'Converta mensagens em leads passando o mouse sobre elas e clicando em +.'
              : 'Quando alguém enviar uma mensagem para seu WhatsApp conectado, ela aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <div className="card-pg overflow-hidden">
          {shown.map((conv, i) => (
            <div key={conv.id} style={i === 0 ? { borderTop: 'none' } : {}}>
              <ConvItem
                conv={conv}
                onConvert={handleConvert}
                onRemove={handleRemove}
                converting={converting}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
