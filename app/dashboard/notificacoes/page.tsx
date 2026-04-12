import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, TrendingUp, CheckCircle } from 'lucide-react'

export default async function NotificacoesPage() {
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await db.from('users').select('id, role, tenant_id').eq('id', user.id).single()
  if (!userData) redirect('/login')

  const u = userData as { id: string; role: string; tenant_id: string | null }

  const { data: notifs } = await db
    .from('seller_notifications')
    .select('*')
    .eq('seller_id', u.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Marcar todas como lidas
  await db.from('seller_notifications').update({ read: true }).eq('seller_id', u.id).eq('read', false)

  const notifications = (notifs || []) as Array<{
    id: string; created_at: string; type: string
    title: string; body: string; read: boolean; data: Record<string, unknown>
  }>

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}m atrás`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h atrás`
    return `${Math.floor(hrs / 24)}d atrás`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Notificações</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
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
          {notifications.map((n) => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
              borderRadius: 14, background: 'var(--bg-secondary)',
              border: `1px solid ${n.read ? 'var(--border-color)' : 'rgba(0,212,200,0.3)'}`,
              position: 'relative',
            }}>
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: n.type === 'simulation' ? 'rgba(0,212,200,0.1)' : 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {n.type === 'simulation'
                  ? <TrendingUp size={18} style={{ color: 'var(--tenant-primary)' }} />
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
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: Number(n.data.probability) >= 70 ? 'rgba(0,212,200,0.1)' : Number(n.data.probability) >= 40 ? 'rgba(246,173,85,0.1)' : 'rgba(255,71,87,0.1)',
                      color: Number(n.data.probability) >= 70 ? '#00D4C8' : Number(n.data.probability) >= 40 ? '#F6AD55' : '#ff4757',
                    }}>
                      {n.data.probability}% de chance
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                    }}>
                      {Number(n.data.lance_percent).toFixed(1)}% do crédito
                    </span>
                  </div>
                )}
              </div>

              {!n.read && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--tenant-primary)', flexShrink: 0, marginTop: 4,
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
