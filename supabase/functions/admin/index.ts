import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
}

interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'super_admin'
  permissions: string[]
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

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check admin permissions (simplified - in production, implement proper role checking)
    const isAdmin = await verifyAdminPermissions(user.id, supabaseClient)
    if (!isAdmin) {
      throw new Error('Admin access required')
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    switch (action) {
      case 'permissions':
        return await getUserPermissions(req, supabaseClient, user)
      
      case 'dashboard':
        return await getAdminDashboard(req, supabaseClient, user)
      
      case 'users':
        return await manageUsers(req, supabaseClient, user)
      
      case 'purge-status':
        return await getPurgeStatus(req, supabaseClient, user)
      
      case 'force-purge':
        return await forcePurge(req, supabaseClient, user)
      
      case 'audit-logs':
        return await getAuditLogs(req, supabaseClient, user)
      
      case 'system-health':
        return await getSystemHealth(req, supabaseClient, user)
      
      default:
        throw new Error('Invalid admin endpoint')
    }

  } catch (error) {
    console.error('Admin API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Unauthorized') || error.message.includes('Admin access') ? 403 : 400,
      }
    )
  }
})

async function verifyAdminPermissions(userId: string, supabaseClient: any): Promise<boolean> {
  try {
    // Check if user exists in admin_users table with active admin role
    const { data: adminUser, error } = await supabaseClient
      .from('admin_users')
      .select('role, permissions, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    
    if (error || !adminUser) {
      return false
    }
    
    // Verify user has admin or super_admin role
    return ['admin', 'super_admin'].includes(adminUser.role)
  } catch (error) {
    console.error('Admin permission check failed:', error)
    return false
  }
}

async function getUserPermissions(req: Request, supabaseClient: any, user: any) {
  if (req.method !== 'GET') {
    throw new Error('Method not allowed')
  }

  try {
    const { data: adminUser, error } = await supabaseClient
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !adminUser) {
      throw new Error('Admin user not found')
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          role: adminUser.role,
          permissions: adminUser.permissions || [],
          isActive: adminUser.is_active
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Failed to get user permissions:', error)
    throw error
  }
}

async function getAdminDashboard(req: Request, supabaseClient: any, adminUser: any) {
  if (req.method !== 'GET') {
    throw new Error('Method not allowed')
  }

  try {
    // Get system statistics
    const stats = await Promise.all([
      // User statistics
      supabaseClient.from('users').select('id', { count: 'exact', head: true }),
      supabaseClient.from('users').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Resume statistics
      supabaseClient.from('resumes').select('id', { count: 'exact', head: true }),
      supabaseClient.from('resumes').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Export statistics
      supabaseClient.from('exports').select('id', { count: 'exact', head: true }),
      supabaseClient.from('exports').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Payment statistics
      supabaseClient.from('payment_receipts').select('amount', { count: 'exact' }).eq('status', 'succeeded'),
      supabaseClient.from('payment_receipts').select('amount').eq('status', 'succeeded').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const [
      totalUsers, newUsers,
      totalResumes, newResumes,
      totalExports, newExports,
      allPayments, recentPayments
    ] = stats

    // Calculate revenue
    const totalRevenue = allPayments.data?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0
    const weeklyRevenue = recentPayments.data?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0

    // Get recent errors
    const { data: recentErrors } = await supabaseClient
      .from('error_logs')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get storage usage
    const { data: storageStats } = await supabaseClient.storage
      .from('resume-exports')
      .list('', { limit: 1000 })

    const storageSize = storageStats?.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0) || 0

    const dashboard = {
      users: {
        total: totalUsers.count || 0,
        newThisWeek: newUsers.count || 0
      },
      resumes: {
        total: totalResumes.count || 0,
        newThisWeek: newResumes.count || 0
      },
      exports: {
        total: totalExports.count || 0,
        newThisWeek: newExports.count || 0
      },
      revenue: {
        total: totalRevenue / 100, // Convert from cents
        thisWeek: weeklyRevenue / 100
      },
      system: {
        storageUsed: storageSize,
        unresolvedErrors: recentErrors?.length || 0,
        lastPurgeRun: await getLastPurgeRun(supabaseClient)
      },
      recentErrors: recentErrors || []
    }

    // Log admin dashboard access
    await logAdminAction(supabaseClient, adminUser.id, 'dashboard_accessed', 'system', 'admin_dashboard')

    return new Response(
      JSON.stringify(dashboard),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Failed to get admin dashboard:', error)
    throw error
  }
}

async function getLastPurgeRun(supabaseClient: any): Promise<string | null> {
  const { data: lastJob } = await supabaseClient
    .from('purge_jobs')
    .select('completed_at')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  return lastJob?.completed_at || null
}

async function logAdminAction(
  supabaseClient: any, 
  adminUserId: string, 
  action: string, 
  targetType: string, 
  targetId: string, 
  changeData: any = {},
  severity: string = 'info'
) {
  try {
    await supabaseClient
      .from('admin_logs')
      .insert({
        admin_user_id: adminUserId,
        action,
        target_type: targetType,
        target_id: targetId,
        change_data: changeData,
        severity
      })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

async function manageUsers(req: Request, supabaseClient: any, adminUser: any) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')

  switch (req.method) {
    case 'GET': {
      if (userId) {
        // Get specific user details
        const { data: user, error: userError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) throw userError

        // Get user's resumes count
        const { count: resumeCount } = await supabaseClient
          .from('resumes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)

        // Get user's exports count
        const { count: exportCount } = await supabaseClient
          .from('exports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)

        // Get user's entitlement
        const { data: entitlement } = await supabaseClient
          .from('user_entitlements')
          .select('*')
          .eq('user_id', userId)
          .single()

        return new Response(
          JSON.stringify({
            user,
            stats: {
              resumeCount: resumeCount || 0,
              exportCount: exportCount || 0,
              exportUnlocked: entitlement?.export_unlocked || false
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else {
        // Get all users with pagination
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = (page - 1) * limit

        const { data: users, error: usersError, count } = await supabaseClient
          .from('users')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (usersError) throw usersError

        return new Response(
          JSON.stringify({
            users: users || [],
            pagination: {
              page,
              limit,
              total: count || 0,
              totalPages: Math.ceil((count || 0) / limit)
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    }

    default:
      throw new Error('Method not allowed')
  }
}

async function getPurgeStatus(req: Request, supabaseClient: any, adminUser: any) {
  // Delegate to data-purge function
  const purgeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/data-purge/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
  })

  if (!purgeResponse.ok) {
    throw new Error('Failed to get purge status')
  }

  const purgeData = await purgeResponse.json()

  // Log admin access
  await logAdminAction(supabaseClient, adminUser.id, 'purge_status_accessed', 'system', 'data_purge')

  return new Response(
    JSON.stringify(purgeData),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function forcePurge(req: Request, supabaseClient: any, adminUser: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  const { tableName, recordIds, reason } = await req.json()

  if (!tableName || !recordIds || !Array.isArray(recordIds) || !reason) {
    throw new Error('Table name, record IDs, and reason are required')
  }

  // Log the force purge request
  await logAdminAction(
    supabaseClient, 
    adminUser.id, 
    'force_purge_requested', 
    tableName, 
    recordIds.join(','),
    { reason, recordCount: recordIds.length },
    'warning'
  )

  // Delegate to data-purge function
  const purgeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/data-purge/force`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tableName, recordIds, reason })
  })

  if (!purgeResponse.ok) {
    const errorData = await purgeResponse.json()
    throw new Error(errorData.error || 'Force purge failed')
  }

  const result = await purgeResponse.json()

  return new Response(
    JSON.stringify(result),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function getAuditLogs(req: Request, supabaseClient: any, adminUser: any) {
  if (req.method !== 'GET') {
    throw new Error('Method not allowed')
  }

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '100')
  const userId = url.searchParams.get('userId')
  const action = url.searchParams.get('action')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  const offset = (page - 1) * limit

  try {
    let query = supabaseClient
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (userId) query = query.eq('user_id', userId)
    if (action) query = query.eq('action', action)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data: auditLogs, error: logsError, count } = await query
      .range(offset, offset + limit - 1)

    if (logsError) throw logsError

    // Log admin access
    await logAdminAction(supabaseClient, adminUser.id, 'audit_logs_accessed', 'system', 'audit_logs', {
      filters: { userId, action, startDate, endDate },
      resultCount: auditLogs?.length || 0
    })

    return new Response(
      JSON.stringify({
        auditLogs: auditLogs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Failed to get audit logs:', error)
    throw error
  }
}

async function getSystemHealth(req: Request, supabaseClient: any, adminUser: any) {
  if (req.method !== 'GET') {
    throw new Error('Method not allowed')
  }

  try {
    // Check database health
    const dbHealthStart = Date.now()
    const { error: dbError } = await supabaseClient
      .from('users')
      .select('id')
      .limit(1)
    const dbResponseTime = Date.now() - dbHealthStart

    // Check storage health
    const storageHealthStart = Date.now()
    const { error: storageError } = await supabaseClient.storage
      .from('resume-exports')
      .list('', { limit: 1 })
    const storageResponseTime = Date.now() - storageHealthStart

    // Get recent error counts
    const { count: recentErrors } = await supabaseClient
      .from('error_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Get storage usage
    const { data: storageFiles } = await supabaseClient.storage
      .from('resume-exports')
      .list('', { limit: 1000 })

    const storageUsage = storageFiles?.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0) || 0

    const health = {
      database: {
        status: dbError ? 'error' : 'healthy',
        responseTime: dbResponseTime,
        error: dbError?.message
      },
      storage: {
        status: storageError ? 'error' : 'healthy',
        responseTime: storageResponseTime,
        usage: storageUsage,
        fileCount: storageFiles?.length || 0,
        error: storageError?.message
      },
      errors: {
        last24Hours: recentErrors || 0
      },
      timestamp: new Date().toISOString()
    }

    // Log health check
    await logAdminAction(supabaseClient, adminUser.id, 'system_health_checked', 'system', 'health_monitor')

    return new Response(
      JSON.stringify(health),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('System health check failed:', error)
    throw error
  }
}