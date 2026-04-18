import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getViewingTenantId } from '@/lib/supabase/get-tenant'
import { createClient as createAdmin } from '@supabase/supabase-js'
import ConectarWhatsApp from './ConectarWhatsApp'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function ConexoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = await getViewingTenantId()
  if (!tenantId) redirect('/login')

  // Busca dados do usuário logado (instância por usuário)
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('zapi_instance_id, whatsapp_phone, whatsapp_name')
    .eq('id', user.id)
    .single()

  const u = currentUser as {
    zapi_instance_id: string | null
    whatsapp_phone: string | null
    whatsapp_name: string | null
  } | null

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Conexões
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Conecte seu WhatsApp e receba todas as mensagens aqui no sistema
        </p>
      </div>

      <ConectarWhatsApp
        initialPhone={u?.whatsapp_phone || null}
        initialName={u?.whatsapp_name || null}
        tenantId={tenantId}
        hasInstance={!!u?.zapi_instance_id}
      />

      {/* Shortcut to conversations */}
      {u?.whatsapp_phone && (
        <Link
          href="/dashboard/conversas"
          className="card-pg p-4 flex items-center justify-between transition-all"
          style={{ border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Ver Conversas
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Todas as mensagens recebidas neste número
              </p>
            </div>
          </div>
          <span className="text-sm" style={{ color: 'var(--accent)' }}>→</span>
        </Link>
      )}
    </div>
  )
}
