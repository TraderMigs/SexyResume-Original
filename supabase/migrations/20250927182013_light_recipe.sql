/*
  # Growth and Monetization System

  1. New Tables
    - `referral_codes` - User referral codes and tracking
    - `referral_conversions` - Track successful referrals and rewards
    - `user_achievements` - Gamification badges and milestones
    - `achievement_definitions` - Available achievements and criteria
    - `upsell_campaigns` - A/B test campaigns and messaging
    - `user_campaign_interactions` - Track campaign engagement
    - `credit_transactions` - Credit system for rewards and bonuses
    - `experiment_variants` - A/B testing framework

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Prevent gaming of referral system

  3. Features
    - Referral tracking with fraud prevention
    - Achievement system with progress tracking
    - Dynamic upsell campaigns with A/B testing
    - Credit system for rewards and bonuses
*/

-- Referral codes and tracking
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  max_uses integer DEFAULT 100,
  reward_type text NOT NULL CHECK (reward_type IN ('credits', 'discount', 'feature_unlock')) DEFAULT 'credits',
  reward_amount integer NOT NULL DEFAULT 1, -- Credits or discount percentage
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Referral conversions and rewards
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  conversion_type text NOT NULL CHECK (conversion_type IN ('signup', 'first_export', 'payment')) DEFAULT 'signup',
  referrer_reward_credits integer DEFAULT 0,
  referred_reward_credits integer DEFAULT 0,
  referrer_reward_applied boolean DEFAULT false,
  referred_reward_applied boolean DEFAULT false,
  fraud_check_status text CHECK (fraud_check_status IN ('pending', 'verified', 'flagged', 'rejected')) DEFAULT 'pending',
  fraud_check_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referrer_user_id, referred_user_id)
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('onboarding', 'creation', 'enhancement', 'export', 'social', 'milestone')),
  criteria jsonb NOT NULL, -- Conditions for earning achievement
  reward_credits integer DEFAULT 0,
  rarity text CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress_data jsonb DEFAULT '{}',
  credits_awarded integer DEFAULT 0,
  credits_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Credit transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'refund', 'expired')),
  amount integer NOT NULL, -- Positive for earned, negative for spent
  source text NOT NULL, -- 'referral', 'achievement', 'purchase', 'export', etc.
  source_id text, -- ID of the source (achievement_id, referral_id, etc.)
  description text NOT NULL,
  balance_after integer NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Upsell campaigns for A/B testing
CREATE TABLE IF NOT EXISTS public.upsell_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL UNIQUE,
  description text,
  trigger_conditions jsonb NOT NULL, -- When to show campaign
  variants jsonb NOT NULL, -- Different messages/offers to test
  target_audience jsonb DEFAULT '{}', -- User segmentation criteria
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  success_metric text NOT NULL, -- 'conversion', 'click_through', 'engagement'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User campaign interactions
CREATE TABLE IF NOT EXISTS public.user_campaign_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.upsell_campaigns(id) ON DELETE CASCADE,
  variant_id text NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('shown', 'clicked', 'dismissed', 'converted')),
  interaction_data jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id, variant_id, interaction_type)
);

-- Experiment variants for A/B testing
CREATE TABLE IF NOT EXISTS public.experiment_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name text NOT NULL,
  variant_name text NOT NULL,
  variant_config jsonb NOT NULL,
  traffic_allocation numeric(3,2) NOT NULL DEFAULT 0.5, -- 0.0 to 1.0
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(experiment_name, variant_name)
);

-- User experiment assignments
CREATE TABLE IF NOT EXISTS public.user_experiment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  experiment_name text NOT NULL,
  variant_name text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, experiment_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON public.referral_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer_user_id ON public.referral_conversions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referred_user_id ON public.referral_conversions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_created_at ON public.referral_conversions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_key ON public.user_achievements(achievement_key);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON public.user_achievements(earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_transaction_type ON public.credit_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_upsell_campaigns_is_active ON public.upsell_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_user_campaign_interactions_user_id ON public.user_campaign_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_campaign_interactions_campaign_id ON public.user_campaign_interactions(campaign_id);

CREATE INDEX IF NOT EXISTS idx_user_experiment_assignments_user_id ON public.user_experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiment_assignments_experiment_name ON public.user_experiment_assignments(experiment_name);

-- Enable Row Level Security
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_campaign_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiment_assignments ENABLE ROW LEVEL SECURITY;

-- Referral system policies
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

-- Referral conversions policies
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

-- Achievement definitions (public read)
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

-- User achievements policies
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

-- Credit transactions policies
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

-- Campaign policies (admin only for management)
CREATE POLICY "Service role can manage upsell campaigns"
  ON public.upsell_campaigns
  FOR ALL
  TO service_role
  USING (true);

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

-- Experiment policies
CREATE POLICY "Service role can manage experiments"
  ON public.experiment_variants
  FOR ALL
  TO service_role
  USING (true);

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

-- Insert default achievement definitions
INSERT INTO public.achievement_definitions (achievement_key, title, description, icon, category, criteria, reward_credits, rarity) VALUES
-- Onboarding Achievements
('first_signup', 'Welcome Aboard!', 'Created your SexyResume account', '🎉', 'onboarding', 
 '{"event": "user_registered"}'::jsonb, 1, 'common'),

('profile_complete', 'Profile Master', 'Completed your personal information', '👤', 'onboarding',
 '{"fields_completed": ["fullName", "email", "phone", "location", "summary"]}'::jsonb, 2, 'common'),

('first_upload', 'File Uploader', 'Uploaded your first resume for AI parsing', '📄', 'onboarding',
 '{"event": "parse_completed"}'::jsonb, 3, 'common'),

-- Creation Achievements
('first_resume', 'Resume Creator', 'Built your first complete resume', '📝', 'creation',
 '{"completion_percentage": 100}'::jsonb, 5, 'common'),

('template_explorer', 'Style Explorer', 'Tried 3 different templates', '🎨', 'creation',
 '{"templates_tried": 3}'::jsonb, 3, 'uncommon'),

('section_master', 'Section Master', 'Completed all resume sections', '✅', 'creation',
 '{"sections_completed": ["personalInfo", "experience", "education", "skills", "projects"]}'::jsonb, 4, 'uncommon'),

-- Enhancement Achievements
('first_polish', 'AI Assistant', 'Used AI to enhance your resume content', '✨', 'enhancement',
 '{"event": "ai_enhancement_completed"}'::jsonb, 3, 'common'),

('polish_master', 'Content Perfectionist', 'Enhanced 10 different sections with AI', '🔥', 'enhancement',
 '{"enhancements_count": 10}'::jsonb, 8, 'rare'),

-- Export Achievements
('first_export', 'Export Champion', 'Exported your first professional resume', '📤', 'export',
 '{"event": "export_completed"}'::jsonb, 5, 'common'),

('format_master', 'Format Expert', 'Exported in all available formats', '📋', 'export',
 '{"formats_used": ["pdf", "docx", "txt", "ats"]}'::jsonb, 10, 'rare'),

('export_streak', 'Export Streak', 'Exported 5 resumes in 7 days', '🔥', 'export',
 '{"exports_in_period": {"count": 5, "days": 7}}'::jsonb, 15, 'epic'),

-- Social Achievements
('first_referral', 'Referral Starter', 'Invited your first friend', '👥', 'social',
 '{"event": "referral_sent"}'::jsonb, 2, 'common'),

('referral_master', 'Referral Champion', 'Successfully referred 5 users', '🏆', 'social',
 '{"successful_referrals": 5}'::jsonb, 25, 'legendary'),

('cover_letter_pro', 'Cover Letter Pro', 'Generated your first AI cover letter', '💌', 'creation',
 '{"event": "cover_letter_generated"}'::jsonb, 4, 'uncommon'),

-- Milestone Achievements
('power_user', 'Power User', 'Used the platform for 30 days', '⚡', 'milestone',
 '{"days_active": 30}'::jsonb, 20, 'epic'),

('template_connoisseur', 'Template Connoisseur', 'Customized template colors and fonts', '🎭', 'creation',
 '{"customizations_made": 5}'::jsonb, 6, 'uncommon'),

('efficiency_expert', 'Efficiency Expert', 'Completed resume in under 15 minutes', '⏱️', 'milestone',
 '{"completion_time_minutes": 15}'::jsonb, 12, 'rare')

ON CONFLICT (achievement_key) DO NOTHING;

-- Insert default upsell campaigns
INSERT INTO public.upsell_campaigns (campaign_name, description, trigger_conditions, variants, target_audience, success_metric) VALUES
(
  'export_hover_discount',
  'Show discount when user hovers on export without payment',
  '{"trigger": "export_hover", "conditions": {"export_unlocked": false, "hover_duration_ms": 3000}}'::jsonb,
  '[
    {"id": "control", "message": "Unlock exports for $7", "discount": 0},
    {"id": "discount_20", "message": "Limited time: 20% off exports!", "discount": 20},
    {"id": "urgency", "message": "Only $5.60 today - 24hr special!", "discount": 20}
  ]'::jsonb,
  '{"signup_days_ago": {"min": 0, "max": 7}}'::jsonb,
  'conversion'
),
(
  'polish_upsell',
  'Suggest upgrade after multiple AI enhancements',
  '{"trigger": "ai_enhancement_count", "conditions": {"count": 3, "export_unlocked": false}}'::jsonb,
  '[
    {"id": "control", "message": "Unlock unlimited exports", "discount": 0},
    {"id": "value_prop", "message": "You love AI features - unlock everything!", "discount": 0},
    {"id": "social_proof", "message": "Join 1000+ users with unlimited access", "discount": 10}
  ]'::jsonb,
  '{"ai_enhancements_used": {"min": 2}}'::jsonb,
  'conversion'
),
(
  'template_exploration_upsell',
  'Encourage export after trying multiple templates',
  '{"trigger": "template_switches", "conditions": {"count": 3, "export_unlocked": false}}'::jsonb,
  '[
    {"id": "control", "message": "Ready to export your perfect resume?", "discount": 0},
    {"id": "template_focus", "message": "You found the perfect template - export now!", "discount": 0},
    {"id": "time_limited", "message": "Export now and save 15%", "discount": 15}
  ]'::jsonb,
  '{"templates_tried": {"min": 2}}'::jsonb,
  'conversion'
),
(
  'cover_letter_cross_sell',
  'Promote cover letter generation after resume export',
  '{"trigger": "first_export", "conditions": {"exports_count": 1}}'::jsonb,
  '[
    {"id": "control", "message": "Generate matching cover letters", "discount": 0},
    {"id": "bundle_value", "message": "Complete your application with AI cover letters", "discount": 0},
    {"id": "success_story", "message": "Users with cover letters get 40% more interviews", "discount": 0}
  ]'::jsonb,
  '{"exports_count": {"min": 1}, "cover_letters_count": {"max": 0}}'::jsonb,
  'engagement'
)
ON CONFLICT (campaign_name) DO NOTHING;

-- Insert A/B test experiments
INSERT INTO public.experiment_variants (experiment_name, variant_name, variant_config, traffic_allocation) VALUES
('pricing_page_cta', 'control', '{"button_text": "Get Started", "color": "#d946ef"}'::jsonb, 0.5),
('pricing_page_cta', 'urgency', '{"button_text": "Start Building Now", "color": "#dc2626"}'::jsonb, 0.5),

('onboarding_flow', 'control', '{"steps": 4, "progress_bar": true}'::jsonb, 0.5),
('onboarding_flow', 'simplified', '{"steps": 3, "progress_bar": false}'::jsonb, 0.5),

('export_modal', 'control', '{"title": "Export Resume", "emphasis": "features"}'::jsonb, 0.5),
('export_modal', 'value_focused', '{"title": "Download Professional Resume", "emphasis": "value"}'::jsonb, 0.5)
ON CONFLICT (experiment_name, variant_name) DO NOTHING;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || p_user_id::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create referral code for user
CREATE OR REPLACE FUNCTION public.create_user_referral_code(p_user_id uuid)
RETURNS text AS $$
DECLARE
  new_code text;
BEGIN
  -- Check if user already has an active referral code
  SELECT code INTO new_code
  FROM public.referral_codes
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;
  
  IF new_code IS NOT NULL THEN
    RETURN new_code;
  END IF;
  
  -- Generate new code
  new_code := public.generate_referral_code(p_user_id);
  
  -- Insert new referral code
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (p_user_id, new_code);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral conversion
CREATE OR REPLACE FUNCTION public.process_referral_conversion(
  p_referred_user_id uuid,
  p_referral_code text,
  p_conversion_type text DEFAULT 'signup'
)
RETURNS jsonb AS $$
DECLARE
  referrer_id uuid;
  referrer_reward integer := 0;
  referred_reward integer := 0;
  conversion_record RECORD;
BEGIN
  -- Get referrer from code
  SELECT user_id INTO referrer_id
  FROM public.referral_codes
  WHERE code = p_referral_code AND is_active = true;
  
  IF referrer_id IS NULL THEN
    RETURN '{"error": "Invalid referral code"}'::jsonb;
  END IF;
  
  -- Prevent self-referral
  IF referrer_id = p_referred_user_id THEN
    RETURN '{"error": "Cannot refer yourself"}'::jsonb;
  END IF;
  
  -- Calculate rewards based on conversion type
  CASE p_conversion_type
    WHEN 'signup' THEN
      referrer_reward := 2;
      referred_reward := 1;
    WHEN 'first_export' THEN
      referrer_reward := 3;
      referred_reward := 0;
    WHEN 'payment' THEN
      referrer_reward := 10;
      referred_reward := 0;
  END CASE;
  
  -- Insert conversion record
  INSERT INTO public.referral_conversions (
    referrer_user_id,
    referred_user_id,
    referral_code,
    conversion_type,
    referrer_reward_credits,
    referred_reward_credits
  ) VALUES (
    referrer_id,
    p_referred_user_id,
    p_referral_code,
    p_conversion_type,
    referrer_reward,
    referred_reward
  )
  ON CONFLICT (referrer_user_id, referred_user_id) DO UPDATE SET
    conversion_type = EXCLUDED.conversion_type,
    referrer_reward_credits = EXCLUDED.referrer_reward_credits,
    updated_at = now()
  RETURNING * INTO conversion_record;
  
  -- Award credits to both users
  IF referrer_reward > 0 THEN
    PERFORM public.award_credits(referrer_id, referrer_reward, 'referral', conversion_record.id::text, 
      format('Referral reward for %s conversion', p_conversion_type));
  END IF;
  
  IF referred_reward > 0 THEN
    PERFORM public.award_credits(p_referred_user_id, referred_reward, 'referral', conversion_record.id::text,
      format('Welcome bonus for using referral code %s', p_referral_code));
  END IF;
  
  -- Update referral code usage
  UPDATE public.referral_codes
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE code = p_referral_code;
  
  RETURN jsonb_build_object(
    'success', true,
    'referrer_reward', referrer_reward,
    'referred_reward', referred_reward,
    'conversion_type', p_conversion_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award credits
CREATE OR REPLACE FUNCTION public.award_credits(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_id text DEFAULT NULL,
  p_description text DEFAULT 'Credits awarded'
)
RETURNS void AS $$
DECLARE
  current_balance integer := 0;
BEGIN
  -- Get current balance
  SELECT COALESCE(SUM(amount), 0) INTO current_balance
  FROM public.credit_transactions
  WHERE user_id = p_user_id;
  
  -- Insert credit transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    source,
    source_id,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    'earned',
    p_amount,
    p_source,
    p_source_id,
    p_description,
    current_balance + p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend credits
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_source_id text DEFAULT NULL,
  p_description text DEFAULT 'Credits spent'
)
RETURNS boolean AS $$
DECLARE
  current_balance integer := 0;
BEGIN
  -- Get current balance
  SELECT COALESCE(SUM(amount), 0) INTO current_balance
  FROM public.credit_transactions
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF current_balance < p_amount THEN
    RETURN false;
  END IF;
  
  -- Insert debit transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    source,
    source_id,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    'spent',
    -p_amount,
    p_source,
    p_source_id,
    p_description,
    current_balance - p_amount
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(
  p_user_id uuid,
  p_event_data jsonb DEFAULT '{}'
)
RETURNS jsonb AS $$
DECLARE
  achievement_record RECORD;
  user_stats jsonb;
  awarded_achievements text[] := '{}';
  total_credits_awarded integer := 0;
BEGIN
  -- Get user statistics for achievement checking
  SELECT jsonb_build_object(
    'resumes_count', (SELECT COUNT(*) FROM resumes WHERE user_id = p_user_id),
    'exports_count', (SELECT COUNT(*) FROM exports WHERE user_id = p_user_id),
    'templates_tried', (SELECT COUNT(DISTINCT template) FROM resumes WHERE user_id = p_user_id),
    'ai_enhancements_count', (SELECT COUNT(*) FROM enhancement_requests WHERE user_id = p_user_id AND processing_status = 'completed'),
    'cover_letters_count', (SELECT COUNT(*) FROM cover_letters WHERE user_id = p_user_id),
    'days_since_signup', (SELECT EXTRACT(EPOCH FROM (now() - created_at)) / 86400 FROM users WHERE id = p_user_id),
    'successful_referrals', (SELECT COUNT(*) FROM referral_conversions WHERE referrer_user_id = p_user_id AND conversion_type = 'payment')
  ) INTO user_stats;
  
  -- Merge with event data
  user_stats := user_stats || p_event_data;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT * FROM public.achievement_definitions 
    WHERE is_active = true
    AND achievement_key NOT IN (
      SELECT achievement_key FROM public.user_achievements WHERE user_id = p_user_id
    )
  LOOP
    -- Check if criteria are met (simplified logic)
    DECLARE
      criteria_met boolean := false;
    BEGIN
      -- Simple criteria checking (in production, implement more sophisticated logic)
      IF achievement_record.criteria ? 'event' THEN
        criteria_met := (user_stats ? (achievement_record.criteria->>'event'));
      ELSIF achievement_record.criteria ? 'resumes_count' THEN
        criteria_met := (user_stats->>'resumes_count')::integer >= (achievement_record.criteria->>'resumes_count')::integer;
      ELSIF achievement_record.criteria ? 'exports_count' THEN
        criteria_met := (user_stats->>'exports_count')::integer >= (achievement_record.criteria->>'exports_count')::integer;
      ELSIF achievement_record.criteria ? 'templates_tried' THEN
        criteria_met := (user_stats->>'templates_tried')::integer >= (achievement_record.criteria->>'templates_tried')::integer;
      ELSIF achievement_record.criteria ? 'completion_percentage' THEN
        criteria_met := (user_stats->>'completion_percentage')::integer >= (achievement_record.criteria->>'completion_percentage')::integer;
      ELSIF achievement_record.criteria ? 'successful_referrals' THEN
        criteria_met := (user_stats->>'successful_referrals')::integer >= (achievement_record.criteria->>'successful_referrals')::integer;
      ELSIF achievement_record.criteria ? 'days_active' THEN
        criteria_met := (user_stats->>'days_since_signup')::numeric >= (achievement_record.criteria->>'days_active')::integer;
      END IF;
      
      -- Award achievement if criteria met
      IF criteria_met THEN
        INSERT INTO public.user_achievements (
          user_id,
          achievement_key,
          credits_awarded
        ) VALUES (
          p_user_id,
          achievement_record.achievement_key,
          achievement_record.reward_credits
        );
        
        -- Award credits
        IF achievement_record.reward_credits > 0 THEN
          PERFORM public.award_credits(
            p_user_id,
            achievement_record.reward_credits,
            'achievement',
            achievement_record.achievement_key,
            format('Achievement unlocked: %s', achievement_record.title)
          );
        END IF;
        
        awarded_achievements := awarded_achievements || achievement_record.achievement_key;
        total_credits_awarded := total_credits_awarded + achievement_record.reward_credits;
      END IF;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'achievements_awarded', awarded_achievements,
    'total_credits_awarded', total_credits_awarded,
    'user_stats', user_stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current credit balance
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  balance integer := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO balance
  FROM public.credit_transactions
  WHERE user_id = p_user_id;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign user to experiment variant
CREATE OR REPLACE FUNCTION public.assign_experiment_variant(
  p_user_id uuid,
  p_experiment_name text
)
RETURNS text AS $$
DECLARE
  variant_record RECORD;
  random_value numeric;
  cumulative_allocation numeric := 0;
  assigned_variant text;
BEGIN
  -- Check if user already assigned
  SELECT variant_name INTO assigned_variant
  FROM public.user_experiment_assignments
  WHERE user_id = p_user_id AND experiment_name = p_experiment_name;
  
  IF assigned_variant IS NOT NULL THEN
    RETURN assigned_variant;
  END IF;
  
  -- Generate random value for assignment
  random_value := random();
  
  -- Find variant based on traffic allocation
  FOR variant_record IN
    SELECT variant_name, traffic_allocation
    FROM public.experiment_variants
    WHERE experiment_name = p_experiment_name AND is_active = true
    ORDER BY variant_name
  LOOP
    cumulative_allocation := cumulative_allocation + variant_record.traffic_allocation;
    
    IF random_value <= cumulative_allocation THEN
      assigned_variant := variant_record.variant_name;
      EXIT;
    END IF;
  END LOOP;
  
  -- Default to first variant if no assignment
  IF assigned_variant IS NULL THEN
    SELECT variant_name INTO assigned_variant
    FROM public.experiment_variants
    WHERE experiment_name = p_experiment_name AND is_active = true
    ORDER BY variant_name
    LIMIT 1;
  END IF;
  
  -- Store assignment
  INSERT INTO public.user_experiment_assignments (user_id, experiment_name, variant_name)
  VALUES (p_user_id, p_experiment_name, assigned_variant)
  ON CONFLICT (user_id, experiment_name) DO NOTHING;
  
  RETURN assigned_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger achievement check on user action
CREATE OR REPLACE FUNCTION public.trigger_achievement_check()
RETURNS trigger AS $$
BEGIN
  -- Trigger achievement check asynchronously
  PERFORM public.check_and_award_achievements(
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for achievement checking
CREATE TRIGGER check_achievements_on_resume_update
  AFTER INSERT OR UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_check();

CREATE TRIGGER check_achievements_on_export
  AFTER INSERT ON public.exports
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_check();

CREATE TRIGGER check_achievements_on_cover_letter
  AFTER INSERT ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.trigger_achievement_check();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_growth_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_growth_updated_at();

CREATE TRIGGER update_referral_conversions_updated_at
  BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW EXECUTE FUNCTION public.update_growth_updated_at();

CREATE TRIGGER update_upsell_campaigns_updated_at
  BEFORE UPDATE ON public.upsell_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_growth_updated_at();