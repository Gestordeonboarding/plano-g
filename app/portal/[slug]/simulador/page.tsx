import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, daysUntil } from '@/lib/utils'
import SimuladorClient from './SimuladorClient'
import { Bell, Calendar, TrendingUp } from 'lucide-react'

export default async function SimuladorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await db.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/entrar`)

  const { data: cons } = await db
    .from('consorciados')
    .select('id, credit_value, group_number, quota_number, installments_paid, monthly_installment, contemplation_score, next_assembly_date, asset_type, administrator')
    .eq('user_id', user.id)
    .eq('tenant_id', (tenant as { id: string }).id)
    .limit(1)

  const con = cons?.[0] as {
    id: string; credit_value: number; group_number: string | null; quota_number: string | null
    installments_paid: number; monthly_installment: number | null; contemplation_score: number
    next_assembly_date: string | null; asset_type: string | null; administrator: string | null
  } | null

  if (!con) redirect(`/portal/${slug}`)

  const { data: assemblies } = await db
    .from('assemblies')
    .select('assembly_date, winning_bid_percentage, winning_bid_amount')
    .eq('group_number', con.group_number || '')
    .order('assembly_date', { ascending: false })
    .limit(10)

  const history = (assemblies || []) as Array<{
    assembly_date: string
    winning_bid_percentage: number | null
    winning_bid_amount: number | null
  }>

  const estimatedBalance = (con.installments_paid || 0) * (con.monthly_installment || 0) * 0.3
  const dias = daysUntil(con.next_assembly_date)

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fu1{animation:fadeUp .4s ease .0s both} .fu2{animation:fadeUp .4s ease .1s both}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div className="fu1">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TrendingUp size={20} style={{ color: 'var(--tenant-primary)' }} />
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Simular Lance</h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Descubra suas chances de contemplação
          </p>
        </div>

        {/* Alertas de datas */}
        <div className="fu2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Próxima assembleia */}
          {con.next_assembly_date && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
              background: dias !== null && dias <= 15
                ? 'rgba(246,173,85,0.1)' : 'var(--bg-secondary)',
              border: dias !== null && dias <= 15
                ? '1px solid rgba(246,173,85,0.3)' : '1px solid var(--border-color)',
            }}>
              <Bell size={16} color={dias !== null && dias <= 15 ? '#F6AD55' : 'var(--text-muted)'} />
              <div>
                <p style={{
                  fontSize: 12, fontWeight: 700,
                  color: dias !== null && dias <= 15 ? '#F6AD55' : 'var(--text-primary)',
                }}>
                  {dias !== null && dias <= 15
                    ? `Assembleia em ${dias} dia${dias !== 1 ? 's' : ''}!`
                    : 'Próxima assembleia'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(con.next_assembly_date)}</p>
              </div>
            </div>
          )}

          {/* Lembrete de pagamento */}
          {con.monthly_installment && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            }}>
              <Calendar size={16} style={{ color: 'var(--tenant-primary)' }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Lembrete de parcela</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Mantenha sua parcela em dia para manter seu score alto
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Simulador */}
        <SimuladorClient
          consorciadoId={con.id}
          slug={slug}
          creditValue={con.credit_value}
          estimatedBalance={estimatedBalance}
          assetType={con.asset_type}
          nextAssemblyDate={con.next_assembly_date}
          history={history}
        />
      </div>
    </>
  )
}
