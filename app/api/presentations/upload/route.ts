import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

/**
 * POST /api/presentations/upload
 *
 * Upload de logo da empresa ou foto do vendedor para o bucket
 * `presentation-assets`. Devolve a URL pública do arquivo.
 *
 * FormData:
 *   - file: File (imagem)
 *   - kind: 'logo' | 'photo'
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: userData } = await admin
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const tenantId = (userData as { tenant_id: string | null } | null)?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuário sem tenant' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const kind = formData.get('kind') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    }
    if (kind !== 'logo' && kind !== 'photo') {
      return NextResponse.json({ error: 'kind deve ser "logo" ou "photo"' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx 10MB)' }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Formato não suportado. Use PNG, JPG, WEBP, GIF ou SVG.' }, { status: 400 })
    }

    const ext = (file.type.split('/')[1] || 'png').replace('+xml', '')
    const filename = `${randomBytes(8).toString('hex')}.${ext}`
    const path = `${tenantId}/${user.id}/${kind}/${filename}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('presentation-assets')
      .upload(path, buffer, {
        upsert: false,
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage
      .from('presentation-assets')
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrl, path })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/**
 * DELETE /api/presentations/upload?path=tenant_id/user_id/...
 *
 * Remove um arquivo previamente upado. Útil quando o usuário troca a foto
 * para limpar a anterior.
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data: userData } = await admin
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const tenantId = (userData as { tenant_id: string | null } | null)?.tenant_id
    if (!tenantId) return NextResponse.json({ error: 'Sem tenant' }, { status: 403 })

    const url = new URL(request.url)
    const path = url.searchParams.get('path')
    if (!path) return NextResponse.json({ error: 'path obrigatório' }, { status: 400 })

    // Garantia: o path tem que começar com o tenant_id do usuário
    if (!path.startsWith(`${tenantId}/`)) {
      return NextResponse.json({ error: 'Sem permissão para esse arquivo' }, { status: 403 })
    }

    const { error } = await admin.storage.from('presentation-assets').remove([path])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
