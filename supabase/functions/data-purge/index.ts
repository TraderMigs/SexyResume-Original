import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface PurgeJobResult {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  recordsProcessed: number
  recordsDeleted: number
  recordsArchived: number
  errorMessage?: string
  startedAt?: string
  completedAt?: string
}

interface RetentionPolicy {
  tableName: string
  retentionDays: number
  softDelete: boolean
  archiveBeforeDelete: boolean
  archiveStorageBucket?: string
  isActive: boolean
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

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (action) {
      case 'status':
        return await getPurgeStatus(req, supabaseClient)
      
      case 'run':
        return await runPurgeJob(req, supabaseClient)
      
      case 'force':
        return await forcePurge(req, supabaseClient)
      
      case 'schedule':
        return await scheduleAutomaticPurge(req, supabaseClient)
      
      default:
        throw new Error('Invalid endpoint')
    }

  } catch (error) {
    console.error('Data purge error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function getPurgeStatus(req: Request, supabaseClient: any) {
  if (req.method !== 'GET') {
    throw new Error('Method not allowed')
  }

  try {
    // Get retention policies
    const { data: policies, error: policiesError } = await supabaseClient
      .from('data_retention_policies')
      .select('*')
      .eq('is_active', true)
      .order('table_name')

    if (policiesError) throw policiesError

    // Get recent purge jobs
    const { data: recentJobs, error: jobsError } = await supabaseClient
      .from('purge_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (jobsError) throw jobsError

    // Calculate data to be purged for each policy
    const purgeStatus = await Promise.all(
      policies.map(async (policy: RetentionPolicy) => {
        const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000)
        
        let query = supabaseClient
          .from(policy.tableName)
          .select('id', { count: 'exact', head: true })

        // Add appropriate date filter based on table
        if (policy.tableName === 'exports') {
          query = query.lt('expires_at', new Date().toISOString())
        } else if (policy.tableName === 'resumes' || policy.tableName === 'cover_letters') {
          query = query.lt('updated_at', cutoffDate.toISOString())
        } else {
          query = query.lt('created_at', cutoffDate.toISOString())
        }

        // For soft delete tables, only count non-deleted records
        if (policy.softDelete) {
          query = query.is('deleted_at', null)
        }

        const { count, error } = await query

        return {
          tableName: policy.tableName,
          retentionDays: policy.retentionDays,
          recordsToProcess: count || 0,
          cutoffDate: cutoffDate.toISOString(),
          softDelete: policy.softDelete,
          archiveBeforeDelete: policy.archiveBeforeDelete
        }
      })
    )

    return new Response(
      JSON.stringify({
        policies,
        recentJobs,
        purgeStatus,
        nextScheduledRun: getNextScheduledRun(),
        totalRecordsToProcess: purgeStatus.reduce((sum, status) => sum + status.recordsToProcess, 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Failed to get purge status:', error)
    throw error
  }
}

async function runPurgeJob(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  const { tableNames, dryRun = false } = await req.json()

  console.log(`Starting purge job for tables: ${tableNames?.join(', ') || 'all'}`)

  try {
    // Get active retention policies
    let policiesQuery = supabaseClient
      .from('data_retention_policies')
      .select('*')
      .eq('is_active', true)

    if (tableNames && tableNames.length > 0) {
      policiesQuery = policiesQuery.in('table_name', tableNames)
    }

    const { data: policies, error: policiesError } = await policiesQuery
    if (policiesError) throw policiesError

    const results: PurgeJobResult[] = []

    for (const policy of policies) {
      const jobResult = await executePurgeForTable(policy, supabaseClient, dryRun)
      results.push(jobResult)
    }

    // Log admin action
    await logAdminAction(supabaseClient, {
      action: dryRun ? 'purge_dry_run' : 'purge_executed',
      targetType: 'system',
      targetId: 'data_purge',
      changeData: {
        tables: tableNames || 'all',
        results: results.map(r => ({
          table: r.jobId.split('-')[0],
          deleted: r.recordsDeleted,
          archived: r.recordsArchived
        }))
      }
    })

    return new Response(
      JSON.stringify({
        message: dryRun ? 'Dry run completed' : 'Purge job completed',
        dryRun,
        results,
        totalDeleted: results.reduce((sum, r) => sum + r.recordsDeleted, 0),
        totalArchived: results.reduce((sum, r) => sum + r.recordsArchived, 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Purge job failed:', error)
    throw error
  }
}

async function executePurgeForTable(
  policy: RetentionPolicy, 
  supabaseClient: any, 
  dryRun: boolean
): Promise<PurgeJobResult> {
  const jobId = `${policy.tableName}-${Date.now()}`
  const startTime = new Date()

  // Create purge job record
  const { data: job, error: jobError } = await supabaseClient
    .from('purge_jobs')
    .insert({
      id: jobId,
      job_type: 'data_retention',
      status: 'running',
      target_table: policy.tableName,
      started_at: startTime.toISOString()
    })
    .select()
    .single()

  if (jobError) {
    console.error(`Failed to create purge job for ${policy.tableName}:`, jobError)
    throw jobError
  }

  try {
    const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000)
    let recordsProcessed = 0
    let recordsDeleted = 0
    let recordsArchived = 0

    console.log(`Processing ${policy.tableName} with cutoff date: ${cutoffDate.toISOString()}`)

    // Get records to process
    let query = supabaseClient.from(policy.tableName).select('*')

    // Apply appropriate date filter
    if (policy.tableName === 'exports') {
      query = query.lt('expires_at', new Date().toISOString())
    } else if (['resumes', 'cover_letters'].includes(policy.tableName)) {
      query = query.lt('updated_at', cutoffDate.toISOString())
    } else {
      query = query.lt('created_at', cutoffDate.toISOString())
    }

    // For soft delete tables, only process non-deleted records
    if (policy.softDelete) {
      query = query.is('deleted_at', null)
    }

    const { data: recordsToProcess, error: selectError } = await query
    if (selectError) throw selectError

    recordsProcessed = recordsToProcess?.length || 0

    if (recordsProcessed === 0) {
      console.log(`No records to process for ${policy.tableName}`)
    } else {
      console.log(`Found ${recordsProcessed} records to process for ${policy.tableName}`)

      if (!dryRun) {
        // Archive before delete if required
        if (policy.archiveBeforeDelete && policy.archiveStorageBucket) {
          recordsArchived = await archiveRecords(
            recordsToProcess, 
            policy.tableName, 
            policy.archiveStorageBucket, 
            supabaseClient
          )
        }

        // Delete or soft delete records
        if (policy.softDelete) {
          // Soft delete
          const { error: softDeleteError } = await supabaseClient
            .from(policy.tableName)
            .update({ deleted_at: new Date().toISOString() })
            .in('id', recordsToProcess.map((r: any) => r.id))

          if (softDeleteError) throw softDeleteError
          recordsDeleted = recordsProcessed
        } else {
          // Hard delete
          if (policy.tableName === 'exports') {
            // Delete files from storage first
            for (const record of recordsToProcess) {
              try {
                await supabaseClient.storage
                  .from('resume-exports')
                  .remove([record.file_key])
              } catch (error) {
                console.error(`Failed to delete file ${record.file_key}:`, error)
              }
            }
          }

          const { error: deleteError } = await supabaseClient
            .from(policy.tableName)
            .delete()
            .in('id', recordsToProcess.map((r: any) => r.id))

          if (deleteError) throw deleteError
          recordsDeleted = recordsProcessed
        }
      }
    }

    // Update job status
    const completedAt = new Date()
    await supabaseClient
      .from('purge_jobs')
      .update({
        status: 'completed',
        records_processed: recordsProcessed,
        records_deleted: recordsDeleted,
        records_archived: recordsArchived,
        completed_at: completedAt.toISOString()
      })
      .eq('id', jobId)

    return {
      jobId,
      status: 'completed',
      recordsProcessed,
      recordsDeleted,
      recordsArchived,
      startedAt: startTime.toISOString(),
      completedAt: completedAt.toISOString()
    }

  } catch (error) {
    // Update job status to failed
    await supabaseClient
      .from('purge_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    throw error
  }
}

async function archiveRecords(
  records: any[], 
  tableName: string, 
  bucketName: string, 
  supabaseClient: any
): Promise<number> {
  let archivedCount = 0

  try {
    const archiveData = {
      tableName,
      archivedAt: new Date().toISOString(),
      records
    }

    const archiveKey = `archives/${tableName}/${new Date().toISOString().split('T')[0]}/${Date.now()}.json`
    
    const { error: uploadError } = await supabaseClient.storage
      .from(bucketName)
      .upload(archiveKey, JSON.stringify(archiveData, null, 2), {
        contentType: 'application/json',
        cacheControl: '31536000' // 1 year
      })

    if (uploadError) {
      console.error(`Failed to archive ${tableName}:`, uploadError)
    } else {
      archivedCount = records.length
      console.log(`Archived ${archivedCount} records from ${tableName} to ${archiveKey}`)
    }

  } catch (error) {
    console.error(`Archive failed for ${tableName}:`, error)
  }

  return archivedCount
}

async function forcePurge(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

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

  // Check if user is admin (you would implement admin role checking)
  const { data: userProfile, error: profileError } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !userProfile) {
    throw new Error('User profile not found')
  }

  // For now, allow any authenticated user to run purge
  // In production, you'd check for admin role
  
  const { tableName, recordIds, reason } = await req.json()

  if (!tableName || !recordIds || !Array.isArray(recordIds)) {
    throw new Error('Table name and record IDs are required')
  }

  console.log(`Force purge requested by ${user.id} for ${recordIds.length} records in ${tableName}`)

  try {
    // Get retention policy for table
    const { data: policy, error: policyError } = await supabaseClient
      .from('data_retention_policies')
      .select('*')
      .eq('table_name', tableName)
      .single()

    if (policyError) throw policyError

    let deletedCount = 0

    if (policy.softDelete) {
      // Soft delete
      const { error: softDeleteError } = await supabaseClient
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', recordIds)

      if (softDeleteError) throw softDeleteError
      deletedCount = recordIds.length
    } else {
      // Hard delete with file cleanup for exports
      if (tableName === 'exports') {
        const { data: exports, error: exportsError } = await supabaseClient
          .from('exports')
          .select('file_key')
          .in('id', recordIds)

        if (!exportsError && exports) {
          for (const exportRecord of exports) {
            try {
              await supabaseClient.storage
                .from('resume-exports')
                .remove([exportRecord.file_key])
            } catch (error) {
              console.error(`Failed to delete file ${exportRecord.file_key}:`, error)
            }
          }
        }
      }

      const { error: deleteError } = await supabaseClient
        .from(tableName)
        .delete()
        .in('id', recordIds)

      if (deleteError) throw deleteError
      deletedCount = recordIds.length
    }

    // Log admin action
    await logAdminAction(supabaseClient, {
      adminUserId: user.id,
      action: 'force_purge',
      targetType: tableName,
      targetId: recordIds.join(','),
      changeData: {
        reason,
        recordCount: deletedCount,
        softDelete: policy.softDelete
      },
      severity: 'warning'
    })

    return new Response(
      JSON.stringify({
        message: 'Force purge completed',
        tableName,
        recordsDeleted: deletedCount,
        softDelete: policy.softDelete,
        reason
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Force purge failed:', error)
    throw error
  }
}

async function scheduleAutomaticPurge(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  console.log('Running scheduled automatic purge...')

  try {
    // Run purge for all active policies
    const { data: policies, error: policiesError } = await supabaseClient
      .from('data_retention_policies')
      .select('*')
      .eq('is_active', true)

    if (policiesError) throw policiesError

    const results: PurgeJobResult[] = []

    for (const policy of policies) {
      try {
        const result = await executePurgeForTable(policy, supabaseClient, false)
        results.push(result)
      } catch (error) {
        console.error(`Purge failed for ${policy.table_name}:`, error)
        results.push({
          jobId: `${policy.table_name}-${Date.now()}`,
          status: 'failed',
          recordsProcessed: 0,
          recordsDeleted: 0,
          recordsArchived: 0,
          errorMessage: error.message
        })
      }
    }

    // Log system action
    await logAdminAction(supabaseClient, {
      action: 'scheduled_purge',
      targetType: 'system',
      targetId: 'automatic_cleanup',
      changeData: {
        tablesProcessed: policies.length,
        totalDeleted: results.reduce((sum, r) => sum + r.recordsDeleted, 0),
        totalArchived: results.reduce((sum, r) => sum + r.recordsArchived, 0),
        failures: results.filter(r => r.status === 'failed').length
      }
    })

    return new Response(
      JSON.stringify({
        message: 'Scheduled purge completed',
        results,
        summary: {
          tablesProcessed: policies.length,
          totalDeleted: results.reduce((sum, r) => sum + r.recordsDeleted, 0),
          totalArchived: results.reduce((sum, r) => sum + r.recordsArchived, 0),
          failures: results.filter(r => r.status === 'failed').length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Scheduled purge failed:', error)
    throw error
  }
}

async function logAdminAction(supabaseClient: any, action: {
  adminUserId?: string
  action: string
  targetType: string
  targetId: string
  changeData?: any
  severity?: string
}) {
  try {
    await supabaseClient
      .from('admin_logs')
      .insert({
        admin_user_id: action.adminUserId || null,
        action: action.action,
        target_type: action.targetType,
        target_id: action.targetId,
        change_data: action.changeData || {},
        severity: action.severity || 'info'
      })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

function getNextScheduledRun(): string {
  // Calculate next midnight UTC (daily purge schedule)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(2, 0, 0, 0) // 2 AM UTC
  
  return tomorrow.toISOString()
}