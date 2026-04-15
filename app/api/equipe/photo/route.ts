import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: userData } = await admin.from('users').select('role, tenant_id').eq('id', user.id).single()
    const u = userData as { role: string; tenant_id: string } | null
    if (!u || u.role === 'seller') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const seller_id = formData.get('seller_id') as string | null
    if (!file || !seller_id) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    const { data: seller } = await admin.from('users').select('id').eq('id', seller_id).eq('tenant_id', u.tenant_id).single()
    if (!seller) return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${u.tenant_id}/${seller_id}.${ext}`

    const { error: uploadError } = await admin.storage
      .from('seller-photos')
      .upload(path, buffer, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = admin.storage.from('seller-photos').getPublicUrl(path)

    await admin.from('users').update({ avatar_url: publicUrl }).eq('id', seller_id)

    return NextResponse.json({ success: true, avatar_url: publicUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
