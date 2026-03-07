/**
 * Create Supabase tables via REST API
 * Run: npx tsx scripts/create-tables.ts
 * 
 * NOTE: This uses the Supabase Management API.
 * If it fails, run the SQL in Supabase Dashboard → SQL Editor.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTable(name: string): Promise<boolean> {
  const { data, error } = await supabase.from(name).select('id').limit(1)
  if (error?.message?.includes('schema cache') || error?.message?.includes('does not exist')) {
    return false
  }
  return true
}

async function main() {
  console.log('Checking existing tables...')
  
  const tables = ['merchants', 'events', 'conversations', 'handoffs', 'products']
  for (const t of tables) {
    const exists = await checkTable(t)
    console.log(`  ${t}: ${exists ? '✅ exists' : '❌ missing'}`)
  }

  console.log('\n⚠️  Cannot create tables via REST API — you need to run the SQL migration.')
  console.log('\nOptions:')
  console.log('1. Go to Supabase Dashboard → SQL Editor → paste the SQL from:')
  console.log('   /clawd/agents/marketing/plans/merchant-onboarding-pipeline-v2-implementation.md (Section 3.1)')
  console.log('')
  console.log('2. Or use this command with the DB connection string:')
  console.log('   psql "postgresql://postgres.ttaebkbtqubzcojhujpe:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -f scripts/001_initial_schema.sql')
}

main().catch(console.error)
