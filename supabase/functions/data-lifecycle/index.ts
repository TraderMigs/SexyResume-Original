import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Rate limiting for data lifecycle operations
const lifecycleRateLimit = new Map<string, number[]>();

function checkLifecycleRateLimit(identifier: string, maxRequests: number = 5, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const requests = lifecycleRateLimit.get(identifier) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  lifecycleRateLimit.set(identifier, recentRequests);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Rate limiting check
    if (!checkLifecycleRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Too many data lifecycle requests. Please try again later.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' },
          status: 429,
        }
      )
    }

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (action) {
      case 'export':
        return await exportUserData(req, supabaseClient, user)
      
      case 'delete-account':
        return await deleteUserAccount(req, supabaseClient, user)
      
      case 'data-summary':
        return await getUserDataSummary(req, supabaseClient, user)
      
      default:
        throw new Error('Invalid endpoint')
    }

  } catch (error) {
    console.error('Data lifecycle error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function exportUserData(req: Request, supabaseClient: any, user: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  const { format = 'json' } = await req.json()

  try {
    console.log(`Exporting data for user ${user.id} in ${format} format`)

    // Call the database function to export user data
    const { data: exportData, error: exportError } = await supabaseClient
      .rpc('export_user_data', { p_user_id: user.id, p_format: format })

    if (exportError) throw exportError

    // Log the data export request
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'data_export_requested',
        target_type: 'user_data',
        target_id: user.id,
        change_data: { format, export_size: JSON.stringify(exportData).length }
      })

    // Return the data as a downloadable file
    const fileName = `sexyresume-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`
    
    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Data export failed:', error)
    throw error
  }
}

async function deleteUserAccount(req: Request, supabaseClient: any, user: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  const { immediate = false } = await req.json()

  try {
    console.log(`Account deletion requested for user ${user.id}, immediate: ${immediate}`)

    // Call the database function to handle account deletion
    const { data: deletionResult, error: deletionError } = await supabaseClient
      .rpc('delete_user_account', { 
        p_user_id: user.id, 
        p_immediate: immediate 
      })

    if (deletionError) throw deletionError

    // Log the deletion request
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'account_deletion_requested',
        target_type: 'user_account',
        target_id: user.id,
        change_data: { 
          immediate, 
          deletion_job_id: deletionResult.deletion_job_id,
          summary: deletionResult.summary
        }
      })

    return new Response(
      JSON.stringify(deletionResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Account deletion failed:', error)
    throw error
  }
}

async function getUserDataSummary(req: Request, supabaseClient: any, user: any) {
  if (req.method !== 'GET') {
    throw new Error('Method not allowed')
  }

  try {
    // Get summary of user's data
    const [
      { count: resumeCount },
      { count: coverLetterCount },
      { count: exportCount },
      { data: entitlement },
      { count: paymentCount }
    ] = await Promise.all([
      supabaseClient.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseClient.from('cover_letters').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseClient.from('exports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseClient.from('user_entitlements').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('payment_receipts').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    ])

    const summary = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      data_summary: {
        resumes: resumeCount || 0,
        cover_letters: coverLetterCount || 0,
        exports: exportCount || 0,
        payments: paymentCount || 0,
        export_unlocked: entitlement?.export_unlocked || false
      },
      retention_info: {
        resumes: '365 days after last update',
        cover_letters: '365 days after last update',
        exports: '24 hours after creation',
        account: '3 years after last activity',
        payments: '7 years (legal requirement)'
      }
    }

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Data summary failed:', error)
    throw error
  }
}