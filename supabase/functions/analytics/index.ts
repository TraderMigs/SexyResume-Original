import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
  session_id?: string
  user_id?: string
}

interface FunnelStep {
  funnel: string
  step: string
  user_id?: string
  properties?: Record<string, any>
  timestamp: number
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
      case 'track':
        return await trackEvent(req, supabaseClient)
      
      case 'funnel':
        return await trackFunnelStep(req, supabaseClient)
      
      case 'performance':
        return await trackPerformance(req, supabaseClient)
      
      case 'dashboard':
        return await getDashboardData(req, supabaseClient)
      
      default:
        throw new Error('Invalid endpoint')
    }

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function trackEvent(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  const { event, properties, timestamp, session_id }: AnalyticsEvent = await req.json()

  if (!event || !timestamp) {
    throw new Error('Event name and timestamp are required')
  }

  // Sanitize properties to remove PII
  const sanitizedProperties = sanitizeProperties(properties)

  // Store in analytics table
  const { error } = await supabaseClient
    .from('analytics_events')
    .insert({
      event_name: event,
      properties: sanitizedProperties,
      session_id,
      timestamp: new Date(timestamp).toISOString(),
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to store analytics event:', error)
    // Don't throw - analytics failures shouldn't break the app
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function trackFunnelStep(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  const { funnel, step, user_id, properties, timestamp }: FunnelStep = await req.json()

  if (!funnel || !step || !timestamp) {
    throw new Error('Funnel, step, and timestamp are required')
  }

  const sanitizedProperties = sanitizeProperties(properties || {})

  // Store funnel step
  const { error } = await supabaseClient
    .from('funnel_analytics')
    .insert({
      funnel_name: funnel,
      step_name: step,
      user_id,
      properties: sanitizedProperties,
      timestamp: new Date(timestamp).toISOString(),
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to store funnel step:', error)
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function trackPerformance(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    throw new Error('Method not allowed')
  }

  const { metric, value, unit, timestamp } = await req.json()

  if (!metric || value === undefined || !timestamp) {
    throw new Error('Metric, value, and timestamp are required')
  }

  // Store performance metric
  const { error } = await supabaseClient
    .from('performance_metrics')
    .insert({
      metric_name: metric,
      metric_value: value,
      unit,
      timestamp: new Date(timestamp).toISOString(),
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to store performance metric:', error)
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function getDashboardData(req: Request, supabaseClient: any) {
  if (req.method !== 'GET') {
    throw new Error('Method not allowed')
  }

  try {
    // Get conversion funnel data
    const { data: funnelData } = await supabaseClient
      .from('funnel_analytics')
      .select('funnel_name, step_name, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    // Get popular templates
    const { data: templateData } = await supabaseClient
      .from('analytics_events')
      .select('properties')
      .eq('event_name', 'template_selected')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    // Get export success rates
    const { data: exportData } = await supabaseClient
      .from('analytics_events')
      .select('event_name, properties')
      .in('event_name', ['export_started', 'export_completed', 'export_failed'])
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // Process and aggregate data
    const dashboard = {
      funnel: processFunnelData(funnelData || []),
      templates: processTemplateData(templateData || []),
      exports: processExportData(exportData || []),
      generatedAt: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(dashboard),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Dashboard data error:', error)
    throw error
  }
}

function sanitizeProperties(properties: Record<string, any>): Record<string, any> {
  const sanitized = { ...properties }
  
  // Remove PII fields
  const piiFields = [
    'email', 'phone', 'fullName', 'name', 'address', 'location',
    'personalInfo', 'userData', 'userEmail', 'userName'
  ]
  
  piiFields.forEach(field => {
    delete sanitized[field]
  })
  
  // Sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeProperties(sanitized[key])
    }
  })
  
  return sanitized
}

function processFunnelData(data: any[]): Record<string, any> {
  const funnels: Record<string, Record<string, number>> = {}
  
  data.forEach(item => {
    if (!funnels[item.funnel_name]) {
      funnels[item.funnel_name] = {}
    }
    funnels[item.funnel_name][item.step_name] = (funnels[item.funnel_name][item.step_name] || 0) + 1
  })
  
  return funnels
}

function processTemplateData(data: any[]): Record<string, number> {
  const templates: Record<string, number> = {}
  
  data.forEach(item => {
    const templateId = item.properties?.template_id
    if (templateId) {
      templates[templateId] = (templates[templateId] || 0) + 1
    }
  })
  
  return templates
}

function processExportData(data: any[]): { success_rate: number; formats: Record<string, number> } {
  const started = data.filter(item => item.event_name === 'export_started').length
  const completed = data.filter(item => item.event_name === 'export_completed').length
  const failed = data.filter(item => item.event_name === 'export_failed').length
  
  const formats: Record<string, number> = {}
  data.forEach(item => {
    const format = item.properties?.format
    if (format) {
      formats[format] = (formats[format] || 0) + 1
    }
  })
  
  return {
    success_rate: started > 0 ? (completed / started) * 100 : 0,
    formats
  }
}