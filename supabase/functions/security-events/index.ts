import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { sentry, initSentry } from '../shared/sentry.ts';

initSentry();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface SecurityEvent {
  type: 'auth_failure' | 'auth_attempt' | 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_input' | 'file_upload_rejected' | 'admin_access_attempt';
  details: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    const event: SecurityEvent = await req.json();

    if (!event.type || !event.details) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error: insertError } = await supabase
      .from('security_events')
      .insert({
        event_type: event.type,
        details: event.details,
        user_id: event.userId || null,
        ip_address: event.ip || clientIP,
        user_agent: event.userAgent || req.headers.get('user-agent') || 'unknown',
        severity: event.severity || 'medium',
        timestamp: event.timestamp || new Date().toISOString()
      });

    if (insertError) {
      throw insertError;
    }

    if (event.severity === 'critical' || event.severity === 'high') {
      sentry.captureMessage(
        `Security Event: ${event.type}`,
        event.severity === 'critical' ? 'error' : 'warning',
        {
          function_name: 'security-events',
          event_type: event.type,
          details: event.details,
          user_id: event.userId,
          ip: clientIP
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    sentry.captureException(error as Error, {
      function_name: 'security-events',
      error_stage: 'event_logging'
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
