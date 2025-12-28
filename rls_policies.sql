-- ============================================================================
-- RLS POLICIES INVENTORY
-- Generated: 2025-10-03
-- Description: Complete dump of all Row Level Security policies
-- ============================================================================

-- This file contains all RLS policies extracted from the database migrations
-- It serves as a reference for security auditing and compliance verification

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RESUMES TABLE POLICIES
-- ============================================================================

-- Enable RLS on resumes table
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Users can read their own resumes
CREATE POLICY "Users can read own resumes"
  ON public.resumes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own resumes
CREATE POLICY "Users can create own resumes"
  ON public.resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own resumes
CREATE POLICY "Users can update own resumes"
  ON public.resumes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
  ON public.resumes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXPORTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on exports table
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Users can read their own exports
CREATE POLICY "Users can read own exports"
  ON public.exports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own exports
CREATE POLICY "Users can create own exports"
  ON public.exports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COVER LETTERS TABLE POLICIES
-- ============================================================================

-- Enable RLS on cover_letters table
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

-- Users can read their own cover letters
CREATE POLICY "Users can read own cover letters"
  ON public.cover_letters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own cover letters
CREATE POLICY "Users can create own cover letters"
  ON public.cover_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cover letters
CREATE POLICY "Users can update own cover letters"
  ON public.cover_letters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cover letters
CREATE POLICY "Users can delete own cover letters"
  ON public.cover_letters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER ENTITLEMENTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on user_entitlements table
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can read their own entitlements
CREATE POLICY "Users can read own entitlements"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own entitlements
CREATE POLICY "Users can update own entitlements"
  ON public.user_entitlements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PAYMENT RECEIPTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on payment_receipts table
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Users can read their own payment receipts
CREATE POLICY "Users can read own payment receipts"
  ON public.payment_receipts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHECKOUT SESSIONS TABLE POLICIES
-- ============================================================================

-- Enable RLS on checkout_sessions table
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own checkout sessions
CREATE POLICY "Users can read own checkout sessions"
  ON public.checkout_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own checkout sessions
CREATE POLICY "Users can create own checkout sessions"
  ON public.checkout_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TELEMETRY TABLE POLICIES
-- ============================================================================

-- Enable RLS on telemetry table
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;

-- Users can read their own telemetry data
CREATE POLICY "Users can read own telemetry"
  ON public.telemetry
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own telemetry entries
CREATE POLICY "Users can create own telemetry"
  ON public.telemetry
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECURITY EVENTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on security_events table
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own security events
CREATE POLICY "Users can read own security events"
  ON public.security_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================================
-- ACHIEVEMENTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on user_achievements table
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can read their own achievements
CREATE POLICY "Users can read own achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXPORT ATTEMPTS TABLE POLICIES (Rate Limiting)
-- ============================================================================

-- Enable RLS on export_attempts table
ALTER TABLE public.export_attempts ENABLE ROW LEVEL SECURITY;

-- Users can read their own export attempts
CREATE POLICY "Users can read own export attempts"
  ON public.export_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- DATA RETENTION POLICIES TABLE POLICIES
-- ============================================================================

-- Enable RLS on data_retention_policies table
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Users can read retention policies
CREATE POLICY "Users can read retention policies"
  ON public.data_retention_policies
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- AUDIT LOGS TABLE POLICIES (Admin Only)
-- ============================================================================

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
-- No user-level policies - admin dashboard uses service role

-- ============================================================================
-- ANALYTICS TABLES POLICIES (Service Role Only)
-- ============================================================================

-- These tables are typically accessed via service role for aggregations
-- analytics_events, funnel_analytics, performance_metrics, saas_metrics

-- Enable RLS but restrict to service role
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

-- VERIFICATION QUERY:
-- Run this to verify all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- POLICY COUNT QUERY:
-- Run this to count policies per table:
-- SELECT schemaname, tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename
-- ORDER BY tablename;
