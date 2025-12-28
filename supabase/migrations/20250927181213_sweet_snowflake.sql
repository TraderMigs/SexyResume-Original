/*
  # Analytics Dashboard and Growth Insights System

  1. New Tables
    - `user_events` - Detailed user interaction tracking
    - `conversion_funnels` - Funnel step definitions and tracking
    - `cohort_analysis` - Pre-computed cohort data for performance
    - `feature_adoption` - Track feature usage and adoption rates
    - `dashboard_metrics` - Cached metric calculations
    - `anomaly_detections` - AI-detected anomalies and trends

  2. Views and Functions
    - Materialized views for performance on large datasets
    - Functions for SaaS metric calculations
    - Automated cohort analysis computation

  3. Security
    - Enable RLS on all tables
    - Admin-only access for internal analytics
    - User-specific analytics for personal dashboards
*/

-- User events table for detailed tracking
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  event_type text NOT NULL,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  page_url text,
  referrer text,
  user_agent text,
  ip_address inet,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Conversion funnel definitions and tracking
CREATE TABLE IF NOT EXISTS public.conversion_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name text NOT NULL UNIQUE,
  description text,
  steps jsonb NOT NULL, -- Array of step definitions
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cohort analysis data
CREATE TABLE IF NOT EXISTS public.cohort_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_period text NOT NULL, -- 'weekly', 'monthly'
  cohort_date date NOT NULL,
  period_number integer NOT NULL, -- 0, 1, 2, 3... (weeks/months since signup)
  user_count integer NOT NULL,
  retained_users integer NOT NULL,
  retention_rate numeric(5,2) NOT NULL,
  revenue_total integer DEFAULT 0,
  revenue_per_user numeric(10,2) DEFAULT 0,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(cohort_period, cohort_date, period_number)
);

-- Feature adoption tracking
CREATE TABLE IF NOT EXISTS public.feature_adoption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  first_used_at timestamptz NOT NULL,
  last_used_at timestamptz NOT NULL,
  usage_count integer DEFAULT 1,
  days_to_adoption integer, -- Days from signup to first use
  user_segment text, -- 'new', 'returning', 'power_user'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(feature_name, user_id)
);

-- Dashboard metrics cache
CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  time_period text NOT NULL, -- 'daily', 'weekly', 'monthly'
  date_value date NOT NULL,
  metadata jsonb DEFAULT '{}',
  computed_at timestamptz DEFAULT now(),
  UNIQUE(metric_name, time_period, date_value)
);

-- AI anomaly detection
CREATE TABLE IF NOT EXISTS public.anomaly_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  anomaly_type text NOT NULL CHECK (anomaly_type IN ('spike', 'drop', 'trend_change', 'outlier')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  current_value numeric NOT NULL,
  expected_value numeric NOT NULL,
  deviation_percentage numeric(5,2) NOT NULL,
  time_period text NOT NULL,
  date_detected date NOT NULL,
  is_resolved boolean DEFAULT false,
  resolution_notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- User journey tracking
CREATE TABLE IF NOT EXISTS public.user_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  journey_type text NOT NULL, -- 'onboarding', 'resume_creation', 'export_flow'
  current_step text NOT NULL,
  total_steps integer NOT NULL,
  step_data jsonb DEFAULT '{}',
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  abandoned_at timestamptz,
  time_to_complete_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_timestamp ON public.user_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON public.user_events(session_id);

CREATE INDEX IF NOT EXISTS idx_cohort_analysis_cohort_date ON public.cohort_analysis(cohort_date DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_analysis_period ON public.cohort_analysis(cohort_period, cohort_date);

CREATE INDEX IF NOT EXISTS idx_feature_adoption_feature_name ON public.feature_adoption(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_adoption_user_id ON public.feature_adoption(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_adoption_first_used_at ON public.feature_adoption(first_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_metric_name ON public.dashboard_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_date_value ON public.dashboard_metrics(date_value DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_time_period ON public.dashboard_metrics(time_period);

CREATE INDEX IF NOT EXISTS idx_anomaly_detections_metric_name ON public.anomaly_detections(metric_name);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_severity ON public.anomaly_detections(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_date_detected ON public.anomaly_detections(date_detected DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_is_resolved ON public.anomaly_detections(is_resolved);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON public.user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_journey_type ON public.user_journeys(journey_type);
CREATE INDEX IF NOT EXISTS idx_user_journeys_started_at ON public.user_journeys(started_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_adoption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- User events policies
CREATE POLICY "Users can read own events"
  ON public.user_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user events"
  ON public.user_events
  FOR ALL
  TO service_role
  USING (true);

-- Feature adoption policies
CREATE POLICY "Users can read own feature adoption"
  ON public.feature_adoption
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage feature adoption"
  ON public.feature_adoption
  FOR ALL
  TO service_role
  USING (true);

-- User journeys policies
CREATE POLICY "Users can read own journeys"
  ON public.user_journeys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user journeys"
  ON public.user_journeys
  FOR ALL
  TO service_role
  USING (true);

-- Admin-only policies for internal analytics
CREATE POLICY "Admins can read conversion funnels"
  ON public.conversion_funnels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

CREATE POLICY "Admins can read cohort analysis"
  ON public.cohort_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

CREATE POLICY "Admins can read dashboard metrics"
  ON public.dashboard_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

CREATE POLICY "Admins can read anomaly detections"
  ON public.anomaly_detections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

-- Insert default conversion funnels
INSERT INTO public.conversion_funnels (funnel_name, description, steps) VALUES
(
  'user_onboarding',
  'Complete user onboarding from signup to first export',
  '[
    {"step": "signup", "name": "Account Creation", "description": "User creates account"},
    {"step": "resume_upload", "name": "Resume Upload", "description": "User uploads existing resume or starts building"},
    {"step": "template_selection", "name": "Template Selection", "description": "User selects resume template"},
    {"step": "content_completion", "name": "Content Completion", "description": "User completes resume content"},
    {"step": "first_export", "name": "First Export", "description": "User exports their first resume"}
  ]'::jsonb
),
(
  'export_conversion',
  'From resume completion to paid export',
  '[
    {"step": "resume_complete", "name": "Resume Complete", "description": "User completes resume building"},
    {"step": "export_attempt", "name": "Export Attempt", "description": "User attempts to export"},
    {"step": "payment_page", "name": "Payment Page", "description": "User reaches payment page"},
    {"step": "payment_complete", "name": "Payment Complete", "description": "User completes payment"},
    {"step": "export_download", "name": "Export Download", "description": "User downloads exported resume"}
  ]'::jsonb
),
(
  'feature_adoption',
  'Adoption of advanced features',
  '[
    {"step": "basic_resume", "name": "Basic Resume", "description": "User creates basic resume"},
    {"step": "ai_enhancement", "name": "AI Enhancement", "description": "User tries AI content enhancement"},
    {"step": "cover_letter", "name": "Cover Letter", "description": "User generates cover letter"},
    {"step": "multiple_templates", "name": "Multiple Templates", "description": "User tries different templates"},
    {"step": "power_user", "name": "Power User", "description": "User becomes regular active user"}
  ]'::jsonb
)
ON CONFLICT (funnel_name) DO NOTHING;

-- Function to calculate SaaS metrics
CREATE OR REPLACE FUNCTION public.calculate_saas_metrics(
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb AS $$
DECLARE
  total_signups integer;
  activated_users integer;
  paying_users integer;
  churned_users integer;
  activation_rate numeric(5,2);
  conversion_rate numeric(5,2);
  churn_rate numeric(5,2);
  avg_time_to_value numeric(10,2);
  monthly_recurring_revenue integer;
  result jsonb;
BEGIN
  -- Total signups in period
  SELECT COUNT(*) INTO total_signups
  FROM public.users
  WHERE created_at::date BETWEEN p_start_date AND p_end_date;

  -- Activated users (completed first export)
  SELECT COUNT(DISTINCT ue.user_id) INTO activated_users
  FROM public.user_events ue
  JOIN public.users u ON ue.user_id = u.id
  WHERE ue.event_name = 'export_completed'
  AND u.created_at::date BETWEEN p_start_date AND p_end_date;

  -- Paying users
  SELECT COUNT(DISTINCT user_id) INTO paying_users
  FROM public.payment_receipts
  WHERE status = 'succeeded'
  AND created_at::date BETWEEN p_start_date AND p_end_date;

  -- Calculate rates
  activation_rate := CASE WHEN total_signups > 0 THEN (activated_users::numeric / total_signups * 100) ELSE 0 END;
  conversion_rate := CASE WHEN activated_users > 0 THEN (paying_users::numeric / activated_users * 100) ELSE 0 END;

  -- Average time to value (signup to first export)
  SELECT AVG(EXTRACT(EPOCH FROM (ue.timestamp - u.created_at)) / 3600) INTO avg_time_to_value
  FROM public.user_events ue
  JOIN public.users u ON ue.user_id = u.id
  WHERE ue.event_name = 'export_completed'
  AND u.created_at::date BETWEEN p_start_date AND p_end_date;

  -- Monthly recurring revenue (for subscription model, if applicable)
  SELECT COALESCE(SUM(amount), 0) INTO monthly_recurring_revenue
  FROM public.payment_receipts
  WHERE status = 'succeeded'
  AND created_at >= date_trunc('month', CURRENT_DATE);

  result := jsonb_build_object(
    'period_start', p_start_date,
    'period_end', p_end_date,
    'total_signups', total_signups,
    'activated_users', activated_users,
    'paying_users', paying_users,
    'activation_rate', activation_rate,
    'conversion_rate', conversion_rate,
    'avg_time_to_value_hours', COALESCE(avg_time_to_value, 0),
    'monthly_recurring_revenue', monthly_recurring_revenue,
    'computed_at', now()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compute cohort analysis
CREATE OR REPLACE FUNCTION public.compute_cohort_analysis(
  p_period text DEFAULT 'monthly'
)
RETURNS void AS $$
DECLARE
  cohort_record RECORD;
  period_record RECORD;
  retention_count integer;
  total_cohort_size integer;
BEGIN
  -- Clear existing data for recomputation
  DELETE FROM public.cohort_analysis WHERE cohort_period = p_period;

  -- Generate cohorts based on signup date
  FOR cohort_record IN
    SELECT 
      date_trunc(p_period, created_at)::date as cohort_date,
      COUNT(*) as cohort_size
    FROM public.users
    WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY date_trunc(p_period, created_at)::date
    ORDER BY cohort_date
  LOOP
    total_cohort_size := cohort_record.cohort_size;
    
    -- Calculate retention for each period after signup
    FOR period_num IN 0..11 LOOP
      DECLARE
        period_start date;
        period_end date;
      BEGIN
        IF p_period = 'weekly' THEN
          period_start := cohort_record.cohort_date + (period_num * INTERVAL '1 week');
          period_end := period_start + INTERVAL '1 week';
        ELSE
          period_start := cohort_record.cohort_date + (period_num * INTERVAL '1 month');
          period_end := period_start + INTERVAL '1 month';
        END IF;

        -- Count retained users (users who were active in this period)
        SELECT COUNT(DISTINCT ue.user_id) INTO retention_count
        FROM public.user_events ue
        JOIN public.users u ON ue.user_id = u.id
        WHERE date_trunc(p_period, u.created_at)::date = cohort_record.cohort_date
        AND ue.timestamp::date BETWEEN period_start AND period_end;

        -- Insert cohort data
        INSERT INTO public.cohort_analysis (
          cohort_period,
          cohort_date,
          period_number,
          user_count,
          retained_users,
          retention_rate
        ) VALUES (
          p_period,
          cohort_record.cohort_date,
          period_num,
          total_cohort_size,
          retention_count,
          CASE WHEN total_cohort_size > 0 THEN (retention_count::numeric / total_cohort_size * 100) ELSE 0 END
        );
      END;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect anomalies in metrics
CREATE OR REPLACE FUNCTION public.detect_metric_anomalies()
RETURNS void AS $$
DECLARE
  metric_record RECORD;
  current_value numeric;
  avg_value numeric;
  std_dev numeric;
  threshold numeric;
  deviation_pct numeric;
  anomaly_type text;
  severity text;
BEGIN
  -- Check key metrics for anomalies
  FOR metric_record IN
    SELECT DISTINCT metric_name FROM public.dashboard_metrics
    WHERE date_value >= CURRENT_DATE - INTERVAL '7 days'
  LOOP
    -- Get current value (latest)
    SELECT metric_value INTO current_value
    FROM public.dashboard_metrics
    WHERE metric_name = metric_record.metric_name
    AND time_period = 'daily'
    ORDER BY date_value DESC
    LIMIT 1;

    -- Calculate historical average and standard deviation
    SELECT 
      AVG(metric_value),
      STDDEV(metric_value)
    INTO avg_value, std_dev
    FROM public.dashboard_metrics
    WHERE metric_name = metric_record.metric_name
    AND time_period = 'daily'
    AND date_value BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - INTERVAL '1 day';

    -- Skip if insufficient data
    IF avg_value IS NULL OR std_dev IS NULL OR std_dev = 0 THEN
      CONTINUE;
    END IF;

    -- Calculate deviation
    deviation_pct := ABS((current_value - avg_value) / avg_value * 100);
    threshold := 2 * std_dev; -- 2 standard deviations

    -- Determine if anomalous
    IF ABS(current_value - avg_value) > threshold THEN
      -- Determine anomaly type
      IF current_value > avg_value + threshold THEN
        anomaly_type := 'spike';
      ELSE
        anomaly_type := 'drop';
      END IF;

      -- Determine severity
      IF deviation_pct > 50 THEN
        severity := 'critical';
      ELSIF deviation_pct > 30 THEN
        severity := 'high';
      ELSIF deviation_pct > 15 THEN
        severity := 'medium';
      ELSE
        severity := 'low';
      END IF;

      -- Insert anomaly detection
      INSERT INTO public.anomaly_detections (
        metric_name,
        anomaly_type,
        severity,
        description,
        current_value,
        expected_value,
        deviation_percentage,
        time_period,
        date_detected
      ) VALUES (
        metric_record.metric_name,
        anomaly_type,
        severity,
        format('%s detected in %s: current value %s vs expected %s (%.1f%% deviation)',
          anomaly_type, metric_record.metric_name, current_value, avg_value, deviation_pct),
        current_value,
        avg_value,
        deviation_pct,
        'daily',
        CURRENT_DATE
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update feature adoption
CREATE OR REPLACE FUNCTION public.update_feature_adoption(
  p_user_id uuid,
  p_feature_name text,
  p_timestamp timestamptz DEFAULT now()
)
RETURNS void AS $$
DECLARE
  user_signup_date timestamptz;
  days_to_adoption integer;
BEGIN
  -- Get user signup date
  SELECT created_at INTO user_signup_date
  FROM public.users
  WHERE id = p_user_id;

  -- Calculate days to adoption
  days_to_adoption := EXTRACT(EPOCH FROM (p_timestamp - user_signup_date)) / 86400;

  -- Upsert feature adoption record
  INSERT INTO public.feature_adoption (
    feature_name,
    user_id,
    first_used_at,
    last_used_at,
    usage_count,
    days_to_adoption
  ) VALUES (
    p_feature_name,
    p_user_id,
    p_timestamp,
    p_timestamp,
    1,
    days_to_adoption
  )
  ON CONFLICT (feature_name, user_id) DO UPDATE SET
    last_used_at = p_timestamp,
    usage_count = feature_adoption.usage_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_summary AS
SELECT 
  date_trunc('day', created_at) as date,
  COUNT(*) as daily_signups,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_signups,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_signups
FROM public.users
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON public.analytics_summary(date DESC);

-- Function to refresh analytics summary
CREATE OR REPLACE FUNCTION public.refresh_analytics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.analytics_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track user journey progress
CREATE OR REPLACE FUNCTION public.track_user_journey(
  p_user_id uuid,
  p_journey_type text,
  p_current_step text,
  p_step_data jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  journey_id uuid;
  total_steps integer;
BEGIN
  -- Get total steps for journey type
  SELECT jsonb_array_length(steps) INTO total_steps
  FROM public.conversion_funnels
  WHERE funnel_name = p_journey_type;

  -- Upsert journey record
  INSERT INTO public.user_journeys (
    user_id,
    journey_type,
    current_step,
    total_steps,
    step_data,
    started_at
  ) VALUES (
    p_user_id,
    p_journey_type,
    p_current_step,
    COALESCE(total_steps, 5),
    p_step_data,
    now()
  )
  ON CONFLICT (user_id, journey_type) DO UPDATE SET
    current_step = p_current_step,
    step_data = p_step_data,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;