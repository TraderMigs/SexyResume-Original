import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = Date.now();
    const checks: Record<string, any> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
    };

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          status: 'unhealthy',
          error: 'Missing Supabase configuration',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    checks.checks.database = await checkDatabase(supabase);
    checks.checks.storage = await checkStorage(supabase);
    checks.checks.environment = checkEnvironment();

    const duration = Date.now() - startTime;
    checks.response_time_ms = duration;

    const allHealthy = Object.values(checks.checks).every(
      (check: any) => check.status === 'healthy'
    );

    const statusCode = allHealthy ? 200 : 503;
    checks.status = allHealthy ? 'healthy' : 'degraded';

    return new Response(JSON.stringify(checks, null, 2), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Health check error:', error);

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function checkDatabase(supabase: any): Promise<any> {
  try {
    const startTime = Date.now();

    const { error } = await supabase
      .from('resumes')
      .select('id')
      .limit(1)
      .maybeSingle();

    const duration = Date.now() - startTime;

    if (error && error.code !== 'PGRST116') {
      return {
        status: 'unhealthy',
        error: error.message,
        response_time_ms: duration,
      };
    }

    return {
      status: 'healthy',
      response_time_ms: duration,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

async function checkStorage(supabase: any): Promise<any> {
  try {
    const startTime = Date.now();

    const { data, error } = await supabase.storage.listBuckets();

    const duration = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        response_time_ms: duration,
      };
    }

    const requiredBuckets = ['resumes', 'resume-exports'];
    const existingBuckets = data.map((b: any) => b.name);
    const missingBuckets = requiredBuckets.filter(
      (bucket) => !existingBuckets.includes(bucket)
    );

    if (missingBuckets.length > 0) {
      return {
        status: 'degraded',
        warning: `Missing buckets: ${missingBuckets.join(', ')}`,
        response_time_ms: duration,
      };
    }

    return {
      status: 'healthy',
      buckets: existingBuckets.length,
      response_time_ms: duration,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

function checkEnvironment(): any {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const optionalEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'SENTRY_DSN',
  ];

  const missing = requiredEnvVars.filter((varName) => !Deno.env.get(varName));
  const optional = optionalEnvVars.filter((varName) => !Deno.env.get(varName));

  if (missing.length > 0) {
    return {
      status: 'unhealthy',
      error: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }

  return {
    status: 'healthy',
    configured: requiredEnvVars.length + (optionalEnvVars.length - optional.length),
    optional_missing: optional.length > 0 ? optional : undefined,
  };
}
