/**
 * Query reutilizável do ranking do Modo TV.
 *
 * Busca TODOS os vendedores ativos do tenant (sellers + tenant_admins),
 * agrega métricas do mês corrente (leads, conversões, crédito total,
 * taxa de conversão, última venda) e devolve já ordenado por desempenho.
 *
 * Usado pela page server-side (SSR inicial) e pela API route (polling 30s).
 */

import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export interface SellerRankingItem {
  id: string
  full_name: string
  avatar_initial: string
  conversions: number      // leads com status 'convertido' no mês
  leads_count: number      // total de leads atribuídos no mês
  credit_total: number     // soma de desired_credit dos convertidos no mês
  conversion_rate: number  // % conversions / leads_count
  last_conversion_at: string | null
  // ── Campos legados (compatibilidade com TvClient atual) ──
  proposta: number         // leads com status 'proposta_enviada'
  documentacao: number     // leads com status 'documentacao'
  score: number            // 10×converted + 4×doc + 2×proposta + outros
}

interface LeadRow {
  seller_id: string | null
  status: string | null
  desired_credit: number | null
  created_at: string | null
  updated_at: string | null
}

interface SellerRow {
  id: string
  full_name: string | null
  email: string | null
}

/**
 * Carrega o ranking do tenant. NÃO filtra vendedores sem vendas —
 * todos os ativos aparecem (correção do bug de exibir só 1 vendedor).
 */
export async function getTVRanking(tenantId: string): Promise<SellerRankingItem[]> {
  // 1. Sellers do tenant — inclui sellers + tenant_admins (admins também vendem)
  const { data: sellersData } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .in('role', ['seller', 'tenant_admin'])
    .order('full_name', { ascending: true })

  const sellers = (sellersData ?? []) as SellerRow[]
  if (sellers.length === 0) return []

  // 2. Leads do mês atual — uma query só, agregamos em memória
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: leadsData } = await supabaseAdmin
    .from('leads')
    .select('seller_id, status, desired_credit, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth)

  const leads = (leadsData ?? []) as LeadRow[]

  // 3. Monta o ranking — UM item por vendedor (mesmo que tenha zero leads)
  const ranking: SellerRankingItem[] = sellers.map((s) => {
    const myLeads = leads.filter((l) => l.seller_id === s.id)
    const converted = myLeads.filter((l) => l.status === 'convertido')
    const proposta = myLeads.filter((l) => l.status === 'proposta_enviada').length
    const documentacao = myLeads.filter((l) => l.status === 'documentacao').length

    const conversions = converted.length
    const creditTotal = converted.reduce((sum, l) => sum + (l.desired_credit ?? 0), 0)
    const leadsCount = myLeads.length
    const conversionRate = leadsCount > 0 ? Math.round((conversions / leadsCount) * 100) : 0

    // última conversão por updated_at (proxy de quando virou convertido)
    const lastConversion = converted
      .map((l) => l.updated_at ?? l.created_at ?? '')
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null

    const score =
      conversions * 10 +
      documentacao * 4 +
      proposta * 2 +
      Math.max(0, leadsCount - conversions - documentacao - proposta)

    const fullName = s.full_name || s.email || 'Vendedor'

    return {
      id: s.id,
      full_name: fullName,
      avatar_initial: fullName.charAt(0).toUpperCase(),
      conversions,
      leads_count: leadsCount,
      credit_total: creditTotal,
      conversion_rate: conversionRate,
      last_conversion_at: lastConversion,
      proposta,
      documentacao,
      score,
    }
  })

  // 4. Ordena: conversões DESC, depois crédito total DESC, depois nome ASC
  return ranking.sort((a, b) => {
    if (b.conversions !== a.conversions) return b.conversions - a.conversions
    if (b.credit_total !== a.credit_total) return b.credit_total - a.credit_total
    return a.full_name.localeCompare(b.full_name)
  })
}
