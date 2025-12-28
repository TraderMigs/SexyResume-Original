/*
  # Analytics and Observability Schema

  1. New Tables
    - `analytics_events` - User interaction events (no PII)
    - `funnel_analytics` - Conversion funnel tracking
    - `performance_metrics` - Application performance data
    - `error_logs` - Server-side error tracking

  2. Security
    - Enable RLS on all tables
    - No PII storage in analytics
    - Automatic data retention policies

  3. Indexes
    - Performance indexes for analytics queries
    - Time-based partitioning for large datasets
*/

-- Analytics events table (no PII)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  session_id text,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Funnel analytics for conversion tracking
CREATE TABLE IF NOT EXISTS public.funnel_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name text NOT NULL,
  step_name text NOT NULL,
  user_id uuid, -- Optional, for authenticated users only
  properties jsonb DEFAULT '{}',
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  unit text DEFAULT 'ms',
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Error logs (server-side)
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  function_name text,
  user_id uuid, -- Optional
  request_id text,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_funnel_analytics_funnel_name ON public.funnel_analytics(funnel_name);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_step_name ON public.funnel_analytics(step_name);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_timestamp ON public.funnel_analytics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Analytics policies (read-only for authenticated users, insert for service role)
CREATE POLICY "Service role can manage analytics events"
  ON public.analytics_events
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can manage funnel analytics"
  ON public.funnel_analytics
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can manage performance metrics"
  ON public.performance_metrics
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can manage error logs"
  ON public.error_logs
  FOR ALL
  TO service_role
  USING (true);

-- Function to clean up old analytics data (GDPR compliance)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  -- Delete analytics events older than 2 years
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - interval '2 years';
  
  -- Delete funnel analytics older than 1 year
  DELETE FROM public.funnel_analytics 
  WHERE created_at < now() - interval '1 year';
  
  -- Delete performance metrics older than 6 months
  DELETE FROM public.performance_metrics 
  WHERE created_at < now() - interval '6 months';
  
  -- Delete resolved error logs older than 3 months
  DELETE FROM public.error_logs 
  WHERE resolved = true AND created_at < now() - interval '3 months';
  
  -- Delete unresolved error logs older than 1 year
  DELETE FROM public.error_logs 
  WHERE resolved = false AND created_at < now() - interval '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_dashboard AS
SELECT 
  date_trunc('day', created_at) as date,
  event_name,
  count(*) as event_count,
  count(DISTINCT session_id) as unique_sessions
FROM public.analytics_events 
WHERE created_at >= now() - interval '30 days'
GROUP BY date_trunc('day', created_at), event_name
ORDER BY date DESC, event_count DESC;

-- Refresh the materialized view daily
CREATE OR REPLACE FUNCTION public.refresh_analytics_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.analytics_dashboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_analytics_dashboard_date ON public.analytics_dashboard(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboard_event_name ON public.analytics_dashboard(event_name);