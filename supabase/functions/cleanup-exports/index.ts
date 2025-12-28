/**
 * Scheduled Export Cleanup Edge Function
 *
 * PURPOSE:
 * Automatically delete expired exports (24h TTL) and write comprehensive audit rows
 *
 * SCHEDULE:
 * Runs hourly via cron job (configure in Supabase Dashboard)
 *
 * PROCESS:
 * 1. Query exports older than 24 hours
 * 2. Delete files from storage bucket
 * 3. Delete database records
 * 4. Write detailed audit logs
 * 5. Generate metrics and purge execution log
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CleanupResult {
  success: boolean;
  jobId: string;
  scanned: number;
  deleted: number;
  failed: number;
  storageBytesFreed: number;
  errors: string[];
  durationMs: number;
}

/**
 * Main cleanup handler
 */
Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Only allow POST or scheduled invocation
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Verify authorization (cron or service role)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders,
      });
    }

    console.log('🧹 Starting scheduled export cleanup...');
    const startTime = Date.now();

    const result = await runCleanup();

    const durationMs = Date.now() - startTime;
    result.durationMs = durationMs;

    console.log(`✅ Cleanup completed in ${durationMs}ms`);
    console.log(`   Scanned: ${result.scanned}`);
    console.log(`   Deleted: ${result.deleted}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Storage freed: ${(result.storageBytesFreed / 1024 / 1024).toFixed(2)} MB`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

/**
 * Execute the cleanup process with full audit trail
 */
async function runCleanup(): Promise<CleanupResult> {
  const jobId = crypto.randomUUID();
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);

  const result: CleanupResult = {
    success: false,
    jobId,
    scanned: 0,
    deleted: 0,
    failed: 0,
    storageBytesFreed: 0,
    errors: [],
    durationMs: 0,
  };

  let logEntryId: string | null = null;

  try {
    // Start purge execution log
    const { data: logEntry, error: logError } = await supabase
      .from('purge_execution_logs')
      .insert({
        job_id: jobId,
        execution_type: 'scheduled',
        data_category: 'exports',
        table_name: 'exports',
        cutoff_date: cutoffDate.toISOString(),
        dry_run: false,
        status: 'running',
      })
      .select()
      .maybeSingle();

    if (logError) {
      console.error('Failed to create purge log:', logError);
      result.errors.push(`Log creation failed: ${logError.message}`);
    } else {
      logEntryId = logEntry?.id || null;
    }

    // Query expired exports from database
    const { data: expiredExports, error: queryError } = await supabase
      .from('exports')
      .select('id, user_id, file_path, file_size, format, created_at')
      .lt('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(1000); // Process in batches of 1000

    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`);
    }

    result.scanned = expiredExports?.length || 0;
    console.log(`   Found ${result.scanned} expired exports`);

    if (!expiredExports || expiredExports.length === 0) {
      result.success = true;
      await updatePurgeLog(logEntryId, result, 'completed');
      return result;
    }

    // Delete from storage and database with audit trail
    for (const exportRecord of expiredExports) {
      try {
        // Delete file from storage if exists
        if (exportRecord.file_path) {
          const { error: storageError } = await supabase.storage
            .from('resume-exports')
            .remove([exportRecord.file_path]);

          if (storageError) {
            console.warn(`Failed to delete storage file: ${storageError.message}`);
            result.errors.push(`Storage delete failed for ${exportRecord.id}: ${storageError.message}`);
            result.failed++;
          } else {
            result.storageBytesFreed += exportRecord.file_size || 0;
          }
        }

        // Delete database record
        const { error: dbError } = await supabase
          .from('exports')
          .delete()
          .eq('id', exportRecord.id);

        if (dbError) {
          console.warn(`Failed to delete export record: ${dbError.message}`);
          result.errors.push(`DB delete failed for ${exportRecord.id}: ${dbError.message}`);
          result.failed++;
        } else {
          result.deleted++;

          // Write comprehensive audit log
          await supabase.from('audit_logs').insert({
            user_id: exportRecord.user_id,
            action: 'export_purged',
            resource_type: 'export',
            resource_id: exportRecord.id,
            metadata: {
              job_id: jobId,
              format: exportRecord.format,
              file_size: exportRecord.file_size,
              file_path: exportRecord.file_path,
              created_at: exportRecord.created_at,
              purged_at: new Date().toISOString(),
              reason: 'retention_policy_24h',
              policy: 'exports_24h_ttl',
            },
          });
        }
      } catch (error: any) {
        console.error(`Error processing export ${exportRecord.id}:`, error);
        result.errors.push(`${exportRecord.id}: ${error.message}`);
        result.failed++;
      }
    }

    // Also clean up expired checkout sessions
    await cleanupExpiredSessions(jobId);

    // Clean up old parse reviews (7 days)
    await cleanupOldParseReviews(jobId);

    result.success = result.failed < result.scanned;

    // Update purge execution log with final results
    await updatePurgeLog(logEntryId, result, result.success ? 'completed' : 'failed');

    return result;
  } catch (error: any) {
    console.error('Cleanup error:', error);
    result.errors.push(error.message);
    await updatePurgeLog(logEntryId, result, 'failed');
    throw error;
  }
}

/**
 * Clean up expired checkout sessions
 */
async function cleanupExpiredSessions(jobId: string): Promise<void> {
  try {
    const { data: expiredSessions, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('id, user_id, status')
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'open');

    if (sessionError || !expiredSessions || expiredSessions.length === 0) {
      return;
    }

    const { error: updateError } = await supabase
      .from('checkout_sessions')
      .update({ status: 'expired' })
      .in('id', expiredSessions.map(s => s.id));

    if (!updateError) {
      console.log(`   Marked ${expiredSessions.length} checkout sessions as expired`);

      // Write audit logs
      for (const session of expiredSessions) {
        await supabase.from('audit_logs').insert({
          user_id: session.user_id,
          action: 'checkout_session_expired',
          resource_type: 'checkout_session',
          resource_id: session.id,
          metadata: {
            job_id: jobId,
            reason: 'session_ttl_expired',
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}

/**
 * Clean up old parse reviews (7 days retention)
 */
async function cleanupOldParseReviews(jobId: string): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: oldParseReviews, error: parseError } = await supabase
      .from('parse_reviews')
      .select('id, user_id, original_file_url')
      .lt('created_at', cutoffDate.toISOString())
      .limit(500);

    if (parseError || !oldParseReviews || oldParseReviews.length === 0) {
      return;
    }

    // Delete associated files first
    for (const review of oldParseReviews) {
      if (review.original_file_url) {
        try {
          const fileKey = review.original_file_url.split('/').pop();
          await supabase.storage
            .from('resume-uploads')
            .remove([`parse-reviews/${review.user_id}/${fileKey}`]);
        } catch (error) {
          console.error('Failed to delete parse review file:', error);
        }
      }
    }

    // Delete records
    const { error: deleteError } = await supabase
      .from('parse_reviews')
      .delete()
      .in('id', oldParseReviews.map(r => r.id));

    if (!deleteError) {
      console.log(`   Cleaned up ${oldParseReviews.length} old parse reviews`);

      // Write audit logs
      for (const review of oldParseReviews) {
        await supabase.from('audit_logs').insert({
          user_id: review.user_id,
          action: 'parse_review_purged',
          resource_type: 'parse_review',
          resource_id: review.id,
          metadata: {
            job_id: jobId,
            reason: 'retention_policy_7d',
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old parse reviews:', error);
  }
}

/**
 * Update purge execution log with results
 */
async function updatePurgeLog(
  logId: string | null,
  result: CleanupResult,
  status: string
): Promise<void> {
  if (!logId) return;

  try {
    await supabase
      .from('purge_execution_logs')
      .update({
        records_scanned: result.scanned,
        records_hard_deleted: result.deleted,
        storage_freed_bytes: result.storageBytesFreed,
        execution_duration_ms: result.durationMs,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
        completed_at: new Date().toISOString(),
        status,
        metadata: {
          job_id: result.jobId,
          errors: result.errors,
          failed_count: result.failed,
          success_rate: result.scanned > 0 ? (result.deleted / result.scanned * 100).toFixed(2) : 0,
        },
      })
      .eq('id', logId);
  } catch (error) {
    console.error('Failed to update purge log:', error);
  }
}
