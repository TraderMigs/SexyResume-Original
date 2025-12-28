/*
  # Create Resume Exports Storage Bucket

  1. Storage Bucket
    - Creates `resume-exports` bucket for temporary file storage
    - Public access disabled (signed URLs only)
    - 24-hour automatic TTL via lifecycle rules

  2. Security
    - RLS enabled on storage.objects
    - Users can only access their own exports via signed URLs
    - Automatic cleanup prevents data accumulation

  3. Configuration
    - Max file size: 10MB
    - Allowed MIME types: PDF, DOCX, TXT
    - Files automatically expire after 24 hours
*/

-- Create the resume-exports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-exports',
  'resume-exports',
  false, -- Not publicly accessible, requires signed URLs
  10485760, -- 10MB max file size
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/html']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/html'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert exports into their own folder
CREATE POLICY "Users can upload exports to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resume-exports' AND
  (storage.foldername(name))[1] = 'exports' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can read their own exports (via signed URLs primarily)
CREATE POLICY "Users can read their own exports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resume-exports' AND
  (storage.foldername(name))[1] = 'exports' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow service role to manage all files (for cleanup)
CREATE POLICY "Service role can manage all exports"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'resume-exports');

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_created
  ON storage.objects(bucket_id, created_at)
  WHERE bucket_id = 'resume-exports';

-- Note: Automatic lifecycle rules would be configured via Supabase Dashboard:
-- Go to Storage → resume-exports → Settings → Lifecycle Rules
-- Set: Delete files older than 24 hours (1 day)
-- This is a platform-level feature and cannot be set via SQL migrations
