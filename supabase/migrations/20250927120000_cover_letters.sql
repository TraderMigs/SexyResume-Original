/*
  # Cover Letter Generation System

  1. New Tables
    - `cover_letters` - Main cover letter storage
    - `cover_letter_drafts` - Draft versions with edit tracking
    - `cover_letter_telemetry` - Generation analytics (non-PII)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own cover letters
    - Telemetry is anonymized

  3. Indexes
    - Performance indexes on foreign keys and lookup fields
*/

-- Cover letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  target_role text NOT NULL,
  company_name text,
  job_description text,
  tone text NOT NULL CHECK (tone IN ('formal', 'neutral', 'friendly')) DEFAULT 'neutral',
  length text NOT NULL CHECK (length IN ('short', 'standard', 'detailed')) DEFAULT 'standard',
  keywords text[] DEFAULT '{}',
  match_resume_template boolean DEFAULT false,
  sections jsonb NOT NULL DEFAULT '[]',
  plain_text text NOT NULL DEFAULT '',
  html_content text NOT NULL DEFAULT '',
  word_count integer DEFAULT 0,
  generated_at timestamptz DEFAULT now(),
  last_edited_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cover letter drafts table for version control
CREATE TABLE IF NOT EXISTS public.cover_letter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_letter_id uuid NOT NULL REFERENCES public.cover_letters(id) ON DELETE CASCADE,
  sections jsonb NOT NULL DEFAULT '[]',
  plain_text text NOT NULL DEFAULT '',
  html_content text NOT NULL DEFAULT '',
  word_count integer DEFAULT 0,
  edit_count integer DEFAULT 0,
  last_saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Telemetry table (anonymized analytics)
CREATE TABLE IF NOT EXISTS public.cover_letter_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  success boolean NOT NULL,
  token_usage integer,
  generation_time_ms integer NOT NULL,
  tone text NOT NULL,
  length text NOT NULL,
  has_job_description boolean NOT NULL DEFAULT false,
  has_company_name boolean NOT NULL DEFAULT false,
  keyword_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_resume_id ON public.cover_letters(resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_updated_at ON public.cover_letters(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_cover_letter_id ON public.cover_letter_drafts(cover_letter_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_created_at ON public.cover_letter_drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letter_telemetry_user_id ON public.cover_letter_telemetry(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_telemetry_created_at ON public.cover_letter_telemetry(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letter_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letter_telemetry ENABLE ROW LEVEL SECURITY;

-- Cover letters policies
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

-- Cover letter drafts policies
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

-- Telemetry policies (users can only read their own)
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_cover_letter_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_edited_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_cover_letters_updated_at
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.update_cover_letter_updated_at();

-- Function to automatically create draft on cover letter creation
CREATE OR REPLACE FUNCTION public.create_initial_cover_letter_draft()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.cover_letter_drafts (
    cover_letter_id,
    sections,
    plain_text,
    html_content,
    word_count,
    edit_count
  ) VALUES (
    NEW.id,
    NEW.sections,
    NEW.plain_text,
    NEW.html_content,
    NEW.word_count,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create initial draft
CREATE TRIGGER create_cover_letter_draft
  AFTER INSERT ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.create_initial_cover_letter_draft();
