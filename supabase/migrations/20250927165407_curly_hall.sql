/*
  # AI Resume Enhancement System

  1. New Tables
    - `enhancement_requests` - Track AI enhancement requests
    - `enhancement_suggestions` - Store individual text suggestions
    - `enhancement_history` - Version control for enhanced content
    - `enhancement_presets` - Predefined tone and style configurations

  2. Security
    - Enable RLS on all tables
    - Users can only access their own enhancement data
    - Track usage for billing/limits

  3. Features
    - Before/after diff tracking
    - Confidence scoring for suggestions
    - Revision history with undo capability
    - Usage analytics for improvement
*/

-- Enhancement requests table
CREATE TABLE IF NOT EXISTS public.enhancement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE,
  target_role text,
  target_industry text,
  tone_preset text NOT NULL CHECK (tone_preset IN ('executive', 'professional', 'creative', 'technical', 'entry_level')) DEFAULT 'professional',
  style_preferences jsonb DEFAULT '{}',
  original_content jsonb NOT NULL,
  enhanced_content jsonb,
  overall_confidence numeric(3,2) DEFAULT 0.0,
  processing_status text CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  processing_time_ms integer,
  token_usage integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Individual enhancement suggestions
CREATE TABLE IF NOT EXISTS public.enhancement_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.enhancement_requests(id) ON DELETE CASCADE,
  section_type text NOT NULL, -- 'summary', 'experience', 'achievement', etc.
  section_id text NOT NULL, -- ID within the resume section
  field_path text NOT NULL, -- JSON path to the specific field
  original_text text NOT NULL,
  suggested_text text NOT NULL,
  improvement_type text NOT NULL, -- 'clarity', 'tone', 'impact', 'grammar', 'conciseness'
  confidence numeric(3,2) NOT NULL DEFAULT 0.0,
  reasoning text, -- Why this change was suggested
  metrics jsonb DEFAULT '{}', -- Word count, readability scores, etc.
  user_action text CHECK (user_action IN ('pending', 'accepted', 'rejected', 'modified')) DEFAULT 'pending',
  user_modified_text text, -- If user modified the suggestion
  applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enhancement history for version control
CREATE TABLE IF NOT EXISTS public.enhancement_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.enhancement_requests(id) ON DELETE SET NULL,
  version_number integer NOT NULL DEFAULT 1,
  content_snapshot jsonb NOT NULL,
  enhancement_summary text,
  changes_applied integer DEFAULT 0,
  changes_rejected integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Predefined enhancement presets
CREATE TABLE IF NOT EXISTS public.enhancement_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  target_audience text NOT NULL,
  tone_characteristics jsonb NOT NULL,
  style_rules jsonb NOT NULL,
  example_transformations jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_user_id ON public.enhancement_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_resume_id ON public.enhancement_requests(resume_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_created_at ON public.enhancement_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhancement_requests_status ON public.enhancement_requests(processing_status);

CREATE INDEX IF NOT EXISTS idx_enhancement_suggestions_request_id ON public.enhancement_suggestions(request_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_suggestions_section_type ON public.enhancement_suggestions(section_type);
CREATE INDEX IF NOT EXISTS idx_enhancement_suggestions_user_action ON public.enhancement_suggestions(user_action);

CREATE INDEX IF NOT EXISTS idx_enhancement_history_user_id ON public.enhancement_history(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_history_resume_id ON public.enhancement_history(resume_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_history_created_at ON public.enhancement_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.enhancement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhancement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhancement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhancement_presets ENABLE ROW LEVEL SECURITY;

-- Enhancement requests policies
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

-- Enhancement suggestions policies
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

-- Enhancement history policies
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

-- Enhancement presets policies (read-only for users)
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

-- Insert default enhancement presets
INSERT INTO public.enhancement_presets (name, description, target_audience, tone_characteristics, style_rules) VALUES
(
  'executive',
  'Executive Leadership Style',
  'C-level executives, VPs, senior directors',
  '{"tone": "authoritative", "voice": "strategic", "focus": "leadership_impact", "formality": "high"}'::jsonb,
  '{"use_metrics": true, "emphasize_leadership": true, "strategic_language": true, "avoid_technical_jargon": true, "sentence_structure": "complex"}'::jsonb
),
(
  'professional',
  'Professional Business Style',
  'Mid-level professionals, managers, specialists',
  '{"tone": "confident", "voice": "professional", "focus": "achievements", "formality": "medium"}'::jsonb,
  '{"use_metrics": true, "emphasize_results": true, "clear_language": true, "moderate_jargon": true, "sentence_structure": "balanced"}'::jsonb
),
(
  'creative',
  'Creative Industry Style',
  'Designers, artists, creative professionals',
  '{"tone": "innovative", "voice": "expressive", "focus": "creativity", "formality": "low"}'::jsonb,
  '{"use_metrics": false, "emphasize_creativity": true, "descriptive_language": true, "industry_terms": true, "sentence_structure": "varied"}'::jsonb
),
(
  'technical',
  'Technical Professional Style',
  'Engineers, developers, technical specialists',
  '{"tone": "precise", "voice": "analytical", "focus": "technical_skills", "formality": "medium"}'::jsonb,
  '{"use_metrics": true, "emphasize_technical": true, "precise_language": true, "technical_jargon": true, "sentence_structure": "clear"}'::jsonb
),
(
  'entry_level',
  'Entry Level Professional Style',
  'Recent graduates, career changers, entry-level',
  '{"tone": "enthusiastic", "voice": "eager", "focus": "potential", "formality": "medium"}'::jsonb,
  '{"use_metrics": false, "emphasize_learning": true, "accessible_language": true, "minimal_jargon": true, "sentence_structure": "simple"}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Function to create enhancement history snapshot
CREATE OR REPLACE FUNCTION public.create_enhancement_snapshot(
  p_user_id uuid,
  p_resume_id uuid,
  p_request_id uuid,
  p_content jsonb,
  p_summary text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  snapshot_id uuid;
  version_num integer;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO version_num
  FROM public.enhancement_history
  WHERE resume_id = p_resume_id;

  -- Create snapshot
  INSERT INTO public.enhancement_history (
    user_id,
    resume_id,
    request_id,
    version_number,
    content_snapshot,
    enhancement_summary
  ) VALUES (
    p_user_id,
    p_resume_id,
    p_request_id,
    version_num,
    p_content,
    p_summary
  ) RETURNING id INTO snapshot_id;

  RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate enhancement metrics
CREATE OR REPLACE FUNCTION public.calculate_enhancement_metrics(
  p_original_text text,
  p_enhanced_text text
)
RETURNS jsonb AS $$
DECLARE
  original_words integer;
  enhanced_words integer;
  original_sentences integer;
  enhanced_sentences integer;
  metrics jsonb;
BEGIN
  -- Count words
  original_words := array_length(string_to_array(trim(p_original_text), ' '), 1);
  enhanced_words := array_length(string_to_array(trim(p_enhanced_text), ' '), 1);
  
  -- Count sentences (approximate)
  original_sentences := array_length(string_to_array(p_original_text, '.'), 1) - 1;
  enhanced_sentences := array_length(string_to_array(p_enhanced_text, '.'), 1) - 1;
  
  -- Build metrics object
  metrics := jsonb_build_object(
    'original_word_count', COALESCE(original_words, 0),
    'enhanced_word_count', COALESCE(enhanced_words, 0),
    'word_count_change', COALESCE(enhanced_words, 0) - COALESCE(original_words, 0),
    'original_sentence_count', GREATEST(original_sentences, 1),
    'enhanced_sentence_count', GREATEST(enhanced_sentences, 1),
    'avg_words_per_sentence_original', 
      CASE WHEN original_sentences > 0 THEN COALESCE(original_words, 0)::numeric / original_sentences 
           ELSE COALESCE(original_words, 0) END,
    'avg_words_per_sentence_enhanced', 
      CASE WHEN enhanced_sentences > 0 THEN COALESCE(enhanced_words, 0)::numeric / enhanced_sentences 
           ELSE COALESCE(enhanced_words, 0) END,
    'length_change_percent',
      CASE WHEN original_words > 0 THEN 
        ((COALESCE(enhanced_words, 0) - COALESCE(original_words, 0))::numeric / original_words * 100)
      ELSE 0 END
  );
  
  RETURN metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_enhancement_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to presets table
CREATE TRIGGER update_enhancement_presets_updated_at
  BEFORE UPDATE ON public.enhancement_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_enhancement_updated_at();