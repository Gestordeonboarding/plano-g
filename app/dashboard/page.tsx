import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, daysUntil } from '@/lib/utils'
import Link from 'next/link'
import { TrendingUp, Users, UserCheck, Target, Calendar } from 'lucide-react'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import SellerHomeClient from './SellerHomeClient'
import AdminSellerStats from './AdminSellerStats'

export default async function DashboardPage() {
  const supabase = await createClient()
  const db = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  const { data: userData } = await db.from('users').select('role, full_name, avatar_url').eq('id', user.id).single()
  const role = (userData as { role: string } | null)?.role || 'seller'
  const isSeller = role === 'seller'

  // ── Seller view ──────────────────────────────────────────────
  if (isSeller) {
    const u = userData as { role: string; full_name: string | null; avatar_url: string | null }
    const currentMonth = new Date().toISOString().slice(0, 7)
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [commRes, prizeRes, allSellersRes, allLeadsRes, myLeadsRes] = await Promise.all([
      db.from('seller_commissions').select('*').eq('tenant_id', tenantId).eq('seller_id', user.id).limit(1),
      db.from('seller_prizes').select('*').eq('tenant_id', tenantId).eq('seller_id', user.id).eq('month', currentMonth).limit(1),
      db.from('users').select('id, full_name, avatar_url').eq('tenant_id', tenantId).eq('role', 'seller').eq('is_active', true),
      db.from('leads').select('seller_id, desired_credit').eq('tenant_id', tenantId).eq('status', 'convertido').gte('created_at', firstOfMonth),
      db.from('leads').select('id, desired_credit').eq('tenant_id', tenantId).eq('seller_id', user.id).eq('status', 'convertido').gte('created_at', firstOfMonth),
    ])

    const commission = (commRes.data?.[0] as { rate_percent: number; monthly_goal_leads: number; monthly_goal_credit: number } | null) ?? null
    const prize = (prizeRes.data?.[0] as { prize_description: string; is_revealed: boolean } | null) ?? null
    const allSellers = (allSellersRes.data || []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>
    const allLeads = (allLeadsRes.data || []) as Array<{ seller_id: string | null; desired_credit: number | null }>
    const myLeads = (myLeadsRes.data || []) as Array<{ id: string; desired_credit: number | null }>

    const initialRanking = allSellers.map(s => {
      const mine = allLeads.filter(l => l.seller_id === s.id)
      const credit = mine.reduce((sum, l) => sum + (l.desired_credit || 0), 0)
      const comm = commission && s.id === user.id ? commission : null
      const commission_earned = credit * ((comm?.rate_percent || 0) / 100)
      return { ...s, converted: mine.length, credit, commission_earned }
    }).sort((a, b) => b.converted - a.converted || b.credit - a.credit)

    const myCredit = myLeads.reduce((sum, l) => sum + (l.desired_credit || 0), 0)
    const commEarned = myCredit * ((commission?.rate_percent || 0) / 100)

    return (
      <SellerHomeClient
        userId={user.id}
        tenantId={tenantId}
        sellerName={u.full_name || 'Vendedor'}
        avatarUrl={u.avatar_url}
        commission={commission}
        prize={prize}
        initialRanking={initialRanking}
        convertedCount={myLeads.length}
        creditSold={myCredit}
        commissionEarned={commEarned}
        currentMonth={currentMonth}
      />
    )
  }

  const today = new Date()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // ── Dados pessoais de vendas do tenant_admin (ele também vende) ──
  const isAdmin = role === 'tenant_admin'
  const [adminCommRes, adminMyLeadsRes, adminAllMembersRes, adminAllLeadsRes] = isAdmin
    ? await Promise.all([
        db.from('seller_commissions').select('*').eq('tenant_id', tenantId).eq('seller_id', user.id).limit(1),
        db.from('leads').select('id, desired_credit').eq('tenant_id', tenantId).eq('seller_id', user.id).eq('status', 'convertido').gte('created_at', firstOfMonth),
        db.from('users').select('id, full_name, avatar_url').eq('tenant_id', tenantId).in('role', ['seller', 'tenant_admin']).eq('is_active', true),
        db.from('leads').select('seller_id, desired_credit').eq('tenant_id', tenantId).eq('status', 'convertido').gte('created_at', firstOfMonth),
      ])
    : [{ data: null }, { data: [] }, { data: [] }, { data: [] }]

  const adminCommission = (adminCommRes.data as { rate_percent: number; monthly_goal_leads: number; monthly_goal_credit: number }[] | null)?.[0] ?? null
  const adminMyLeads = (adminMyLeadsRes.data || []) as Array<{ id: string; desired_credit: number | null }>
  const adminAllMembers = (adminAllMembersRes.data || []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>
  const adminAllLeads = (adminAllLeadsRes.data || []) as Array<{ seller_id: string | null; desired_credit: number | null }>

  const adminMyCredit = adminMyLeads.reduce((sum, l) => sum + (l.desired_credit || 0), 0)
  const adminCommEarned = adminMyCredit * ((adminCommission?.rate_percent || 0) / 100)
  const adminRanking = adminAllMembers.map(s => {
    const mine = adminAllLeads.filter(l => l.seller_id === s.id)
    const credit = mine.reduce((sum, l) => sum + (l.desired_credit || 0), 0)
    const commission_earned = credit * ((adminCommission && s.id === user.id ? adminCommission.rate_percent : 0) / 100)
    return { ...s, converted: mine.length, credit, commission_earned }
  }).sort((a, b) => b.converted - a.converted || b.credit - a.credit)

  const adminName = (userData as { role: string; full_name: string | null } | null)?.full_name || 'Administrador'

  const [leadsHoje, leadesMes, consorciados, proximasAssembleias, sellers] = await Promise.all([
    (isSeller
      ? supabase.from('leads').select('id').eq('tenant_id', tenantId).eq('seller_id', user.id)
      : supabase.from('leads').select('id').eq('tenant_id', tenantId))
      .gte('created_at', new Date().toISOString().split('T')[0]),
    (isSeller
      ? supabase.from('leads').select('id, status').eq('tenant_id', tenantId).eq('seller_id', user.id)
      : supabase.from('leads').select('id, status').eq('tenant_id', tenantId))
      .gte('created_at', firstOfMonth),
    (isSeller
      ? supabase.from('consorciados').select('id').eq('tenant_id', tenantId).eq('seller_id', user.id).eq('status', 'ativo')
      : supabase.from('consorciados').select('id').eq('tenant_id', tenantId).eq('status', 'ativo')),
    (isSeller
      ? supabase.from('consorciados').select('id, full_name, group_number, quota_number, next_assembly_date, contemplation_score').eq('tenant_id', tenantId).eq('seller_id', user.id)
      : supabase.from('consorciados').select('id, full_name, group_number, quota_number, next_assembly_date, contemplation_score').eq('tenant_id', tenantId))
      .not('next_assembly_date', 'is', null)
      .lte('next_assembly_date', in30Days)
      .gte('next_assembly_date', today.toISOString().split('T')[0])
      .order('next_assembly_date', { ascending: true })
      .limit(10),
    supabase.from('users').select('id, full_name, email').eq('tenant_id', tenantId).eq('role', 'seller'),
  ])

  const totalLeadesMes = leadesMes.data?.length || 0
  const convertidos = leadesMes.data?.filter((l: { status: string }) => l.status === 'convertido').length || 0
  const taxa = totalLeadesMes > 0 ? ((convertidos / totalLeadesMes) * 100).toFixed(0) : '0'

  const assembleias = (proximasAssembleias.data || []) as Array<{
    id: string; full_name: string; group_number: string | null
    quota_number: string | null; next_assembly_date: string; contemplation_score: number
  }>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Início
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Resumo do seu escritório
        </p>
      </div>

      {/* Stats pessoais do admin como vendedor */}
      {isAdmin && (
        <AdminSellerStats
          userId={user.id}
          adminName={adminName}
          commission={adminCommission}
          convertedCount={adminMyLeads.length}
          creditSold={adminMyCredit}
          commissionEarned={adminCommEarned}
          initialRanking={adminRanking}
          currentMonth={currentMonth}
        />
      )}

      {/* Cards de métricas */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <TrendingUp size={18} />, label: 'Leads hoje', value: leadsHoje.data?.length || 0 },
          { icon: <Users size={18} />, label: 'Leads no mês', value: totalLeadesMes },
          { icon: <UserCheck size={18} />, label: 'Consorciados ativos', value: consorciados.data?.length || 0 },
          { icon: <Target size={18} />, label: 'Conversão do mês', value: `${taxa}%` },
        ].map((m) => (
          <div key={m.label} className="card-pg p-5 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(0,212,200,0.12)', color: 'var(--accent)' }}
            >
              {m.icon}
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {m.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Próximas assembleias */}
      <div className="card-pg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Próximas assembleias (30 dias)
          </h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>
            {assembleias.length}
          </span>
        </div>

        {assembleias.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhuma assembleia nos próximos 30 dias.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                {['Consorciado', 'Grupo/Cota', 'Data', 'Em dias', 'Score'].map((h) => (
                  <th key={h} className="text-left pb-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assembleias.map((a) => {
                const dias = daysUntil(a.next_assembly_date)
                const score = a.contemplation_score
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="py-2.5">
                      <Link href={`/dashboard/consorciados/${a.id}`}
                        className="font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>
                        {a.full_name}
                      </Link>
                    </td>
                    <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {a.group_number || '—'}/{a.quota_number || '—'}
                    </td>
                    <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(a.next_assembly_date)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={dias !== null && dias <= 7
                          ? { backgroundColor: 'rgba(255,92,92,0.15)', color: 'var(--danger)' }
                          : { backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}
                      >
                        {dias !== null ? `${dias}d` : '—'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <ScoreBadge score={score} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) return <span className="badge-score-high">Alto {score}</span>
  if (score >= 40) return <span className="badge-score-mid">Médio {score}</span>
  return <span className="badge-score-low">Baixo {score}</span>
}
