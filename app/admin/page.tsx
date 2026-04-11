import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { Users, TrendingUp, CheckCircle, XCircle, Clock, Wifi, WifiOff, AlertTriangle, Plus, ArrowRight, Activity } from 'lucide-react'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function timeAgo(date: string | null): string {
  if (!date) return 'Nunca'
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'Agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days} dias atrás`
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`
  return `${Math.floor(days / 30)} meses atrás`
}

function activityLevel(lastSeen: string | null): { label: string; color: string; bg: string } {
  if (!lastSeen) return { label: 'Nunca acessou', color: 'var(--danger)', bg: 'rgba(255,92,92,0.1)' }
  const days = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 86400000)
  if (days <= 1) return { label: 'Ativo hoje', color: '#25D366', bg: 'rgba(37,211,102,0.1)' }
  if (days <= 7) return { label: 'Esta semana', color: 'var(--accent)', bg: 'rgba(0,212,200,0.1)' }
  if (days <= 30) return { label: `${days}d sem acesso`, color: '#FFB547', bg: 'rgba(255,181,71,0.1)' }
  return { label: `${days}d sem acesso`, color: 'var(--danger)', bg: 'rgba(255,92,92,0.1)' }
}

export default async function AdminPage() {
  const supabase = await createClient()

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // Fetch all tenants
  const { data: tenantsData } = await supabaseAdmin
    .from('tenants')
    .select('id, name, slug, plan, is_active, created_at, whatsapp_phone, zapi_instance_id')
    .order('created_at', { ascending: false })

  const tenants = (tenantsData || []) as Array<{
    id: string; name: string; slug: string; plan: string | null
    is_active: boolean; created_at: string
    whatsapp_phone: string | null; zapi_instance_id: string | null
  }>

  const tenantIds = tenants.map((t) => t.id)

  // Fetch all users per tenant (with last sign in from auth)
  const { data: usersData } = await supabaseAdmin
    .from('users')
    .select('id, tenant_id, role, is_active, full_name, email')
    .in('tenant_id', tenantIds.length > 0 ? tenantIds : ['none'])

  const users = (usersData || []) as Array<{
    id: string; tenant_id: string; role: string; is_active: boolean
    full_name: string | null; email: string | null
  }>

  // Fetch last sign in from auth.users
  const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = (authUsersData?.users || []) as Array<{
    id: string; last_sign_in_at: string | null; email: string | null
  }>
  const authMap = new Map(authUsers.map((u) => [u.id, u.last_sign_in_at]))

  // Fetch leads this month per tenant
  const { data: leadsData } = await supabaseAdmin
    .from('leads')
    .select('id, tenant_id, created_at')
    .in('tenant_id', tenantIds.length > 0 ? tenantIds : ['none'])

  const leads = (leadsData || []) as Array<{ id: string; tenant_id: string; created_at: string }>

  // Fetch total consorciados per tenant
  const { data: consData } = await supabaseAdmin
    .from('consorciados')
    .select('id, tenant_id, status')
    .in('tenant_id', tenantIds.length > 0 ? tenantIds : ['none'])

  const cons = (consData || []) as Array<{ id: string; tenant_id: string; status: string }>

  // Build per-tenant stats
  const tenantStats = tenants.map((t) => {
    const tUsers = users.filter((u) => u.tenant_id === t.id)
    const tLeads = leads.filter((l) => l.tenant_id === t.id)
    const tLeadsMes = tLeads.filter((l) => l.created_at >= firstOfMonth)
    const tCons = cons.filter((c) => c.tenant_id === t.id)

    // Most recent login across all users of this tenant
    const lastLogins = tUsers.map((u) => authMap.get(u.id) || null).filter(Boolean) as string[]
    const lastSeen = lastLogins.length > 0
      ? lastLogins.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null

    const activity = activityLevel(lastSeen)

    return {
      ...t,
      userCount: tUsers.length,
      activeUsers: tUsers.filter((u) => u.is_active).length,
      leadTotal: tLeads.length,
      leadsMes: tLeadsMes.length,
      consAtivos: tCons.filter((c) => c.status === 'ativo').length,
      lastSeen,
      activity,
      whatsappOk: !!t.whatsapp_phone,
    }
  })

  // Global KPIs
  const activeCount = tenantStats.filter((t) => t.is_active).length
  const inactiveCount = tenantStats.filter((t) => !t.is_active).length
  const usingToday = tenantStats.filter((t) => {
    if (!t.lastSeen) return false
    return Math.floor((Date.now() - new Date(t.lastSeen).getTime()) / 86400000) <= 1
  }).length
  const neverUsed = tenantStats.filter((t) => !t.lastSeen).length
  const totalLeadsMes = leads.filter((l) => l.created_at >= firstOfMonth).length

  // Split by activity
  const activeUsing = tenantStats.filter((t) => t.is_active && t.lastSeen && Math.floor((Date.now() - new Date(t.lastSeen).getTime()) / 86400000) <= 7)
  const needAttention = tenantStats.filter((t) => t.is_active && (!t.lastSeen || Math.floor((Date.now() - new Date(t.lastSeen).getTime()) / 86400000) > 7))
  const inactive = tenantStats.filter((t) => !t.is_active)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Visão Geral
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Acompanhe todos os seus clientes em tempo real
          </p>
        </div>
        <Link href="/admin/franqueados/novo" className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> Novo cliente
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { icon: <Users size={17} />, label: 'Clientes ativos', value: activeCount, color: 'var(--accent)', bg: 'rgba(0,212,200,0.12)' },
          { icon: <Activity size={17} />, label: 'Acessaram hoje', value: usingToday, color: '#25D366', bg: 'rgba(37,211,102,0.12)' },
          { icon: <TrendingUp size={17} />, label: 'Leads este mês', value: totalLeadsMes, color: 'var(--accent)', bg: 'rgba(0,212,200,0.12)' },
          { icon: <AlertTriangle size={17} />, label: 'Nunca acessaram', value: neverUsed, color: '#FFB547', bg: 'rgba(255,181,71,0.12)' },
          { icon: <XCircle size={17} />, label: 'Inativos', value: inactiveCount, color: 'var(--danger)', bg: 'rgba(255,92,92,0.12)' },
        ].map((kpi) => (
          <div key={kpi.label} className="card-pg p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: kpi.bg, color: kpi.color }}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
              <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usando ativamente */}
      {activeUsing.length > 0 && (
        <ClientSection
          title="Usando ativamente"
          subtitle="Acessaram nos últimos 7 dias"
          icon={<CheckCircle size={16} color="#25D366" />}
          clients={activeUsing}
        />
      )}

      {/* Precisam de atenção */}
      {needAttention.length > 0 && (
        <ClientSection
          title="Precisam de atenção"
          subtitle="Ativos mas sem acesso recente"
          icon={<AlertTriangle size={16} color="#FFB547" />}
          clients={needAttention}
          highlight
        />
      )}

      {/* Inativos */}
      {inactive.length > 0 && (
        <ClientSection
          title="Inativos"
          subtitle="Contas desativadas"
          icon={<XCircle size={16} color="var(--danger)" />}
          clients={inactive}
          muted
        />
      )}

      {tenantStats.length === 0 && (
        <div className="card-pg p-12 text-center flex flex-col items-center gap-3">
          <Users size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Nenhum cliente cadastrado</p>
          <Link href="/admin/franqueados/novo" className="btn-primary text-sm">
            Criar primeiro cliente →
          </Link>
        </div>
      )}
    </div>
  )
}

type ClientStat = {
  id: string; name: string; slug: string; plan: string | null
  is_active: boolean; userCount: number; activeUsers: number
  leadTotal: number; leadsMes: number; consAtivos: number
  lastSeen: string | null; activity: { label: string; color: string; bg: string }
  whatsappOk: boolean
}

function ClientSection({
  title, subtitle, icon, clients, highlight, muted
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  clients: ClientStat[]
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="card-pg overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: highlight ? 'rgba(255,181,71,0.04)' : muted ? 'rgba(255,92,92,0.03)' : 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          {clients.length}
        </span>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {['Cliente', 'Plano', 'Usuários', 'Leads/mês', 'Consorciados', 'WhatsApp', 'Último acesso', ''].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-[rgba(0,212,200,0.03)] transition-colors"
              style={{ borderTop: '1px solid var(--border-color)' }}>
              {/* Nome */}
              <td className="px-4 py-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.slug}</p>
                </div>
              </td>

              {/* Plano */}
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {c.plan || '—'}
                </span>
              </td>

              {/* Usuários */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Users size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{c.activeUsers}</span>
                  {c.userCount > c.activeUsers && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/{c.userCount}</span>
                  )}
                </div>
              </td>

              {/* Leads mês */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={13} style={{ color: c.leadsMes > 0 ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <span style={{ color: c.leadsMes > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {c.leadsMes}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({c.leadTotal} total)</span>
                </div>
              </td>

              {/* Consorciados */}
              <td className="px-4 py-3 text-sm" style={{ color: c.consAtivos > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {c.consAtivos}
              </td>

              {/* WhatsApp */}
              <td className="px-4 py-3">
                {c.whatsappOk ? (
                  <div className="flex items-center gap-1.5">
                    <Wifi size={13} color="#25D366" />
                    <span className="text-xs" style={{ color: '#25D366' }}>Conectado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <WifiOff size={13} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Não conectado</span>
                  </div>
                )}
              </td>

              {/* Último acesso */}
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: c.activity.bg, color: c.activity.color }}>
                  {c.activity.label}
                </span>
              </td>

              {/* Ações */}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center gap-3 justify-end">
                  <Link href={`/admin/view-as/${c.id}`}
                    className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
                    Entrar
                  </Link>
                  <Link href={`/admin/franqueados/${c.id}`}
                    className="text-xs hover:underline font-medium" style={{ color: 'var(--accent)' }}>
                    Editar →
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
