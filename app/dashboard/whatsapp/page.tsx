import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WhatsAppConnect from '../configuracoes/WhatsAppConnect'

export default async function WhatsAppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('whatsapp_phone, zapi_instance_id')
    .eq('id', user.id)
    .single()

  const u = userData as { whatsapp_phone: string | null; zapi_instance_id: string | null } | null
  const isConfigured = !!u?.zapi_instance_id

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Meu WhatsApp
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Conecte seu número para receber leads automaticamente
        </p>
      </div>

      {!isConfigured ? (
        <div className="card-pg p-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Sua instância WhatsApp ainda não foi ativada
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Entre em contato com o administrador do seu escritório para ativar o WhatsApp na sua conta.
          </p>
        </div>
      ) : (
        <WhatsAppConnect initialPhone={u?.whatsapp_phone || null} />
      )}

      <div className="card-pg p-5">
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Como funciona
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { n: '1', t: 'Conecte seu WhatsApp', d: 'Escaneie o QR Code com seu celular' },
            { n: '2', t: 'Receba contatos', d: 'Quem te mandar mensagem vira lead automaticamente' },
            { n: '3', t: 'Gerencie no Kanban', d: 'Os leads aparecem na aba Leads para você acompanhar' },
            { n: '4', t: 'Gerente acompanha tudo', d: 'O administrador do escritório vê os leads de toda a equipe' },
          ].map((item) => (
            <div key={item.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}>
                {item.n}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.t}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
