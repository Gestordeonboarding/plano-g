import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '../lib/presentations/templates-data'

const supabase = createClient(
  'https://lvwolzigguuuswwxjnvg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('Seeding presentation templates...')

  for (const template of TEMPLATES) {
    const { error } = await supabase
      .from('presentation_templates')
      .upsert({
        name: template.name,
        description: template.description,
        category: template.category,
        animation_style: template.animation_style,
        sort_order: template.sort_order,
        slides: template.slides,
        theme: template.theme,
        is_active: true,
      }, { onConflict: 'name' })

    if (error) {
      console.error(`Error seeding "${template.name}":`, error.message)
    } else {
      console.log(`✓ "${template.name}"`)
    }
  }

  console.log('Done!')
}

main()
