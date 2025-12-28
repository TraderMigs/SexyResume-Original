-- Row Level Security Policies Dump
-- Generated: 2025-01-27T00:00:00Z
-- Database: SexyResume.com Production

-- ============================================================================
-- CORE USER MANAGEMENT TABLES
-- ============================================================================

-- Table: public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own resumes"
  ON public.resumes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes"
  ON public.resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON public.resumes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage resumes"
  ON public.resumes
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.exports
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own exports"
  ON public.exports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exports"
  ON public.exports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage exports"
  ON public.exports
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- PAYMENT AND ENTITLEMENT TABLES
-- ============================================================================

-- Table: public.user_entitlements
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own entitlements"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own entitlements"
  ON public.user_entitlements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage entitlements"
  ON public.user_entitlements
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.payment_receipts
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment receipts"
  ON public.payment_receipts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment receipts"
  ON public.payment_receipts
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.checkout_sessions
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own checkout sessions"
  ON public.checkout_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage checkout sessions"
  ON public.checkout_sessions
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- STRIPE INTEGRATION TABLES
-- ============================================================================

-- Table: stripe_customers
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Service role can manage stripe customers"
  ON stripe_customers
  FOR ALL
  TO service_role
  USING (true);

-- Table: stripe_subscriptions
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Service role can manage stripe subscriptions"
  ON stripe_subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- Table: stripe_orders
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Service role can manage stripe orders"
  ON stripe_orders
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- COVER LETTER SYSTEM
-- ============================================================================

-- Table: public.cover_letters
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cover letters"
  ON public.cover_letters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cover letters"
  ON public.cover_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letters"
  ON public.cover_letters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letters"
  ON public.cover_letters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage cover letters"
  ON public.cover_letters
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.cover_letter_drafts
ALTER TABLE public.cover_letter_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cover letter drafts"
  ON public.cover_letter_drafts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cover_letters 
      WHERE id = cover_letter_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own cover letter drafts"
  ON public.cover_letter_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cover_letters 
      WHERE id = cover_letter_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own cover letter drafts"
  ON public.cover_letter_drafts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cover_letters 
      WHERE id = cover_letter_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own cover letter drafts"
  ON public.cover_letter_drafts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cover_letters 
      WHERE id = cover_letter_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage cover letter drafts"
  ON public.cover_letter_drafts
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.cover_letter_telemetry
ALTER TABLE public.cover_letter_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own telemetry"
  ON public.cover_letter_telemetry
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own telemetry"
  ON public.cover_letter_telemetry
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage telemetry"
  ON public.cover_letter_telemetry
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- AI ENHANCEMENT SYSTEM
-- ============================================================================

-- Table: public.enhancement_requests
ALTER TABLE public.enhancement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enhancement requests"
  ON public.enhancement_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enhancement requests"
  ON public.enhancement_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enhancement requests"
  ON public.enhancement_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage enhancement requests"
  ON public.enhancement_requests
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.enhancement_suggestions
ALTER TABLE public.enhancement_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enhancement suggestions"
  ON public.enhancement_suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enhancement_requests 
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own enhancement suggestions"
  ON public.enhancement_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enhancement_requests 
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage enhancement suggestions"
  ON public.enhancement_suggestions
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.enhancement_history
ALTER TABLE public.enhancement_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enhancement history"
  ON public.enhancement_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enhancement history"
  ON public.enhancement_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage enhancement history"
  ON public.enhancement_history
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.enhancement_presets
ALTER TABLE public.enhancement_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read enhancement presets"
  ON public.enhancement_presets
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage enhancement presets"
  ON public.enhancement_presets
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- JOB MATCHING SYSTEM
-- ============================================================================

-- Table: public.job_roles
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job roles"
  ON public.job_roles
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage job roles"
  ON public.job_roles
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.industry_categories
ALTER TABLE public.industry_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read industry categories"
  ON public.industry_categories
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage industry categories"
  ON public.industry_categories
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.role_recommendations
ALTER TABLE public.role_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role recommendations"
  ON public.role_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own role recommendations"
  ON public.role_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role recommendations"
  ON public.role_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage role recommendations"
  ON public.role_recommendations
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.template_role_mappings
ALTER TABLE public.template_role_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read template role mappings"
  ON public.template_role_mappings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage template role mappings"
  ON public.template_role_mappings
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.skill_role_mappings
ALTER TABLE public.skill_role_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read skill role mappings"
  ON public.skill_role_mappings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage skill role mappings"
  ON public.skill_role_mappings
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- GROWTH AND MONETIZATION SYSTEM
-- ============================================================================

-- Table: public.referral_codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral codes"
  ON public.referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral codes"
  ON public.referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral codes"
  ON public.referral_codes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage referral codes"
  ON public.referral_codes
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.referral_conversions
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral conversions"
  ON public.referral_conversions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Service role can manage referral conversions"
  ON public.referral_conversions
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user achievements"
  ON public.user_achievements
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.achievement_definitions
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievement definitions"
  ON public.achievement_definitions
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Service role can manage achievement definitions"
  ON public.achievement_definitions
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit transactions"
  ON public.credit_transactions
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.upsell_campaigns
ALTER TABLE public.upsell_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage upsell campaigns"
  ON public.upsell_campaigns
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.user_campaign_interactions
ALTER TABLE public.user_campaign_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own campaign interactions"
  ON public.user_campaign_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage campaign interactions"
  ON public.user_campaign_interactions
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.experiment_variants
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage experiments"
  ON public.experiment_variants
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.user_experiment_assignments
ALTER TABLE public.user_experiment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own experiment assignments"
  ON public.user_experiment_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage experiment assignments"
  ON public.user_experiment_assignments
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- ANALYTICS AND OBSERVABILITY
-- ============================================================================

-- Table: public.analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage analytics events"
  ON public.analytics_events
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.funnel_analytics
ALTER TABLE public.funnel_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage funnel analytics"
  ON public.funnel_analytics
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.performance_metrics
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage performance metrics"
  ON public.performance_metrics
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage error logs"
  ON public.error_logs
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.user_events
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

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

-- Table: public.feature_adoption
ALTER TABLE public.feature_adoption ENABLE ROW LEVEL SECURITY;

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

-- Table: public.user_journeys
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- ADMIN AND AUDIT SYSTEM
-- ============================================================================

-- Table: public.admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage admin logs"
  ON public.admin_logs
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Admins can read admin logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

-- Table: public.audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage audit logs"
  ON public.audit_logs
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Admins can read all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

-- Table: public.data_retention_policies
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read retention policies"
  ON public.data_retention_policies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage retention policies"
  ON public.data_retention_policies
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.purge_jobs
ALTER TABLE public.purge_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage purge jobs"
  ON public.purge_jobs
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Admins can read purge jobs"
  ON public.purge_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

-- ============================================================================
-- DATA LIFECYCLE MANAGEMENT
-- ============================================================================

-- Table: public.data_lifecycle_policies
ALTER TABLE public.data_lifecycle_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lifecycle policies"
  ON public.data_lifecycle_policies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

CREATE POLICY "Auditors can read lifecycle policies"
  ON public.data_lifecycle_policies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'auditor') AND is_active = true
    )
  );

-- Table: public.purge_execution_logs
ALTER TABLE public.purge_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read purge logs"
  ON public.purge_execution_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'auditor') AND is_active = true
    )
  );

CREATE POLICY "Service role can manage purge logs"
  ON public.purge_execution_logs
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.archived_data
ALTER TABLE public.archived_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read archived data"
  ON public.archived_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'auditor') AND is_active = true
    )
  );

CREATE POLICY "Service role can manage archived data"
  ON public.archived_data
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.compliance_reports
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance reports"
  ON public.compliance_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND is_active = true
    )
  );

CREATE POLICY "Auditors can read compliance reports"
  ON public.compliance_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'auditor') AND is_active = true
    )
  );

-- Table: public.legal_holds
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage legal holds"
  ON public.legal_holds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Admins can read legal holds"
  ON public.legal_holds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'auditor') AND is_active = true
    )
  );

-- ============================================================================
-- ANALYTICS DASHBOARD TABLES
-- ============================================================================

-- Table: public.cohort_analysis
ALTER TABLE public.cohort_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read cohort analysis"
  ON public.cohort_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'auditor') AND is_active = true
    )
  );

CREATE POLICY "Service role can manage cohort analysis"
  ON public.cohort_analysis
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.dashboard_metrics
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Service role can manage dashboard metrics"
  ON public.dashboard_metrics
  FOR ALL
  TO service_role
  USING (true);

-- Table: public.anomaly_detections
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Service role can manage anomaly detections"
  ON public.anomaly_detections
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- MISSING TABLES (NEED TO BE CREATED)
-- ============================================================================

-- Note: The following tables are referenced in the codebase but missing from migrations:
-- - public.admin_users (referenced in admin policies)
-- - public.parse_reviews (referenced in parse-review endpoints)
-- - public.user_sessions (referenced in cleanup functions)

-- These tables need to be created with proper RLS policies