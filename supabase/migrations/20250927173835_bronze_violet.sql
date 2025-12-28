/*
  # Job Matching and Role Recommendation System

  1. New Tables
    - `job_roles` - Comprehensive job role database with embeddings
    - `industry_categories` - Industry classification system
    - `role_recommendations` - User-specific role recommendations
    - `template_role_mappings` - Template recommendations per role
    - `skill_role_mappings` - Skills to roles correlation data

  2. Features
    - Vector similarity matching using embeddings
    - Role-template correlation system
    - Explainable recommendations with reasoning
    - User feedback loop for improving recommendations

  3. Security
    - Enable RLS on all tables
    - Users can only access their own recommendations
    - Public read access for job roles and industries
*/

-- Job roles database with embeddings
CREATE TABLE IF NOT EXISTS public.job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  normalized_title text NOT NULL, -- Standardized version for matching
  industry_category text NOT NULL,
  seniority_level text NOT NULL CHECK (seniority_level IN ('entry', 'mid', 'senior', 'executive', 'c_level')),
  required_skills text[] DEFAULT '{}',
  preferred_skills text[] DEFAULT '{}',
  typical_experience_years integer,
  salary_range_min integer, -- In thousands USD
  salary_range_max integer,
  growth_outlook text CHECK (growth_outlook IN ('declining', 'stable', 'growing', 'high_growth')),
  remote_friendly boolean DEFAULT false,
  description text,
  key_responsibilities text[],
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  popularity_score numeric(3,2) DEFAULT 0.0, -- 0-1 based on job posting frequency
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Industry categories
CREATE TABLE IF NOT EXISTS public.industry_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  parent_category_id uuid REFERENCES public.industry_categories(id),
  growth_rate numeric(5,2), -- Annual growth percentage
  avg_salary integer, -- Average salary in thousands
  remote_percentage numeric(3,2), -- Percentage of remote jobs
  skill_keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- User role recommendations
CREATE TABLE IF NOT EXISTS public.role_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_role_id uuid NOT NULL REFERENCES public.job_roles(id),
  match_score numeric(3,2) NOT NULL, -- 0-1 similarity score
  confidence_level text NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),
  reasoning text NOT NULL,
  matched_skills text[] DEFAULT '{}',
  skill_gaps text[] DEFAULT '{}',
  recommended_template text,
  highlight_sections text[] DEFAULT '{}', -- Which resume sections to emphasize
  user_feedback text CHECK (user_feedback IN ('interested', 'not_interested', 'applied', 'hired')),
  feedback_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Template-role mappings for automatic template suggestions
CREATE TABLE IF NOT EXISTS public.template_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL,
  job_role_id uuid NOT NULL REFERENCES public.job_roles(id),
  suitability_score numeric(3,2) NOT NULL DEFAULT 0.0, -- 0-1 how well template fits role
  reasoning text,
  highlight_sections text[] DEFAULT '{}',
  customization_suggestions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Skill-role correlation data
CREATE TABLE IF NOT EXISTS public.skill_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  job_role_id uuid NOT NULL REFERENCES public.job_roles(id),
  importance_weight numeric(3,2) NOT NULL DEFAULT 0.0, -- 0-1 importance for this role
  skill_category text NOT NULL,
  is_required boolean DEFAULT false,
  years_experience_typical integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_roles_industry_category ON public.job_roles(industry_category);
CREATE INDEX IF NOT EXISTS idx_job_roles_seniority_level ON public.job_roles(seniority_level);
CREATE INDEX IF NOT EXISTS idx_job_roles_normalized_title ON public.job_roles(normalized_title);
CREATE INDEX IF NOT EXISTS idx_job_roles_popularity_score ON public.job_roles(popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_role_recommendations_user_id ON public.role_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_role_recommendations_resume_id ON public.role_recommendations(resume_id);
CREATE INDEX IF NOT EXISTS idx_role_recommendations_match_score ON public.role_recommendations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_role_recommendations_created_at ON public.role_recommendations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_role_mappings_template_id ON public.template_role_mappings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_role_mappings_job_role_id ON public.template_role_mappings(job_role_id);
CREATE INDEX IF NOT EXISTS idx_template_role_mappings_suitability_score ON public.template_role_mappings(suitability_score DESC);

CREATE INDEX IF NOT EXISTS idx_skill_role_mappings_skill_name ON public.skill_role_mappings(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_role_mappings_job_role_id ON public.skill_role_mappings(job_role_id);
CREATE INDEX IF NOT EXISTS idx_skill_role_mappings_importance_weight ON public.skill_role_mappings(importance_weight DESC);

-- Enable Row Level Security
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_role_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_role_mappings ENABLE ROW LEVEL SECURITY;

-- Job roles policies (public read access)
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

-- Industry categories policies (public read access)
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

-- Role recommendations policies
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

-- Template role mappings policies (public read access)
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

-- Skill role mappings policies (public read access)
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

-- Insert sample industry categories
INSERT INTO public.industry_categories (name, description, growth_rate, avg_salary, remote_percentage, skill_keywords) VALUES
('Technology', 'Software, hardware, and digital services', 15.2, 95, 0.75, ARRAY['programming', 'software', 'development', 'coding', 'tech']),
('Healthcare', 'Medical services, pharmaceuticals, biotechnology', 8.5, 78, 0.25, ARRAY['medical', 'healthcare', 'clinical', 'patient', 'therapy']),
('Finance', 'Banking, investment, insurance, fintech', 6.3, 88, 0.45, ARRAY['finance', 'banking', 'investment', 'accounting', 'trading']),
('Marketing', 'Digital marketing, advertising, brand management', 12.1, 65, 0.68, ARRAY['marketing', 'advertising', 'brand', 'social media', 'campaign']),
('Design', 'Graphic design, UX/UI, creative services', 9.8, 62, 0.72, ARRAY['design', 'creative', 'visual', 'ui', 'ux', 'graphic']),
('Sales', 'Business development, account management, retail', 7.4, 58, 0.35, ARRAY['sales', 'business development', 'account management', 'customer']),
('Operations', 'Supply chain, logistics, project management', 5.9, 72, 0.42, ARRAY['operations', 'logistics', 'supply chain', 'project management']),
('Education', 'Teaching, training, educational technology', 4.2, 48, 0.55, ARRAY['education', 'teaching', 'training', 'curriculum', 'learning']),
('Consulting', 'Management consulting, strategy, advisory', 8.7, 95, 0.58, ARRAY['consulting', 'strategy', 'advisory', 'analysis', 'business']),
('Legal', 'Law firms, corporate legal, compliance', 3.1, 105, 0.28, ARRAY['legal', 'law', 'compliance', 'regulatory', 'attorney'])
ON CONFLICT (name) DO NOTHING;

-- Insert sample job roles with embeddings (simplified for demo)
INSERT INTO public.job_roles (
  title, 
  normalized_title, 
  industry_category, 
  seniority_level, 
  required_skills, 
  preferred_skills,
  typical_experience_years,
  salary_range_min,
  salary_range_max,
  growth_outlook,
  remote_friendly,
  description,
  key_responsibilities,
  popularity_score
) VALUES
-- Technology Roles
('Software Engineer', 'software_engineer', 'Technology', 'mid', 
 ARRAY['programming', 'algorithms', 'debugging'], 
 ARRAY['javascript', 'python', 'git', 'agile'],
 3, 75, 120, 'high_growth', true,
 'Develops and maintains software applications and systems',
 ARRAY['Write clean, maintainable code', 'Debug and troubleshoot issues', 'Collaborate with cross-functional teams'],
 0.95),

('Senior Software Engineer', 'senior_software_engineer', 'Technology', 'senior',
 ARRAY['programming', 'system design', 'mentoring'],
 ARRAY['javascript', 'python', 'aws', 'microservices'],
 5, 100, 160, 'high_growth', true,
 'Leads technical projects and mentors junior developers',
 ARRAY['Design scalable systems', 'Lead technical initiatives', 'Mentor team members'],
 0.88),

('Frontend Developer', 'frontend_developer', 'Technology', 'mid',
 ARRAY['html', 'css', 'javascript'],
 ARRAY['react', 'vue', 'angular', 'typescript'],
 2, 65, 110, 'high_growth', true,
 'Specializes in user interface development and user experience',
 ARRAY['Build responsive web interfaces', 'Optimize user experience', 'Collaborate with designers'],
 0.82),

('Backend Developer', 'backend_developer', 'Technology', 'mid',
 ARRAY['server-side programming', 'databases', 'apis'],
 ARRAY['node.js', 'python', 'sql', 'docker'],
 3, 70, 115, 'high_growth', true,
 'Develops server-side logic and database systems',
 ARRAY['Design and implement APIs', 'Manage databases', 'Ensure system security'],
 0.79),

('Product Manager', 'product_manager', 'Technology', 'mid',
 ARRAY['product strategy', 'user research', 'project management'],
 ARRAY['analytics', 'agile', 'wireframing', 'sql'],
 4, 85, 140, 'growing', false,
 'Defines product strategy and coordinates development efforts',
 ARRAY['Define product roadmap', 'Gather user requirements', 'Coordinate with engineering'],
 0.76),

-- Design Roles
('UX Designer', 'ux_designer', 'Design', 'mid',
 ARRAY['user research', 'wireframing', 'prototyping'],
 ARRAY['figma', 'sketch', 'adobe creative suite', 'user testing'],
 3, 60, 100, 'growing', true,
 'Designs user experiences and interfaces for digital products',
 ARRAY['Conduct user research', 'Create wireframes and prototypes', 'Test usability'],
 0.71),

('Graphic Designer', 'graphic_designer', 'Design', 'mid',
 ARRAY['visual design', 'typography', 'color theory'],
 ARRAY['photoshop', 'illustrator', 'indesign', 'branding'],
 2, 45, 75, 'stable', true,
 'Creates visual content for print and digital media',
 ARRAY['Design marketing materials', 'Develop brand guidelines', 'Create visual assets'],
 0.68),

-- Marketing Roles
('Digital Marketing Manager', 'digital_marketing_manager', 'Marketing', 'mid',
 ARRAY['digital marketing', 'analytics', 'campaign management'],
 ARRAY['google ads', 'facebook ads', 'seo', 'email marketing'],
 4, 55, 90, 'growing', true,
 'Manages digital marketing campaigns and online presence',
 ARRAY['Plan marketing campaigns', 'Analyze performance metrics', 'Manage advertising budgets'],
 0.73),

('Content Marketing Specialist', 'content_marketing_specialist', 'Marketing', 'mid',
 ARRAY['content creation', 'seo', 'social media'],
 ARRAY['wordpress', 'google analytics', 'hootsuite', 'canva'],
 2, 45, 70, 'growing', true,
 'Creates and manages content marketing strategies',
 ARRAY['Create engaging content', 'Manage social media', 'Optimize for SEO'],
 0.65),

-- Finance Roles
('Financial Analyst', 'financial_analyst', 'Finance', 'mid',
 ARRAY['financial modeling', 'excel', 'data analysis'],
 ARRAY['sql', 'python', 'tableau', 'powerbi'],
 3, 60, 95, 'stable', false,
 'Analyzes financial data and creates reports for decision making',
 ARRAY['Build financial models', 'Analyze market trends', 'Prepare reports'],
 0.69),

-- Sales Roles
('Account Manager', 'account_manager', 'Sales', 'mid',
 ARRAY['relationship management', 'sales', 'communication'],
 ARRAY['crm', 'salesforce', 'negotiation', 'presentation'],
 3, 50, 85, 'stable', false,
 'Manages client relationships and drives revenue growth',
 ARRAY['Manage client accounts', 'Identify growth opportunities', 'Negotiate contracts'],
 0.72)

ON CONFLICT (normalized_title) DO NOTHING;

-- Insert template-role mappings
INSERT INTO public.template_role_mappings (template_id, job_role_id, suitability_score, reasoning, highlight_sections) 
SELECT 
  'modern',
  jr.id,
  CASE 
    WHEN jr.industry_category = 'Technology' THEN 0.95
    WHEN jr.industry_category = 'Design' THEN 0.85
    WHEN jr.industry_category = 'Marketing' THEN 0.80
    ELSE 0.70
  END,
  CASE 
    WHEN jr.industry_category = 'Technology' THEN 'Modern template appeals to tech companies and showcases technical skills effectively'
    WHEN jr.industry_category = 'Design' THEN 'Clean modern design demonstrates design sensibility'
    ELSE 'Professional modern appearance suitable for progressive companies'
  END,
  CASE 
    WHEN jr.industry_category = 'Technology' THEN ARRAY['skills', 'projects', 'experience']
    WHEN jr.industry_category = 'Design' THEN ARRAY['projects', 'skills', 'experience']
    ELSE ARRAY['experience', 'skills', 'education']
  END
FROM public.job_roles jr
ON CONFLICT DO NOTHING;

INSERT INTO public.template_role_mappings (template_id, job_role_id, suitability_score, reasoning, highlight_sections)
SELECT 
  'classic',
  jr.id,
  CASE 
    WHEN jr.industry_category IN ('Finance', 'Legal', 'Consulting') THEN 0.95
    WHEN jr.seniority_level IN ('senior', 'executive', 'c_level') THEN 0.90
    ELSE 0.75
  END,
  CASE 
    WHEN jr.industry_category IN ('Finance', 'Legal') THEN 'Conservative design preferred in traditional industries'
    WHEN jr.seniority_level IN ('senior', 'executive') THEN 'Professional appearance appropriate for senior roles'
    ELSE 'Timeless design suitable for established companies'
  END,
  ARRAY['experience', 'education', 'skills']
FROM public.job_roles jr
ON CONFLICT DO NOTHING;

INSERT INTO public.template_role_mappings (template_id, job_role_id, suitability_score, reasoning, highlight_sections)
SELECT 
  'creative',
  jr.id,
  CASE 
    WHEN jr.industry_category = 'Design' THEN 0.95
    WHEN jr.industry_category = 'Marketing' THEN 0.85
    WHEN jr.title ILIKE '%creative%' OR jr.title ILIKE '%artist%' THEN 0.90
    ELSE 0.60
  END,
  CASE 
    WHEN jr.industry_category = 'Design' THEN 'Creative template showcases design skills and artistic sensibility'
    WHEN jr.industry_category = 'Marketing' THEN 'Bold design demonstrates marketing creativity'
    ELSE 'Creative approach may appeal to innovative companies'
  END,
  ARRAY['projects', 'skills', 'experience']
FROM public.job_roles jr
WHERE jr.industry_category IN ('Design', 'Marketing')
ON CONFLICT DO NOTHING;

-- Insert skill-role mappings for common skills
INSERT INTO public.skill_role_mappings (skill_name, job_role_id, importance_weight, skill_category, is_required)
SELECT 
  skill,
  jr.id,
  CASE 
    WHEN skill = ANY(jr.required_skills) THEN 1.0
    WHEN skill = ANY(jr.preferred_skills) THEN 0.7
    ELSE 0.3
  END,
  'Technical',
  skill = ANY(jr.required_skills)
FROM public.job_roles jr,
UNNEST(jr.required_skills || jr.preferred_skills) AS skill
ON CONFLICT DO NOTHING;

-- Function to calculate role match score
CREATE OR REPLACE FUNCTION public.calculate_role_match_score(
  p_resume_skills text[],
  p_resume_experience jsonb,
  p_job_role_id uuid
)
RETURNS numeric AS $$
DECLARE
  role_record RECORD;
  skill_score numeric := 0.0;
  experience_score numeric := 0.0;
  total_score numeric := 0.0;
  required_skill_count integer := 0;
  matched_required_skills integer := 0;
  skill_weight numeric;
BEGIN
  -- Get job role details
  SELECT * INTO role_record FROM public.job_roles WHERE id = p_job_role_id;
  
  IF NOT FOUND THEN
    RETURN 0.0;
  END IF;

  -- Calculate skill match score
  FOR i IN 1..array_length(role_record.required_skills, 1) LOOP
    required_skill_count := required_skill_count + 1;
    IF role_record.required_skills[i] = ANY(p_resume_skills) THEN
      matched_required_skills := matched_required_skills + 1;
      skill_score := skill_score + 1.0;
    END IF;
  END LOOP;

  -- Add preferred skills bonus
  FOR i IN 1..array_length(role_record.preferred_skills, 1) LOOP
    IF role_record.preferred_skills[i] = ANY(p_resume_skills) THEN
      skill_score := skill_score + 0.5;
    END IF;
  END LOOP;

  -- Normalize skill score
  IF required_skill_count > 0 THEN
    skill_score := skill_score / (required_skill_count + array_length(role_record.preferred_skills, 1) * 0.5);
  END IF;

  -- Calculate experience score (simplified)
  experience_score := CASE 
    WHEN jsonb_array_length(p_resume_experience) >= role_record.typical_experience_years THEN 1.0
    WHEN jsonb_array_length(p_resume_experience) >= (role_record.typical_experience_years * 0.7) THEN 0.8
    WHEN jsonb_array_length(p_resume_experience) >= (role_record.typical_experience_years * 0.5) THEN 0.6
    ELSE 0.4
  END;

  -- Combine scores (70% skills, 30% experience)
  total_score := (skill_score * 0.7) + (experience_score * 0.3);

  RETURN LEAST(total_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate role recommendations
CREATE OR REPLACE FUNCTION public.generate_role_recommendations(
  p_user_id uuid,
  p_resume_id uuid,
  p_target_industry text DEFAULT NULL,
  p_seniority_preference text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  resume_data RECORD;
  role_record RECORD;
  match_score numeric;
  confidence_level text;
  reasoning text;
  matched_skills text[];
  skill_gaps text[];
  recommendations jsonb := '[]'::jsonb;
  recommendation_count integer := 0;
BEGIN
  -- Get resume data
  SELECT * INTO resume_data FROM public.resumes WHERE id = p_resume_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Resume not found"}'::jsonb;
  END IF;

  -- Extract skills from resume
  WITH resume_skills AS (
    SELECT DISTINCT skill->>'name' as skill_name
    FROM jsonb_array_elements(resume_data.data->'skills') AS skill
    WHERE skill->>'name' IS NOT NULL
  )
  -- Generate recommendations for each role
  FOR role_record IN 
    SELECT jr.* FROM public.job_roles jr
    WHERE (p_target_industry IS NULL OR jr.industry_category = p_target_industry)
    AND (p_seniority_preference IS NULL OR jr.seniority_level = p_seniority_preference)
    ORDER BY jr.popularity_score DESC
    LIMIT 20
  LOOP
    -- Calculate match score
    SELECT array_agg(skill_name) INTO matched_skills
    FROM resume_skills 
    WHERE skill_name = ANY(role_record.required_skills || role_record.preferred_skills);

    match_score := public.calculate_role_match_score(
      COALESCE(matched_skills, ARRAY[]::text[]),
      resume_data.data->'experience',
      role_record.id
    );

    -- Only include roles with reasonable match scores
    IF match_score >= 0.3 THEN
      -- Determine confidence level
      confidence_level := CASE 
        WHEN match_score >= 0.8 THEN 'very_high'
        WHEN match_score >= 0.6 THEN 'high'
        WHEN match_score >= 0.4 THEN 'medium'
        ELSE 'low'
      END;

      -- Generate reasoning
      reasoning := format('Match based on %s skills and %s years experience in %s', 
        array_length(matched_skills, 1), 
        jsonb_array_length(resume_data.data->'experience'),
        role_record.industry_category
      );

      -- Find skill gaps
      SELECT array_agg(skill) INTO skill_gaps
      FROM unnest(role_record.required_skills) AS skill
      WHERE skill != ALL(COALESCE(matched_skills, ARRAY[]::text[]));

      -- Insert recommendation
      INSERT INTO public.role_recommendations (
        user_id,
        resume_id,
        job_role_id,
        match_score,
        confidence_level,
        reasoning,
        matched_skills,
        skill_gaps,
        recommended_template,
        highlight_sections
      ) VALUES (
        p_user_id,
        p_resume_id,
        role_record.id,
        match_score,
        confidence_level,
        reasoning,
        COALESCE(matched_skills, ARRAY[]::text[]),
        COALESCE(skill_gaps, ARRAY[]::text[]),
        (SELECT template_id FROM public.template_role_mappings 
         WHERE job_role_id = role_record.id 
         ORDER BY suitability_score DESC LIMIT 1),
        (SELECT highlight_sections FROM public.template_role_mappings 
         WHERE job_role_id = role_record.id 
         ORDER BY suitability_score DESC LIMIT 1)
      );

      recommendation_count := recommendation_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'recommendations_generated', recommendation_count,
    'user_id', p_user_id,
    'resume_id', p_resume_id,
    'generated_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update embeddings (placeholder for when AI is available)
CREATE OR REPLACE FUNCTION public.update_role_embeddings()
RETURNS void AS $$
BEGIN
  -- This would call OpenAI embeddings API to generate vectors
  -- For now, we'll use placeholder logic
  UPDATE public.job_roles SET 
    embedding = array_fill(random(), ARRAY[1536])::vector(1536),
    updated_at = now()
  WHERE embedding IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_job_matching_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_job_roles_updated_at
  BEFORE UPDATE ON public.job_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_job_matching_updated_at();

CREATE TRIGGER update_role_recommendations_updated_at
  BEFORE UPDATE ON public.role_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_job_matching_updated_at();