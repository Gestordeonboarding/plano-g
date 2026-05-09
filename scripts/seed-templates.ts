/**
 * Seed dos 8 templates v2.
 *
 * Pré-requisito: rodar antes o SQL `supabase_apresentacoes_v2.sql`
 * que apaga templates v1 e adiciona as colunas necessárias.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-templates.ts
 */

import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '../lib/presentations/templates-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lvwolzigguuuswwxjnvg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não definida no ambiente.')
    process.exit(1)
  }

  console.log('Apagando todos os templates existentes...')
  const { error: deleteErr } = await supabase
    .from('presentation_templates')
    .delete()
    .gte('created_at', '1970-01-01') // match-all

  if (deleteErr) {
    console.warn('Aviso ao apagar:', deleteErr.message)
  }

  console.log(`Inserindo ${TEMPLATES.length} templates v2...`)

  for (const template of TEMPLATES) {
    const { error } = await supabase
      .from('presentation_templates')
      .insert({
        name: template.name,
        description: template.description,
        category: template.category,
        sort_order: template.sort_order,
        slides: template.slides,
        default_customization: template.default_customization,
        schema_version: 2,
        is_active: true,
      })

    if (error) {
      console.error(`Erro ao inserir "${template.name}":`, error.message)
    } else {
      console.log(`  ✓ ${template.name}`)
    }
  }

  console.log('\nDone!')
}

main()
