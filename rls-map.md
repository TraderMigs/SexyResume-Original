# RLS Policy Mapping

This document maps database tables to their Row Level Security policies and shows which endpoints interact with each table.

## Table → Policy → Endpoint Mapping

### Core User Management

#### `public.users`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own profile` (SELECT) → auth.uid() = id
- `Users can update own profile` (UPDATE) → auth.uid() = id
- `Service role can manage users` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/auth/me` - Read user profile
- `POST /functions/v1/auth/signup` - Create user (via trigger)
- `GET /functions/v1/admin/users` - Admin user management
- `GET /functions/v1/data-lifecycle/export` - GDPR data export
- `POST /functions/v1/data-lifecycle/delete-account` - GDPR account deletion

#### `public.resumes`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own resumes` (SELECT) → auth.uid() = user_id
- `Users can create own resumes` (INSERT) → auth.uid() = user_id
- `Users can update own resumes` (UPDATE) → auth.uid() = user_id
- `Users can delete own resumes` (DELETE) → auth.uid() = user_id
- `Service role can manage resumes` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/resumes` - List user resumes
- `POST /functions/v1/resumes` - Create resume
- `GET /functions/v1/resumes/{id}` - Get specific resume
- `PUT /functions/v1/resumes/{id}` - Update resume
- `DELETE /functions/v1/resumes/{id}` - Delete resume
- `POST /functions/v1/export-resume` - Export resume (ownership check)
- `POST /functions/v1/ai-enhance/request` - AI enhancement (ownership check)
- `POST /functions/v1/job-matching/recommendations` - Job matching (ownership check)

#### `public.exports`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own exports` (SELECT) → auth.uid() = user_id
- `Users can create own exports` (INSERT) → auth.uid() = user_id
- `Service role can manage exports` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/export-resume` - Create export
- `GET /functions/v1/exports/{id}` - Get export download URL
- `POST /functions/v1/cleanup-exports` - Admin cleanup (service role)

### Payment System

#### `public.user_entitlements`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own entitlements` (SELECT) → auth.uid() = user_id
- `Users can update own entitlements` (UPDATE) → auth.uid() = user_id
- `Service role can manage entitlements` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/payments/entitlement` - Check export unlock status
- `POST /functions/v1/stripe-webhook` - Update entitlements (service role)

#### `public.payment_receipts`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own payment receipts` (SELECT) → auth.uid() = user_id
- `Service role can manage payment receipts` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/stripe-webhook` - Create payment records
- `GET /functions/v1/admin/dashboard` - Admin revenue analytics

#### `public.checkout_sessions`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own checkout sessions` (SELECT) → auth.uid() = user_id
- `Service role can manage checkout sessions` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/stripe-checkout` - Create checkout session
- `POST /functions/v1/stripe-webhook` - Update session status

### Stripe Integration

#### `stripe_customers`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can view their own customer data` (SELECT) → user_id = auth.uid() AND deleted_at IS NULL
- `Service role can manage stripe customers` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/stripe-checkout` - Create/retrieve customer

#### `stripe_subscriptions`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can view their own subscription data` (SELECT) → Complex join via stripe_customers
- `Service role can manage stripe subscriptions` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/stripe-checkout` - Manage subscriptions
- `POST /functions/v1/stripe-webhook` - Update subscription status

#### `stripe_orders`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can view their own order data` (SELECT) → Complex join via stripe_customers
- `Service role can manage stripe orders` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/stripe-webhook` - Create order records

### Cover Letter System

#### `public.cover_letters`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own cover letters` (SELECT) → auth.uid() = user_id
- `Users can create own cover letters` (INSERT) → auth.uid() = user_id
- `Users can update own cover letters` (UPDATE) → auth.uid() = user_id
- `Users can delete own cover letters` (DELETE) → auth.uid() = user_id
- `Service role can manage cover letters` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/cover-letter` - List cover letters
- `POST /functions/v1/cover-letter/generate` - Generate cover letter
- `GET /functions/v1/cover-letter/{id}` - Get specific cover letter
- `PUT /functions/v1/cover-letter/{id}` - Update cover letter
- `DELETE /functions/v1/cover-letter/{id}` - Delete cover letter

#### `public.cover_letter_drafts`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own cover letter drafts` (SELECT) → Via cover_letters ownership
- `Users can create own cover letter drafts` (INSERT) → Via cover_letters ownership
- `Users can update own cover letter drafts` (UPDATE) → Via cover_letters ownership
- `Users can delete own cover letter drafts` (DELETE) → Via cover_letters ownership
- `Service role can manage cover letter drafts` (ALL) → service_role

**Endpoints**:
- `PUT /functions/v1/cover-letter/{id}` - Create draft versions

#### `public.cover_letter_telemetry`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own telemetry` (SELECT) → auth.uid() = user_id
- `Users can create own telemetry` (INSERT) → auth.uid() = user_id
- `Service role can manage telemetry` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/cover-letter/generate` - Record generation telemetry

### AI Enhancement System

#### `public.enhancement_requests`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own enhancement requests` (SELECT) → auth.uid() = user_id
- `Users can create own enhancement requests` (INSERT) → auth.uid() = user_id
- `Users can update own enhancement requests` (UPDATE) → auth.uid() = user_id
- `Service role can manage enhancement requests` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/ai-enhance/request` - Create enhancement request

#### `public.enhancement_suggestions`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own enhancement suggestions` (SELECT) → Via enhancement_requests ownership
- `Users can update own enhancement suggestions` (UPDATE) → Via enhancement_requests ownership
- `Service role can manage enhancement suggestions` (ALL) → service_role

**Endpoints**:
- `PUT /functions/v1/ai-enhance/suggestions/{id}` - Accept/reject suggestions

#### `public.enhancement_history`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own enhancement history` (SELECT) → auth.uid() = user_id
- `Users can create own enhancement history` (INSERT) → auth.uid() = user_id
- `Service role can manage enhancement history` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/ai-enhance/request` - Create history snapshots

#### `public.enhancement_presets`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read enhancement presets` (SELECT) → is_active = true
- `Service role can manage enhancement presets` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/ai-enhance/request` - Read available presets

### Job Matching System

#### `public.job_roles`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Anyone can read job roles` (SELECT) → true (public data)
- `Service role can manage job roles` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/job-matching/roles` - Browse available roles
- `POST /functions/v1/job-matching/recommendations` - Generate recommendations

#### `public.industry_categories`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Anyone can read industry categories` (SELECT) → true (public data)
- `Service role can manage industry categories` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/job-matching/roles` - Filter by industry

#### `public.role_recommendations`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own role recommendations` (SELECT) → auth.uid() = user_id
- `Users can create own role recommendations` (INSERT) → auth.uid() = user_id
- `Users can update own role recommendations` (UPDATE) → auth.uid() = user_id
- `Service role can manage role recommendations` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/job-matching/recommendations` - Create recommendations

#### `public.template_role_mappings`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Anyone can read template role mappings` (SELECT) → true (public data)
- `Service role can manage template role mappings` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/job-matching/recommendations` - Template suggestions

#### `public.skill_role_mappings`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Anyone can read skill role mappings` (SELECT) → true (public data)
- `Service role can manage skill role mappings` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/job-matching/recommendations` - Skill correlation analysis

### Growth System

#### `public.referral_codes`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own referral codes` (SELECT) → auth.uid() = user_id
- `Users can create own referral codes` (INSERT) → auth.uid() = user_id
- `Users can update own referral codes` (UPDATE) → auth.uid() = user_id
- `Service role can manage referral codes` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/growth/referral-code` - Get/create referral code

#### `public.referral_conversions`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own referral conversions` (SELECT) → auth.uid() = referrer_user_id OR auth.uid() = referred_user_id
- `Service role can manage referral conversions` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/growth/process-referral` - Process referral conversion

#### `public.user_achievements`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own achievements` (SELECT) → auth.uid() = user_id
- `Service role can manage user achievements` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/growth/achievements` - Get user achievements

#### `public.achievement_definitions`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Anyone can read achievement definitions` (SELECT) → is_active = true (public data)
- `Service role can manage achievement definitions` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/growth/achievements` - Read available achievements

#### `public.credit_transactions`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own credit transactions` (SELECT) → auth.uid() = user_id
- `Service role can manage credit transactions` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/growth/achievements` - Get credit balance
- `POST /functions/v1/growth/process-referral` - Award credits

### Analytics System

#### `public.analytics_events`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Service role can manage analytics events` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/analytics/track` - Track events
- `GET /functions/v1/analytics-dashboard/metrics` - Read for admin dashboard

#### `public.funnel_analytics`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Service role can manage funnel analytics` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/analytics/funnel` - Track funnel steps
- `GET /functions/v1/analytics-dashboard/metrics` - Read for admin dashboard

#### `public.user_events`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own events` (SELECT) → auth.uid() = user_id
- `Service role can manage user events` (ALL) → service_role

**Endpoints**:
- `POST /functions/v1/analytics/track` - Create user events

### Admin System

#### `public.admin_logs`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Service role can manage admin logs` (ALL) → service_role
- `Admins can read admin logs` (SELECT) → Admin role verification

**Endpoints**:
- `GET /functions/v1/admin/audit-logs` - Read admin actions
- All admin endpoints - Log administrative actions

#### `public.audit_logs`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read own audit logs` (SELECT) → auth.uid() = user_id
- `Service role can manage audit logs` (ALL) → service_role
- `Admins can read all audit logs` (SELECT) → Admin role verification

**Endpoints**:
- `GET /functions/v1/admin/audit-logs` - Admin audit trail viewing

#### `public.data_retention_policies`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Users can read retention policies` (SELECT) → true (public information)
- `Service role can manage retention policies` (ALL) → service_role

**Endpoints**:
- `GET /functions/v1/data-purge/status` - Read retention policies

#### `public.purge_jobs`
**RLS Status**: ✅ ENABLED  
**Policies**:
- `Service role can manage purge jobs` (ALL) → service_role
- `Admins can read purge jobs` (SELECT) → Admin role verification

**Endpoints**:
- `GET /functions/v1/data-purge/status` - Read purge job history
- `POST /functions/v1/data-purge/run` - Create purge jobs

## Security Architecture Summary

### Authentication Layers
1. **JWT Token Validation**: All authenticated endpoints verify JWT tokens
2. **Row Level Security**: Database-level access control using auth.uid()
3. **Role-Based Access**: Admin endpoints verify admin roles via admin_users table
4. **Service Role**: Backend services use service_role for system operations

### Data Isolation Patterns
- **User Data**: Isolated by `auth.uid() = user_id` pattern
- **Admin Data**: Accessible only to verified admin roles
- **Public Data**: Job roles, templates, achievements (read-only)
- **System Data**: Analytics, logs (service role only)

### Cross-Table Security
- **Cover Letter Drafts**: Security inherited from parent cover_letters table
- **Enhancement Suggestions**: Security inherited from parent enhancement_requests table
- **Stripe Tables**: Complex joins ensure user can only see their own payment data
- **Referral Conversions**: Users can see conversions where they are referrer OR referred

### Missing Tables
The following tables are referenced in code but missing from migrations:
- `public.admin_users` - Admin role management
- `public.parse_reviews` - Enhanced resume parsing
- `public.user_sessions` - Session management

These need to be created with appropriate RLS policies.