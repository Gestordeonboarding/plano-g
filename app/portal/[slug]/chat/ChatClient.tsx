'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface Message {
  id: string
  created_at: string
  message: string
  sender_role: string | null
  sender_id: string | null
}

interface Props {
  consorciado: { id: string; full_name: string }
  tenantId: string
  userId: string
  initialMessages: Record<string, unknown>[]
}

export default function ChatClient({ consorciado, tenantId, userId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages as unknown as Message[])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Polling a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const supabase = createClient()
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('consorciado_id', consorciado.id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data as Message[])
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)

    const supabase = createClient()
    const { data: newMsg } = await supabase
      .from('chat_messages')
      .insert({
        tenant_id: tenantId,
        consorciado_id: consorciado.id,
        sender_role: 'client',
        sender_id: userId,
        message: text.trim(),
      })
      .select()
      .single()

    if (newMsg) setMessages((prev) => [...prev, newMsg as Message])
    setText('')
    setSending(false)
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-8" style={{ color: 'var(--text-muted)' }}>
            Nenhuma mensagem ainda. Diga olá!
          </p>
        )}
        {messages.map((msg) => {
          const isClient = msg.sender_role === 'client'
          return (
            <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[75%] px-4 py-2.5 rounded-2xl"
                style={{
                  backgroundColor: isClient ? 'var(--tenant-primary)' : 'var(--bg-secondary)',
                  color: isClient ? 'var(--bg-primary)' : 'var(--text-primary)',
                  borderBottomRightRadius: isClient ? 4 : 16,
                  borderBottomLeftRadius: isClient ? 16 : 4,
                  border: isClient ? 'none' : '1px solid var(--border-color)',
                }}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-[10px] mt-0.5 text-right opacity-60">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 mt-3 border-t"
        style={{ borderColor: 'var(--border-color)' }}>
        <input
          className="input-pg flex-1"
          placeholder="Digite uma mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
          style={{ backgroundColor: 'var(--tenant-primary)', color: 'var(--bg-primary)' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
