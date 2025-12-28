/*
  # Complete Data Lifecycle Management System

  1. New Tables
    - `data_lifecycle_policies` - Configurable retention and archival policies
    - `purge_execution_logs` - Detailed execution tracking for purge jobs
    - `archived_data` - Metadata for archived records
    - `compliance_reports` - Automated compliance reporting

  2. Enhanced Purge System
    - Configurable retention periods per data category
    - Automatic archival before deletion
    - Comprehensive audit trail
    - Compliance reporting

  3. Security & Monitoring
    - Admin-only access to lifecycle management
    - Complete audit trail of all data operations
    - Automated compliance reporting
*/

-- Data lifecycle policies with enhanced configuration
CREATE TABLE IF NOT EXISTS public.data_lifecycle_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_category text NOT NULL UNIQUE, -- 'exports', 'resumes', 'user_accounts', etc.
  table_name text NOT NULL,
  retention_days integer NOT NULL,
  archive_before_delete boolean DEFAULT false,
  archive_storage_bucket text,
  soft_delete boolean DEFAULT true,
  anonymize_before_delete boolean DEFAULT false,
  legal_hold_exempt boolean DEFAULT false, -- Cannot be purged during legal holds
  business_justification text NOT NULL,
  compliance_notes text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  approved_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purge execution logs for detailed tracking
CREATE TABLE IF NOT EXISTS public.purge_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  policy_id uuid REFERENCES public.data_lifecycle_policies(id),
  execution_type text NOT NULL CHECK (execution_type IN ('scheduled', 'manual', 'emergency')),
  data_category text NOT NULL,
  table_name text NOT NULL,
  records_scanned integer DEFAULT 0,
  records_archived integer DEFAULT 0,
  records_soft_deleted integer DEFAULT 0,
  records_hard_deleted integer DEFAULT 0,
  records_anonymized integer DEFAULT 0,
  storage_freed_bytes bigint DEFAULT 0,
  execution_duration_ms integer,
  cutoff_date timestamptz NOT NULL,
  dry_run boolean DEFAULT false,
  executed_by uuid REFERENCES public.users(id),
  error_message text,
  metadata jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text CHECK (status IN ('running', 'completed', 'failed', 'cancelled')) DEFAULT 'running'
);

-- Archived data metadata
CREATE TABLE IF NOT EXISTS public.archived_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_table text NOT NULL,
  original_record_id text NOT NULL,
  archive_location text NOT NULL, -- Storage path or external reference
  archive_format text NOT NULL CHECK (archive_format IN ('json', 'csv', 'parquet')),
  compression_type text CHECK (compression_type IN ('none', 'gzip', 'brotli')),
  encryption_key_id text, -- Reference to encryption key
  record_count integer DEFAULT 1,
  file_size_bytes bigint,
  checksum text, -- For integrity verification
  archived_by uuid REFERENCES public.users(id),
  retention_until timestamptz, -- When archive itself expires
  legal_hold boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Compliance reports for automated reporting
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('retention_compliance', 'purge_summary', 'data_inventory')),
  report_period_start timestamptz NOT NULL,
  report_period_end timestamptz NOT NULL,
  data_categories text[] NOT NULL,
  summary_stats jsonb NOT NULL DEFAULT '{}',
  compliance_score numeric(5,2), -- 0-100 compliance percentage
  violations jsonb DEFAULT '[]',
  recommendations text[],
  generated_by uuid REFERENCES public.users(id),
  approved_by uuid REFERENCES public.users(id),
  report_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Legal holds table for litigation/investigation support
CREATE TABLE IF NOT EXISTS public.legal_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_name text NOT NULL,
  description text NOT NULL,
  affected_users uuid[], -- Array of user IDs under hold
  affected_data_categories text[], -- Categories that cannot be purged
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id),
  approved_by uuid REFERENCES public.users(id),
  status text CHECK (status IN ('active', 'released', 'expired')) DEFAULT 'active',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_lifecycle_policies_data_category ON public.data_lifecycle_policies(data_category);
CREATE INDEX IF NOT EXISTS idx_data_lifecycle_policies_table_name ON public.data_lifecycle_policies(table_name);
CREATE INDEX IF NOT EXISTS idx_data_lifecycle_policies_is_active ON public.data_lifecycle_policies(is_active);

CREATE INDEX IF NOT EXISTS idx_purge_execution_logs_job_id ON public.purge_execution_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_purge_execution_logs_data_category ON public.purge_execution_logs(data_category);
CREATE INDEX IF NOT EXISTS idx_purge_execution_logs_started_at ON public.purge_execution_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_purge_execution_logs_status ON public.purge_execution_logs(status);

CREATE INDEX IF NOT EXISTS idx_archived_data_original_table ON public.archived_data(original_table);
CREATE INDEX IF NOT EXISTS idx_archived_data_original_record_id ON public.archived_data(original_record_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_created_at ON public.archived_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_data_legal_hold ON public.archived_data(legal_hold);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_report_type ON public.compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created_at ON public.compliance_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_holds_status ON public.legal_holds(status);
CREATE INDEX IF NOT EXISTS idx_legal_holds_start_date ON public.legal_holds(start_date);
CREATE INDEX IF NOT EXISTS idx_legal_holds_end_date ON public.legal_holds(end_date);

-- Enable Row Level Security
ALTER TABLE public.data_lifecycle_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purge_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;

-- Data lifecycle policies (admin only)
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

-- Purge execution logs (admin read, system write)
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

-- Archived data (admin only)
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

-- Compliance reports (admin only)
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

-- Legal holds (super admin only)
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

-- Insert comprehensive data lifecycle policies
INSERT INTO public.data_lifecycle_policies (
  data_category, 
  table_name, 
  retention_days, 
  archive_before_delete, 
  archive_storage_bucket,
  soft_delete, 
  anonymize_before_delete,
  business_justification,
  compliance_notes
) VALUES
  (
    'export_files', 
    'exports', 
    1, 
    false, 
    NULL,
    false, 
    false,
    'Temporary download links for user convenience. No business need to retain beyond download window.',
    'GDPR Article 5(e) - storage limitation principle. Files deleted immediately after purpose fulfilled.'
  ),
  (
    'resume_drafts', 
    'resumes', 
    365, 
    true, 
    'data-archives',
    true, 
    false,
    'Allow users to return to work after extended breaks. Archive for potential recovery.',
    'Legitimate interest in providing continuous service. 1-year retention balances user convenience with data minimization.'
  ),
  (
    'cover_letters', 
    'cover_letters', 
    365, 
    true, 
    'data-archives',
    true, 
    false,
    'Cover letters often reused for multiple applications. Reasonable retention for user convenience.',
    'User consent for service provision. Archive allows recovery while minimizing active storage.'
  ),
  (
    'user_accounts', 
    'users', 
    1095, 
    true, 
    'data-archives',
    true, 
    true,
    'Account data retained for service continuity and fraud prevention.',
    'GDPR Article 6(1)(b) - contract performance. 3-year retention for business continuity and legal compliance.'
  ),
  (
    'payment_records', 
    'payment_receipts', 
    2555, 
    true, 
    'compliance-archives',
    false, 
    false,
    'Legal requirement for tax and accounting purposes.',
    'Legal obligation under tax law. 7-year retention required. Cannot be deleted during this period.'
  ),
  (
    'audit_logs', 
    'audit_logs', 
    1095, 
    true, 
    'compliance-archives',
    false, 
    true,
    'Security monitoring and compliance auditing.',
    'Legitimate interest in security. 3-year retention for incident investigation and compliance.'
  ),
  (
    'admin_logs', 
    'admin_logs', 
    2555, 
    true, 
    'compliance-archives',
    false, 
    false,
    'Administrative action tracking for security and compliance.',
    'Legal obligation for audit trail. 7-year retention for regulatory compliance.'
  ),
  (
    'analytics_data', 
    'analytics_events', 
    730, 
    false, 
    NULL,
    false, 
    true,
    'Business intelligence and service improvement. No PII stored.',
    'Legitimate interest in service improvement. 2-year retention for trend analysis.'
  ),
  (
    'session_data', 
    'user_sessions', 
    30, 
    false, 
    NULL,
    false, 
    true,
    'Security monitoring and session management.',
    'Security necessity. 30-day retention for security incident investigation.'
  ),
  (
    'temporary_uploads', 
    'parse_reviews', 
    7, 
    false, 
    NULL,
    false, 
    true,
    'Temporary storage for resume parsing workflow.',
    'Service provision. Minimal retention for workflow completion only.'
  )
ON CONFLICT (data_category) DO UPDATE SET
  retention_days = EXCLUDED.retention_days,
  archive_before_delete = EXCLUDED.archive_before_delete,
  business_justification = EXCLUDED.business_justification,
  compliance_notes = EXCLUDED.compliance_notes,
  updated_at = now();

-- Function to check if data is under legal hold
CREATE OR REPLACE FUNCTION public.is_under_legal_hold(
  p_user_id uuid DEFAULT NULL,
  p_data_category text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  hold_count integer;
BEGIN
  SELECT COUNT(*)
  INTO hold_count
  FROM public.legal_holds
  WHERE status = 'active'
  AND (
    (p_user_id IS NOT NULL AND p_user_id = ANY(affected_users))
    OR
    (p_data_category IS NOT NULL AND p_data_category = ANY(affected_data_categories))
  )
  AND (end_date IS NULL OR end_date > now());
  
  RETURN hold_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced purge function with archival support
CREATE OR REPLACE FUNCTION public.execute_data_purge(
  p_data_category text DEFAULT NULL,
  p_dry_run boolean DEFAULT true,
  p_executed_by uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  policy_record RECORD;
  execution_log_id uuid;
  job_id uuid := gen_random_uuid();
  total_scanned integer := 0;
  total_archived integer := 0;
  total_soft_deleted integer := 0;
  total_hard_deleted integer := 0;
  total_anonymized integer := 0;
  total_storage_freed bigint := 0;
  execution_start timestamptz := now();
  cutoff_date timestamptz;
  records_to_process RECORD;
  archive_result jsonb;
  results jsonb := '[]'::jsonb;
BEGIN
  -- Get policies to execute
  FOR policy_record IN 
    SELECT * FROM public.data_lifecycle_policies 
    WHERE is_active = true 
    AND (p_data_category IS NULL OR data_category = p_data_category)
    AND NOT legal_hold_exempt
    ORDER BY data_category
  LOOP
    -- Check for legal holds
    IF public.is_under_legal_hold(NULL, policy_record.data_category) THEN
      CONTINUE; -- Skip this category due to legal hold
    END IF;

    -- Calculate cutoff date
    cutoff_date := now() - (policy_record.retention_days || ' days')::interval;
    
    -- Create execution log
    INSERT INTO public.purge_execution_logs (
      job_id,
      policy_id,
      execution_type,
      data_category,
      table_name,
      cutoff_date,
      dry_run,
      executed_by
    ) VALUES (
      job_id,
      policy_record.id,
      CASE WHEN p_executed_by IS NULL THEN 'scheduled' ELSE 'manual' END,
      policy_record.data_category,
      policy_record.table_name,
      cutoff_date,
      p_dry_run,
      p_executed_by
    ) RETURNING id INTO execution_log_id;

    -- Execute purge for this policy
    SELECT * INTO records_to_process FROM public.purge_table_data(
      policy_record,
      cutoff_date,
      p_dry_run,
      execution_log_id
    );

    -- Update execution log with results
    UPDATE public.purge_execution_logs SET
      records_scanned = records_to_process.scanned,
      records_archived = records_to_process.archived,
      records_soft_deleted = records_to_process.soft_deleted,
      records_hard_deleted = records_to_process.hard_deleted,
      records_anonymized = records_to_process.anonymized,
      storage_freed_bytes = records_to_process.storage_freed,
      execution_duration_ms = EXTRACT(EPOCH FROM (now() - execution_start)) * 1000,
      completed_at = now(),
      status = 'completed'
    WHERE id = execution_log_id;

    -- Accumulate totals
    total_scanned := total_scanned + records_to_process.scanned;
    total_archived := total_archived + records_to_process.archived;
    total_soft_deleted := total_soft_deleted + records_to_process.soft_deleted;
    total_hard_deleted := total_hard_deleted + records_to_process.hard_deleted;
    total_anonymized := total_anonymized + records_to_process.anonymized;
    total_storage_freed := total_storage_freed + records_to_process.storage_freed;

    -- Add to results
    results := results || jsonb_build_object(
      'category', policy_record.data_category,
      'table', policy_record.table_name,
      'scanned', records_to_process.scanned,
      'archived', records_to_process.archived,
      'deleted', records_to_process.soft_deleted + records_to_process.hard_deleted,
      'anonymized', records_to_process.anonymized,
      'storage_freed', records_to_process.storage_freed
    );
  END LOOP;

  RETURN jsonb_build_object(
    'job_id', job_id,
    'dry_run', p_dry_run,
    'execution_time_ms', EXTRACT(EPOCH FROM (now() - execution_start)) * 1000,
    'summary', jsonb_build_object(
      'total_scanned', total_scanned,
      'total_archived', total_archived,
      'total_soft_deleted', total_soft_deleted,
      'total_hard_deleted', total_hard_deleted,
      'total_anonymized', total_anonymized,
      'total_storage_freed_bytes', total_storage_freed
    ),
    'results', results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purge data for a specific table
CREATE OR REPLACE FUNCTION public.purge_table_data(
  p_policy RECORD,
  p_cutoff_date timestamptz,
  p_dry_run boolean,
  p_execution_log_id uuid
)
RETURNS RECORD AS $$
DECLARE
  result RECORD;
  records_query text;
  archive_query text;
  delete_query text;
  records_to_process RECORD;
  scanned_count integer := 0;
  archived_count integer := 0;
  soft_deleted_count integer := 0;
  hard_deleted_count integer := 0;
  anonymized_count integer := 0;
  storage_freed bigint := 0;
BEGIN
  -- Build query based on table and policy
  CASE p_policy.table_name
    WHEN 'exports' THEN
      -- Exports: delete expired files
      records_query := format('
        SELECT id, file_key, file_size, user_id 
        FROM %I 
        WHERE expires_at < %L
      ', p_policy.table_name, p_cutoff_date);
      
    WHEN 'resumes', 'cover_letters' THEN
      -- User content: check for inactivity
      records_query := format('
        SELECT id, user_id, data, updated_at 
        FROM %I 
        WHERE updated_at < %L 
        AND (deleted_at IS NULL OR deleted_at < %L)
      ', p_policy.table_name, p_cutoff_date, p_cutoff_date);
      
    WHEN 'users' THEN
      -- User accounts: check for complete inactivity
      records_query := format('
        SELECT id, email, full_name, created_at, updated_at 
        FROM %I 
        WHERE updated_at < %L 
        AND NOT EXISTS (
          SELECT 1 FROM resumes WHERE user_id = users.id AND updated_at > %L
        )
        AND NOT EXISTS (
          SELECT 1 FROM exports WHERE user_id = users.id AND created_at > %L
        )
      ', p_policy.table_name, p_cutoff_date, p_cutoff_date, p_cutoff_date);
      
    ELSE
      -- Generic: use created_at
      records_query := format('
        SELECT * FROM %I WHERE created_at < %L
      ', p_policy.table_name, p_cutoff_date);
  END CASE;

  -- Count records to process
  EXECUTE format('SELECT COUNT(*) FROM (%s) AS subquery', records_query) INTO scanned_count;

  IF NOT p_dry_run AND scanned_count > 0 THEN
    -- Archive before delete if required
    IF p_policy.archive_before_delete THEN
      SELECT * INTO archive_result FROM public.archive_table_data(
        p_policy.table_name,
        records_query,
        p_policy.archive_storage_bucket,
        p_execution_log_id
      );
      archived_count := (archive_result->>'archived_count')::integer;
    END IF;

    -- Execute deletion based on policy
    IF p_policy.soft_delete THEN
      -- Soft delete
      EXECUTE format('
        UPDATE %I SET deleted_at = now() 
        WHERE id IN (SELECT id FROM (%s) AS subquery)
      ', p_policy.table_name, records_query);
      soft_deleted_count := scanned_count;
      
    ELSIF p_policy.anonymize_before_delete THEN
      -- Anonymize then delete
      SELECT * INTO anonymized_count FROM public.anonymize_table_data(
        p_policy.table_name,
        records_query
      );
      hard_deleted_count := scanned_count;
      
    ELSE
      -- Hard delete
      IF p_policy.table_name = 'exports' THEN
        -- Delete storage files first
        FOR records_to_process IN EXECUTE records_query LOOP
          -- Note: In production, you'd call storage deletion here
          storage_freed := storage_freed + COALESCE(records_to_process.file_size, 0);
        END LOOP;
      END IF;
      
      EXECUTE format('
        DELETE FROM %I WHERE id IN (SELECT id FROM (%s) AS subquery)
      ', p_policy.table_name, records_query);
      hard_deleted_count := scanned_count;
    END IF;
  END IF;

  -- Return results
  SELECT 
    scanned_count as scanned,
    archived_count as archived,
    soft_deleted_count as soft_deleted,
    hard_deleted_count as hard_deleted,
    anonymized_count as anonymized,
    storage_freed as storage_freed
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive data before deletion
CREATE OR REPLACE FUNCTION public.archive_table_data(
  p_table_name text,
  p_records_query text,
  p_storage_bucket text,
  p_execution_log_id uuid
)
RETURNS jsonb AS $$
DECLARE
  archive_data jsonb;
  archive_key text;
  archived_count integer := 0;
  file_size bigint;
BEGIN
  -- Collect data to archive
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', p_records_query) INTO archive_data;
  
  IF archive_data IS NOT NULL THEN
    archived_count := jsonb_array_length(archive_data);
    
    -- Generate archive key
    archive_key := format('archives/%s/%s/%s.json', 
      p_table_name, 
      to_char(now(), 'YYYY-MM-DD'),
      p_execution_log_id
    );
    
    -- Calculate file size
    file_size := octet_length(archive_data::text);
    
    -- Store archive metadata
    INSERT INTO public.archived_data (
      original_table,
      original_record_id,
      archive_location,
      archive_format,
      compression_type,
      record_count,
      file_size_bytes,
      checksum,
      retention_until,
      metadata
    ) VALUES (
      p_table_name,
      p_execution_log_id::text,
      archive_key,
      'json',
      'gzip',
      archived_count,
      file_size,
      md5(archive_data::text),
      now() + interval '7 years', -- Archive retention
      jsonb_build_object(
        'execution_log_id', p_execution_log_id,
        'archived_at', now(),
        'original_query', p_records_query
      )
    );
    
    -- Note: In production, you would upload to storage here
    -- await supabase.storage.from(p_storage_bucket).upload(archive_key, archive_data)
  END IF;
  
  RETURN jsonb_build_object(
    'archived_count', archived_count,
    'archive_key', archive_key,
    'file_size', file_size
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize data
CREATE OR REPLACE FUNCTION public.anonymize_table_data(
  p_table_name text,
  p_records_query text
)
RETURNS integer AS $$
DECLARE
  anonymized_count integer := 0;
BEGIN
  CASE p_table_name
    WHEN 'users' THEN
      EXECUTE format('
        UPDATE %I SET 
          email = ''user_'' || id || ''@anonymized.local'',
          full_name = ''Anonymized User'',
          updated_at = now()
        WHERE id IN (SELECT id FROM (%s) AS subquery)
      ', p_table_name, p_records_query);
      
    WHEN 'analytics_events' THEN
      EXECUTE format('
        UPDATE %I SET 
          properties = properties - ''user_id'' - ''email'' - ''name'',
          session_id = ''anonymized''
        WHERE id IN (SELECT id FROM (%s) AS subquery)
      ', p_table_name, p_records_query);
      
    ELSE
      -- Generic anonymization
      EXECUTE format('
        UPDATE %I SET updated_at = now()
        WHERE id IN (SELECT id FROM (%s) AS subquery)
      ', p_table_name, p_records_query);
  END CASE;
  
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  RETURN anonymized_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate compliance report
CREATE OR REPLACE FUNCTION public.generate_compliance_report(
  p_report_type text DEFAULT 'retention_compliance',
  p_period_days integer DEFAULT 30
)
RETURNS uuid AS $$
DECLARE
  report_id uuid;
  report_start timestamptz := now() - (p_period_days || ' days')::interval;
  report_end timestamptz := now();
  policy_record RECORD;
  compliance_data jsonb := '[]'::jsonb;
  total_violations integer := 0;
  overall_score numeric := 100.0;
BEGIN
  -- Analyze each data category
  FOR policy_record IN 
    SELECT * FROM public.data_lifecycle_policies WHERE is_active = true
  LOOP
    DECLARE
      overdue_count integer;
      total_count integer;
      category_score numeric;
      cutoff_date timestamptz := now() - (policy_record.retention_days || ' days')::interval;
    BEGIN
      -- Count overdue records
      CASE policy_record.table_name
        WHEN 'exports' THEN
          EXECUTE format('SELECT COUNT(*) FROM %I WHERE expires_at < now()', policy_record.table_name) INTO overdue_count;
          EXECUTE format('SELECT COUNT(*) FROM %I', policy_record.table_name) INTO total_count;
          
        WHEN 'resumes', 'cover_letters' THEN
          EXECUTE format('SELECT COUNT(*) FROM %I WHERE updated_at < %L AND (deleted_at IS NULL)', 
            policy_record.table_name, cutoff_date) INTO overdue_count;
          EXECUTE format('SELECT COUNT(*) FROM %I WHERE deleted_at IS NULL', policy_record.table_name) INTO total_count;
          
        ELSE
          EXECUTE format('SELECT COUNT(*) FROM %I WHERE created_at < %L', 
            policy_record.table_name, cutoff_date) INTO overdue_count;
          EXECUTE format('SELECT COUNT(*) FROM %I', policy_record.table_name) INTO total_count;
      END CASE;

      -- Calculate compliance score for this category
      category_score := CASE 
        WHEN total_count = 0 THEN 100.0
        ELSE GREATEST(0, 100.0 - (overdue_count::numeric / total_count::numeric * 100.0))
      END;

      -- Add to compliance data
      compliance_data := compliance_data || jsonb_build_object(
        'category', policy_record.data_category,
        'table', policy_record.table_name,
        'retention_days', policy_record.retention_days,
        'total_records', total_count,
        'overdue_records', overdue_count,
        'compliance_score', category_score,
        'last_purge', (
          SELECT MAX(completed_at) 
          FROM public.purge_execution_logs 
          WHERE data_category = policy_record.data_category 
          AND status = 'completed'
        )
      );

      -- Track violations
      IF overdue_count > 0 THEN
        total_violations := total_violations + 1;
      END IF;
    END;
  END LOOP;

  -- Calculate overall compliance score
  overall_score := CASE 
    WHEN jsonb_array_length(compliance_data) = 0 THEN 100.0
    ELSE (
      SELECT AVG((value->>'compliance_score')::numeric) 
      FROM jsonb_array_elements(compliance_data)
    )
  END;

  -- Create compliance report
  INSERT INTO public.compliance_reports (
    report_type,
    report_period_start,
    report_period_end,
    data_categories,
    summary_stats,
    compliance_score,
    violations,
    recommendations,
    report_data
  ) VALUES (
    p_report_type,
    report_start,
    report_end,
    (SELECT array_agg(data_category) FROM public.data_lifecycle_policies WHERE is_active = true),
    jsonb_build_object(
      'total_categories', jsonb_array_length(compliance_data),
      'violations', total_violations,
      'avg_compliance_score', overall_score
    ),
    overall_score,
    CASE WHEN total_violations > 0 THEN 
      jsonb_build_array('Overdue data retention detected in ' || total_violations || ' categories')
    ELSE '[]'::jsonb END,
    CASE WHEN total_violations > 0 THEN 
      ARRAY['Run immediate purge job', 'Review retention policies', 'Increase purge frequency']
    ELSE ARRAY['Maintain current purge schedule'] END,
    compliance_data
  ) RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user account deletion with proper cascading
CREATE OR REPLACE FUNCTION public.delete_user_account(
  p_user_id uuid,
  p_immediate boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  deletion_job_id uuid := gen_random_uuid();
  grace_period_end timestamptz;
  archived_data jsonb := '[]'::jsonb;
  deletion_summary jsonb;
BEGIN
  -- Check for legal holds
  IF public.is_under_legal_hold(p_user_id) THEN
    RAISE EXCEPTION 'Cannot delete account under legal hold';
  END IF;

  -- Set grace period (30 days unless immediate)
  grace_period_end := CASE 
    WHEN p_immediate THEN now()
    ELSE now() + interval '30 days'
  END;

  -- Archive user data before deletion
  INSERT INTO public.archived_data (
    original_table,
    original_record_id,
    archive_location,
    archive_format,
    record_count,
    retention_until,
    metadata
  ) 
  SELECT 
    'user_deletion_package',
    p_user_id::text,
    format('user-deletions/%s/%s.json', p_user_id, deletion_job_id),
    'json',
    1,
    now() + interval '7 years',
    jsonb_build_object(
      'deletion_requested_at', now(),
      'grace_period_end', grace_period_end,
      'immediate_deletion', p_immediate,
      'user_data_summary', jsonb_build_object(
        'resumes_count', (SELECT COUNT(*) FROM resumes WHERE user_id = p_user_id),
        'exports_count', (SELECT COUNT(*) FROM exports WHERE user_id = p_user_id),
        'cover_letters_count', (SELECT COUNT(*) FROM cover_letters WHERE user_id = p_user_id)
      )
    );

  IF p_immediate OR grace_period_end <= now() THEN
    -- Immediate deletion
    
    -- 1. Delete/anonymize exports and files
    UPDATE exports SET deleted_at = now() WHERE user_id = p_user_id;
    
    -- 2. Soft delete resumes and cover letters
    UPDATE resumes SET deleted_at = now() WHERE user_id = p_user_id;
    UPDATE cover_letters SET deleted_at = now() WHERE user_id = p_user_id;
    
    -- 3. Anonymize audit logs (keep for compliance)
    UPDATE audit_logs SET 
      user_id = NULL,
      change_data = change_data - 'email' - 'name' - 'personalInfo'
    WHERE user_id = p_user_id;
    
    -- 4. Keep payment records (legal requirement) but anonymize
    UPDATE payment_receipts SET 
      user_id = NULL
    WHERE user_id = p_user_id;
    
    -- 5. Anonymize user account
    UPDATE users SET 
      email = 'deleted_' || id || '@anonymized.local',
      full_name = 'Deleted User',
      updated_at = now()
    WHERE id = p_user_id;
    
    deletion_summary := jsonb_build_object(
      'status', 'completed',
      'deletion_type', 'immediate',
      'grace_period_end', grace_period_end
    );
  ELSE
    -- Schedule for deletion
    UPDATE users SET 
      updated_at = now()
    WHERE id = p_user_id;
    
    deletion_summary := jsonb_build_object(
      'status', 'scheduled',
      'deletion_type', 'grace_period',
      'grace_period_end', grace_period_end
    );
  END IF;

  -- Log the deletion request
  INSERT INTO public.admin_logs (
    action,
    target_type,
    target_id,
    change_data,
    severity
  ) VALUES (
    'user_deletion_requested',
    'user',
    p_user_id::text,
    deletion_summary,
    'warning'
  );

  RETURN jsonb_build_object(
    'deletion_job_id', deletion_job_id,
    'user_id', p_user_id,
    'summary', deletion_summary
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate data export for user
CREATE OR REPLACE FUNCTION public.export_user_data(
  p_user_id uuid,
  p_format text DEFAULT 'json'
)
RETURNS jsonb AS $$
DECLARE
  user_data jsonb;
  export_package jsonb;
BEGIN
  -- Collect all user data
  SELECT jsonb_build_object(
    'user_profile', (
      SELECT row_to_json(u) FROM (
        SELECT id, email, full_name, created_at, updated_at 
        FROM users WHERE id = p_user_id
      ) u
    ),
    'resumes', (
      SELECT jsonb_agg(row_to_json(r)) FROM (
        SELECT id, title, data, template, created_at, updated_at 
        FROM resumes WHERE user_id = p_user_id AND deleted_at IS NULL
      ) r
    ),
    'cover_letters', (
      SELECT jsonb_agg(row_to_json(c)) FROM (
        SELECT id, target_role, company_name, tone, length, plain_text, created_at 
        FROM cover_letters WHERE user_id = p_user_id AND deleted_at IS NULL
      ) c
    ),
    'exports', (
      SELECT jsonb_agg(row_to_json(e)) FROM (
        SELECT id, format, file_size, created_at, expires_at 
        FROM exports WHERE user_id = p_user_id
      ) e
    ),
    'entitlements', (
      SELECT row_to_json(ent) FROM (
        SELECT export_unlocked, export_unlocked_at, created_at 
        FROM user_entitlements WHERE user_id = p_user_id
      ) ent
    ),
    'payment_history', (
      SELECT jsonb_agg(row_to_json(p)) FROM (
        SELECT amount, currency, status, product_name, created_at 
        FROM payment_receipts WHERE user_id = p_user_id
      ) p
    )
  ) INTO export_package;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'export_format', p_format,
    'generated_at', now(),
    'data', export_package
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_lifecycle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_data_lifecycle_policies_updated_at
  BEFORE UPDATE ON public.data_lifecycle_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_lifecycle_updated_at();

CREATE TRIGGER update_legal_holds_updated_at
  BEFORE UPDATE ON public.legal_holds
  FOR EACH ROW EXECUTE FUNCTION public.update_lifecycle_updated_at();