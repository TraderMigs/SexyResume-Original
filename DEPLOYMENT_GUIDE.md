# Deployment Guide - SexyResume.com

This guide covers all steps required to deploy the application to production.

## Prerequisites

- Node.js 18+
- Supabase account with project created
- Stripe account (live mode)
- OpenAI API key
- Sentry account (recommended)
- PostHog account (recommended)
- Domain name with SSL certificate

## Step 1: Supabase Setup

### 1.1 Database Migrations

Apply all migrations in chronological order:

```bash
# Connect to your Supabase project
cd supabase/migrations

# Migrations will be auto-applied via Supabase CLI or manually via SQL editor
# Order matters - apply in filename order (timestamp-based)
```

**Critical migrations:**
1. `20250926165411_azure_pebble.sql` - Core auth and resume schema
2. `20250927112956_heavy_recipe.sql` - Payment system
3. `20250927115808_dawn_frost.sql` - Stripe integration
4. `20251003050000_webhook_replay_protection.sql` - Webhook security
5. `20251003100000_create_resume_exports_bucket.sql` - Storage buckets

Total: 25 migrations, 9,436 lines of SQL

### 1.2 Storage Buckets

Create storage buckets in Supabase Dashboard:

1. **resumes** bucket
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`

2. **resume-exports** bucket
   - Public: No
   - File size limit: 10MB
   - Automatic cleanup: 24 hours

### 1.3 Edge Functions Environment Variables

**CRITICAL:** Set these in Supabase Dashboard > Edge Functions > Secrets:

```bash
# Required for all functions
SUPABASE_URL=<auto-populated>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard>

# Stripe (payment processing)
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXX

# OpenAI (AI features)
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXX

# Monitoring (optional but recommended)
SENTRY_DSN=https://xxxxxxxx@sentry.io/xxxxxxx
DENO_ENV=production
```

### 1.4 Deploy Edge Functions

Deploy all 20 edge functions in this order:

```bash
# Core functions first
supabase functions deploy auth
supabase functions deploy resumes

# AI functions
supabase functions deploy parse-resume
supabase functions deploy ai-enhance
supabase functions deploy job-matching

# Payment functions
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy payments

# Export functions
supabase functions deploy export-resume
supabase functions deploy exports
supabase functions deploy cleanup-exports

# Analytics functions
supabase functions deploy analytics
supabase functions deploy analytics-dashboard

# Growth functions
supabase functions deploy growth
supabase functions deploy cover-letter

# Admin functions
supabase functions deploy admin
supabase functions deploy data-lifecycle
supabase functions deploy data-purge
supabase functions deploy parse-review
```

**Verify deployment:**
```bash
supabase functions list
```

## Step 2: Stripe Configuration

### 2.1 Create Product and Price

1. Go to Stripe Dashboard > Products
2. Create product: "Sexy Resume Export"
3. Set price: $7.00 USD
4. Note the Price ID (format: `price_XXXXXXXXXXXXXX`)

### 2.2 Configure Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret (format: `whsec_XXXXXXXXXXXX`)
5. Add to Supabase Edge Functions secrets

### 2.3 Test Webhook

```bash
# Use Stripe CLI to test locally
stripe listen --forward-to https://<your-project>.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

## Step 3: Frontend Deployment

### 3.1 Environment Variables

Create `.env.production`:

```bash
# Supabase (from Dashboard)
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJXXXXXXXXXXXX

# Stripe (publishable key - LIVE MODE)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXX
VITE_STRIPE_PRICE_ID=price_XXXXXXXXXXXXXXXX

# Analytics (optional)
VITE_POSTHOG_KEY=phx_XXXXXXXXXXXXXXXX
VITE_POSTHOG_HOST=https://us.posthog.com

# Monitoring (optional)
VITE_SENTRY_DSN=https://xxxxxxxx@sentry.io/xxxxxxx

# Build configuration (for source maps)
SENTRY_ORG=your-org
SENTRY_PROJECT=sexyresume
SENTRY_AUTH_TOKEN=sntrys_XXXXXXXXXXXXXXXX
```

### 3.2 Build Application

```bash
npm install
npm run build:production
```

### 3.3 Deployment Options

#### Option A: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Create `vercel.json`:
```json
{
  "buildCommand": "npm run build:production",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_STRIPE_PUBLISHABLE_KEY": "@stripe-publishable-key"
  }
}
```

3. Deploy:
```bash
vercel --prod
```

#### Option B: Netlify

1. Create `netlify.toml`:
```toml
[build]
  command = "npm run build:production"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Deploy:
```bash
netlify deploy --prod
```

#### Option C: Docker

Use the included Dockerfile:

```bash
docker build -t sexyresume:latest .
docker run -p 80:80 sexyresume:latest
```

## Step 4: DNS & SSL Configuration

1. Point your domain to deployment platform
2. Configure SSL certificate (auto-provisioned on Vercel/Netlify)
3. Update CORS settings in Supabase for your production domain

## Step 5: GitHub Actions CI/CD

### 5.1 Configure GitHub Secrets

Go to GitHub Repository > Settings > Secrets and add:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_SENTRY_DSN
VITE_POSTHOG_KEY
VITE_POSTHOG_HOST
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
```

### 5.2 Verify CI Pipeline

Push to `main` branch and verify:
- ✅ Linting passes
- ✅ Type checking passes
- ✅ Unit tests pass
- ✅ E2E tests pass
- ✅ Accessibility tests pass
- ✅ Build succeeds

## Step 6: Post-Deployment Verification

### 6.1 Health Checks

Visit these endpoints:
- `https://your-domain.com` - Landing page
- `https://your-domain.com/health` - Health check endpoint
- `https://your-project.supabase.co/functions/v1/auth` - Edge function check

### 6.2 Test Critical Flows

1. **User Registration**
   - Sign up with email/password
   - Verify user created in Supabase Auth

2. **Resume Upload**
   - Upload PDF resume
   - Verify parsing works
   - Check file stored in `resumes` bucket

3. **Payment Flow**
   - Create resume
   - Click export button
   - Complete Stripe checkout
   - Verify entitlement unlocked
   - Download exported resume

4. **Webhook Processing**
   - Check webhook_events table for entries
   - Verify no duplicate processing
   - Check user_entitlements updated

### 6.3 Monitor Error Rates

- Sentry: Check for errors in first 24 hours
- PostHog: Monitor user activation rate
- Supabase: Check edge function logs

## Step 7: Monitoring Setup

### 7.1 Sentry Configuration

1. Create Sentry project
2. Configure release tracking
3. Set up alerts for:
   - Error rate > 1%
   - Payment processing failures
   - Webhook signature failures

### 7.2 PostHog Dashboards

Create dashboards for:
- Activation rate (users who create resume)
- Conversion rate (users who pay)
- Retention cohorts
- Feature adoption

### 7.3 Uptime Monitoring

Set up external monitoring:
- Pingdom, UptimeRobot, or similar
- Check every 5 minutes
- Alert on downtime

## Step 8: Security Hardening

### 8.1 RLS Verification

Run this query to verify all tables have RLS enabled:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  );
```

Result should be empty or only contain webhook_events (service-role only).

### 8.2 CORS Configuration

Update Supabase edge functions to allow only your production domain:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sexyresume.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};
```

### 8.3 Rate Limiting

Verify rate limiting is active on:
- Authentication endpoints (5 attempts/min)
- Webhook endpoints (100 requests/min)
- AI enhancement (10 requests/min per user)

## Step 9: Backup Strategy

### 9.1 Database Backups

Supabase automatically backs up PostgreSQL database daily. Verify:
- Daily backups enabled
- Point-in-time recovery available
- Retention period: 7 days minimum

### 9.2 Storage Backups

Configure lifecycle policy for `resume-exports`:
- Auto-delete after 24 hours (already configured)
- No backup needed (temporary files)

For `resumes` bucket:
- Consider archival strategy for GDPR compliance
- Implement user data export functionality

## Step 10: Performance Optimization

### 10.1 CDN Configuration

Configure CDN for static assets:
- Cache CSS/JS for 1 year
- Cache images for 30 days
- Enable Brotli compression

### 10.2 Database Indexes

Verify indexes exist on:
- `resumes.user_id`
- `user_entitlements.user_id`
- `webhook_events.stripe_event_id`
- `stripe_orders.user_id`

### 10.3 Edge Function Optimization

Monitor edge function cold starts:
- Target: < 500ms
- Use `EdgeRuntime.waitUntil()` for background tasks
- Keep function bundles < 1MB

## Troubleshooting

### Issue: Webhooks failing with 400 error

**Solution:** Verify webhook secret matches Stripe dashboard

```bash
# Check edge function logs
supabase functions logs stripe-webhook

# Test signature verification
curl -X POST https://your-project.supabase.co/functions/v1/stripe-webhook \
  -H "stripe-signature: test" \
  -d '{"type":"test"}'
```

### Issue: Export downloads not working

**Solution:** Check storage bucket permissions and signed URL generation

```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'resume-exports';

-- Check RLS policies
SELECT * FROM storage.policies WHERE bucket_id = 'resume-exports';
```

### Issue: AI parsing not working

**Solution:** Verify OpenAI API key is set correctly

```bash
# Check edge function secrets
supabase secrets list

# Test AI endpoint
curl https://your-project.supabase.co/functions/v1/parse-resume
```

## Rollback Procedure

If deployment fails:

1. **Frontend:** Revert to previous Vercel/Netlify deployment
2. **Database:** Use Supabase point-in-time recovery
3. **Edge Functions:** Redeploy previous version
4. **Stripe:** Disable webhook endpoint temporarily

## Maintenance

### Daily
- Check error rates in Sentry
- Monitor conversion metrics in PostHog
- Verify webhook processing in webhook_events table

### Weekly
- Review database performance
- Check edge function cold start times
- Analyze user feedback and support tickets

### Monthly
- Update dependencies (`npm update`)
- Review security advisories
- Optimize database queries
- Audit RLS policies

## Support Contacts

- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com
- Sentry Support: https://sentry.io/support

---

**Last Updated:** 2025-11-02
**Version:** 1.0.0
