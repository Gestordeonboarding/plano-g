import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageCircle, Phone, ExternalLink, Send } from 'lucide-react'

export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await db.from('tenants').select('id, name').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/entrar`)

  const { data: cons } = await db
    .from('consorciados')
    .select('id, full_name, seller_id')
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .limit(1)

  const con = cons?.[0] as { id: string; full_name: string; seller_id: string | null } | null
  if (!con) redirect(`/portal/${slug}`)

  let sellerName = 'Seu Consultor'
  let sellerPhone: string | null = null
  let sellerEmail: string | null = null

  if (con.seller_id) {
    const { data: seller } = await db
      .from('users').select('full_name, phone, email').eq('id', con.seller_id).single()
    if (seller) {
      const s = seller as { full_name: string | null; phone: string | null; email: string | null }
      sellerName = s.full_name || 'Seu Consultor'
      sellerPhone = s.phone
      sellerEmail = s.email
    }
  }

  const firstName = con.full_name.split(' ')[0]
  const whatsappPhone = sellerPhone?.replace(/\D/g, '')
  const msgs = [
    { label: 'Olá! Quero saber sobre meu consórcio', icon: '💬' },
    { label: 'Quero simular um lance', icon: '🎯' },
    { label: 'Tenho dúvidas sobre minha parcela', icon: '💰' },
    { label: 'Quero contratar um novo consórcio', icon: '✨' },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu1 { animation: fadeUp 0.5s ease 0.0s both; }
        .fu2 { animation: fadeUp 0.5s ease 0.1s both; }
        .fu3 { animation: fadeUp 0.5s ease 0.2s both; }
        .wa-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
        .wa-btn:active { transform: scale(0.97); opacity: 0.85; }
        .msg-chip { transition: transform 0.15s ease; }
        .msg-chip:active { transform: scale(0.97); }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header consultor */}
        <div className="fu1" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px',
          borderRadius: 16,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--tenant-primary), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {sellerName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{sellerName}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Seu consultor de consórcios</p>
            {sellerPhone && (
              <p style={{ fontSize: 11, color: 'var(--tenant-primary)', marginTop: 2 }}>{sellerPhone}</p>
            )}
          </div>
          {whatsappPhone && (
            <a
              href={`https://wa.me/55${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(37,211,102,0.15)',
                border: '1px solid rgba(37,211,102,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#25D366', flexShrink: 0,
              }}
            >
              <Phone size={18} />
            </a>
          )}
        </div>

        {/* Mensagens rápidas */}
        {whatsappPhone && (
          <div className="fu2">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Enviar mensagem rápida
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msgs.map((m, i) => {
                const msg = encodeURIComponent(`${m.label}\n\nOlá, sou ${firstName}.`)
                return (
                  <a
                    key={i}
                    href={`https://wa.me/55${whatsappPhone}?text=${msg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="msg-chip"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 12,
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{m.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{m.label}</span>
                    <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Botão principal WhatsApp */}
        {whatsappPhone ? (
          <div className="fu3">
            <a
              href={`https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(`Olá! Sou ${firstName} e gostaria de falar sobre meu consórcio.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '16px', borderRadius: 14,
                background: '#25D366',
                color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
              }}
            >
              <MessageCircle size={19} />
              Abrir WhatsApp
            </a>
          </div>
        ) : (
          <div className="fu3" style={{
            padding: '20px', borderRadius: 14,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
          }}>
            <Send size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Nenhum consultor vinculado ainda.<br />Aguarde seu consultor entrar em contato.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
