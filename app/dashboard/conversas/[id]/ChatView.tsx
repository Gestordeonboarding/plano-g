'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  direction: 'incoming' | 'outgoing'
  content: string | null
  sent_at: string
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(date: string) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function ChatView({
  conversationId,
  initialMessages,
  contactName,
}: {
  conversationId: string
  initialMessages: Message[]
  contactName: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message: text.trim() }),
    })
    const data = await res.json() as { error?: string; message?: Message }
    if (!res.ok) {
      setError(data.error || 'Erro ao enviar mensagem.')
    } else if (data.message) {
      setMessages((prev) => [...prev, data.message!])
      setText('')
    }
    setSending(false)
  }

  // Group messages by day
  const grouped: { day: string; msgs: Message[] }[] = []
  messages.forEach((msg) => {
    const day = formatDay(msg.sent_at)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) {
      last.msgs.push(msg)
    } else {
      grouped.push({ day, msgs: [msg] })
    }
  })

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {grouped.map((group) => (
          <div key={group.day}>
            {/* Day separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
              <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>{group.day}</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
            </div>

            {group.msgs.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-1 ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[72%] px-3.5 py-2 rounded-2xl text-sm"
                  style={msg.direction === 'outgoing'
                    ? {
                        backgroundColor: 'var(--accent)',
                        color: 'var(--bg-primary)',
                        borderBottomRightRadius: '4px',
                      }
                    : {
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        borderBottomLeftRadius: '4px',
                      }
                  }
                >
                  <p style={{ lineHeight: '1.4' }}>{msg.content}</p>
                  <p className="text-[10px] mt-1 text-right"
                    style={{ opacity: 0.65 }}>
                    {formatTime(msg.sent_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhuma mensagem ainda com {contactName}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
        {error && (
          <p className="text-xs mb-2" style={{ color: 'var(--danger)' }}>{error}</p>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            className="input-pg flex-1"
            placeholder={`Mensagem para ${contactName}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: '#25D366', color: '#fff' }}
          >
            {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  )
}
