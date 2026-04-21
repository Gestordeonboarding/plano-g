import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, TrendingUp } from 'lucide-react'

type Notif = {
  id: string
  created_at: string
  type: string
  title: string
  body: string
  read: boolean
  seller_id: string
  data: Record<string, unknown>
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

function NotifCard({ n }: { n: Notif }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
      borderRadius: 14, background: 'var(--bg-secondary)',
      border: `1px solid ${n.read ? 'var(--border-color)' : 'rgba(0,212,200,0.3)'}`,
      position: 'relative',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: n.type === 'simulation' ? 'rgba(0,212,200,0.1)' : 'var(--bg-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {n.type === 'simulation'
          ? <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
          : <Bell size={18} style={{ color: 'var(--text-muted)' }} />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{timeAgo(n.created_at)}</p>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.body}</p>

        {n.type === 'simulation' && n.data?.probability != null && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            {(() => {
              const prob = Number(n.data.probability)
              const pct = Number(n.data.lance_percent)
              const probColor = prob >= 70 ? '#00D4C8' : prob >= 40 ? '#F6AD55' : '#ff4757'
              const probBg = prob >= 70 ? 'rgba(0,212,200,0.1)' : prob >= 40 ? 'rgba(246,173,85,0.1)' : 'rgba(255,71,87,0.1)'
              return (
                <>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: probBg, color: probColor }}>
                    {prob}% de chance
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                    {pct.toFixed(1)}% do crédito
                  </span>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {!n.read && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0, marginTop: 4,
        }} />
      )}
    </div>
  )
}

export default async function NotificacoesPage() {
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await db.from('users').select('id, role, tenant_id').eq('id', user.id).single()
  if (!userData) redirect('/login')

  const u = userData as { id: string; role: string; tenant_id: string | null }
  const isManager = u.role !== 'seller'

  if (isManager && u.tenant_id) {
    // Gerente: busca todas as notificações do tenant
    const [{ data: notifs }, { data: sellersData }] = await Promise.all([
      db.from('seller_notifications')
        .select('*')
        .eq('tenant_id', u.tenant_id)
        .order('created_at', { ascending: false })
        .limit(200),
      db.from('users')
        .select('id, full_name, email')
        .eq('tenant_id', u.tenant_id),
    ])

    // Marca todas como lidas
    await db.from('seller_notifications')
      .update({ read: true })
      .eq('tenant_id', u.tenant_id)
      .eq('read', false)

    const notifications = (notifs || []) as Notif[]
    const sellers = (sellersData || []) as Array<{ id: string; full_name: string | null; email: string | null }>

    // Agrupa por vendedor
    const bySeller = sellers
      .map((s) => ({
        seller: s,
        notifs: notifications.filter((n) => n.seller_id === s.id),
      }))
      .filter((g) => g.notifs.length > 0)

    const unreadTotal = notifications.filter((n) => !n.read).length

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Notificações</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: 'var(--text-muted)' }}>
            Atividade dos clientes de todos os vendedores
            {unreadTotal > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>
                {unreadTotal} nova{unreadTotal !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {bySeller.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: '60px 24px', borderRadius: 16,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          }}>
            <Bell size={32} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma notificação ainda</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {bySeller.map(({ seller, notifs: sNotifs }) => (
              <div key={seller.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Cabeçalho do vendedor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)',
                    fontWeight: 700, fontSize: 14,
                  }}>
                    {(seller.full_name || seller.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                      {seller.full_name || seller.email}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {sNotifs.length} notificaç{sNotifs.length !== 1 ? 'ões' : 'ão'}
                      {sNotifs.filter(n => !n.read).length > 0 && (
                        <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 700 }}>
                          · {sNotifs.filter(n => !n.read).length} nova{sNotifs.filter(n => !n.read).length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Notificações do vendedor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 44 }}>
                  {sNotifs.map((n) => <NotifCard key={n.id} n={n} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Vendedor: só vê as próprias notificações
  const { data: notifs } = await db
    .from('seller_notifications')
    .select('*')
    .eq('seller_id', u.id)
    .order('created_at', { ascending: false })
    .limit(50)

  await db.from('seller_notifications').update({ read: true }).eq('seller_id', u.id).eq('read', false)

  const notifications = (notifs || []) as Notif[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Notificações</h1>
        <p style={{ fontSize: 14, marginTop: 4, color: 'var(--text-muted)' }}>
          Atividade dos seus clientes em tempo real
        </p>
      </div>

      {notifications.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '60px 24px', borderRadius: 16,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        }}>
          <Bell size={32} style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma notificação ainda</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n) => <NotifCard key={n.id} n={n} />)}
        </div>
      )}
    </div>
  )
}
