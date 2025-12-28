# Environment Setup Guide

Complete guide for configuring all environment variables and secrets for the SexyResume.com application.

## Overview

The application requires configuration in three separate locations:
1. **Frontend (.env file)** - Client-side environment variables
2. **Supabase Edge Functions** - Server-side secrets
3. **GitHub Actions** - CI/CD pipeline secrets

## 1. Frontend Environment Variables

### Location
Create a `.env` file in the project root directory.

### Required Variables

```bash
# ============================================
# SUPABASE CONFIGURATION (Required)
# ============================================
# Get these from: Supabase Dashboard > Project Settings > API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# STRIPE CONFIGURATION (Required)
# ============================================
# Get from: Stripe Dashboard > Developers > API Keys
# IMPORTANT: Use test keys for development, live keys for production
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51... # or pk_live_51... for production

# Get from: Stripe Dashboard > Products > Your Product > Pricing
VITE_STRIPE_PRICE_ID=price_1RntxwRrIlnVe6VQGCrp5lxU
```

### Optional Variables

```bash
# ============================================
# ANALYTICS (Optional but Recommended)
# ============================================
# PostHog - User analytics and feature tracking
# Get from: PostHog Dashboard > Project Settings > Project API Key
VITE_POSTHOG_KEY=phx_1zLEshT66Rj1PSDzFLT3NKnFqdcLVRieBfPR2n9IeAWssJp
VITE_POSTHOG_HOST=https://us.posthog.com

# ============================================
# ERROR MONITORING (Optional but Recommended)
# ============================================
# Sentry - Error tracking and performance monitoring
# Get from: Sentry Dashboard > Project Settings > Client Keys (DSN)
VITE_SENTRY_DSN=https://9a0f1602efab1d6641f3405e81c7e77c@o4509976727912448.ingest.us.sentry.io/4509976730206208
```

### Build-Time Variables (CI/CD Only)

```bash
# ============================================
# SENTRY BUILD CONFIGURATION (Optional)
# ============================================
# Only needed for CI/CD to upload source maps
# Get from: Sentry Dashboard > Settings > Auth Tokens
SENTRY_ORG=your-organization
SENTRY_PROJECT=sexyresume
SENTRY_AUTH_TOKEN=sntrys_ey...
```

### Example .env File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials.

## 2. Supabase Edge Functions Secrets

### Location
Supabase Dashboard > Edge Functions > Manage Secrets

### How to Set Secrets

```bash
# Using Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set SENTRY_DSN=https://...

# Or set via Supabase Dashboard
# Dashboard > Edge Functions > Secrets > Add New Secret
```

### Required Secrets

#### SUPABASE_SERVICE_ROLE_KEY
```bash
# Location: Supabase Dashboard > Project Settings > API > service_role key
# Purpose: Admin access to database and storage from edge functions
# Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Used by: ALL edge functions

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **CRITICAL:** Keep this key secret. It bypasses Row Level Security!

#### STRIPE_SECRET_KEY
```bash
# Location: Stripe Dashboard > Developers > API Keys > Secret key
# Purpose: Process payments and manage subscriptions
# Format: sk_test_... (test) or sk_live_... (production)
# Used by: stripe-checkout, stripe-webhook, payments functions

STRIPE_SECRET_KEY=sk_test_51PyV73RrIlnVe6VQ...
```

For production, use live key:
```bash
STRIPE_SECRET_KEY=sk_live_51PyV73RrIlnVe6VQ...
```

#### STRIPE_WEBHOOK_SECRET
```bash
# Location: Stripe Dashboard > Developers > Webhooks > Signing secret
# Purpose: Verify webhook authenticity (prevent fraud)
# Format: whsec_...
# Used by: stripe-webhook function

STRIPE_WEBHOOK_SECRET=whsec_10JGVkvtEBNGT2q6e135xDZtWyUvFFGQ
```

**How to get this:**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)

#### OPENAI_API_KEY
```bash
# Location: OpenAI Platform > API Keys
# Purpose: AI resume parsing, content enhancement, job matching
# Format: sk-...
# Used by: parse-resume, ai-enhance, job-matching, cover-letter functions

OPENAI_API_KEY=sk-proj-...
```

**How to get this:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "SexyResume Production"
4. Copy the key (you can only see it once!)
5. Set usage limits to avoid unexpected charges

### Optional Secrets

#### SENTRY_DSN
```bash
# Location: Sentry Dashboard > Project Settings > Client Keys (DSN)
# Purpose: Error monitoring for edge functions
# Format: https://...@sentry.io/...
# Used by: ALL edge functions (via shared/sentry.ts)

SENTRY_DSN=https://9a0f1602efab1d6641f3405e81c7e77c@o4509976727912448.ingest.us.sentry.io/4509976730206208
```

**Recommended for production** to track edge function errors.

#### DENO_ENV
```bash
# Purpose: Set environment name for logging
# Format: production, staging, development
# Default: production

DENO_ENV=production
```

### Verification

Verify all secrets are set:

```bash
supabase secrets list

# Expected output:
# NAME                        VALUE (first 4 chars)
# ----------------------------------------
# SUPABASE_URL               http
# SUPABASE_SERVICE_ROLE_KEY  eyJh
# STRIPE_SECRET_KEY          sk_t
# STRIPE_WEBHOOK_SECRET      whse
# OPENAI_API_KEY             sk-p
# SENTRY_DSN                 http
```

## 3. GitHub Actions Secrets

### Location
GitHub Repository > Settings > Secrets and variables > Actions

### How to Add Secrets

1. Go to your GitHub repository
2. Click Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret individually

### Required Secrets

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51...

# Analytics (Optional)
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_POSTHOG_KEY=phx_...
VITE_POSTHOG_HOST=https://us.posthog.com

# Sentry Build Configuration (Optional)
SENTRY_ORG=your-organization
SENTRY_PROJECT=sexyresume
SENTRY_AUTH_TOKEN=sntrys_ey...
```

### Used In

These secrets are used in `.github/workflows/ci.yml`:
- Build step (lines 205-215)
- E2E tests (lines 114-115)
- Accessibility tests (lines 80-81)

## 4. Security Best Practices

### DO ✅

1. **Use different keys for different environments**
   - Development: Test Stripe keys, development OpenAI keys
   - Production: Live Stripe keys, production OpenAI keys

2. **Rotate secrets regularly**
   - Rotate API keys every 90 days
   - Immediately rotate if compromised

3. **Use .env.local for local overrides**
   ```bash
   # .gitignore already includes .env.local
   cp .env .env.local
   # Make local changes in .env.local
   ```

4. **Verify secrets before deployment**
   ```bash
   # Test Supabase connection
   curl https://your-project.supabase.co/functions/v1/health

   # Test Stripe webhook
   stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

### DON'T ❌

1. **Never commit .env to git**
   - Already in .gitignore
   - Double-check before pushing

2. **Never share service_role key**
   - Bypasses all security
   - Only use in edge functions

3. **Never use production keys in development**
   - Use test mode for Stripe
   - Use separate OpenAI project

4. **Never log secrets**
   - Don't console.log environment variables
   - Sentry automatically strips PII

## 5. Environment-Specific Configuration

### Development

```bash
# .env.development
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_ID=price_test_...
```

### Staging

```bash
# .env.staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_ID=price_test_...
VITE_SENTRY_DSN=https://...
```

### Production

```bash
# .env.production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_ID=price_live_...
VITE_SENTRY_DSN=https://...
VITE_POSTHOG_KEY=phx_...
```

## 6. Troubleshooting

### Error: "Missing environment variable"

**Frontend:**
```bash
# Check if .env file exists
ls -la .env

# Verify variables are prefixed with VITE_
grep VITE_ .env

# Restart dev server after changes
npm run dev
```

**Edge Functions:**
```bash
# List all secrets
supabase secrets list

# Set missing secret
supabase secrets set VARIABLE_NAME=value
```

### Error: "Invalid Supabase credentials"

1. Verify URL format: `https://[project-id].supabase.co`
2. Check anon key starts with `eyJ`
3. Ensure no trailing spaces or quotes
4. Test connection:
```bash
curl https://your-project.supabase.co/rest/v1/
```

### Error: "Stripe webhook signature verification failed"

1. Ensure webhook secret matches Stripe dashboard
2. Check webhook endpoint URL is correct
3. Verify events are configured in Stripe
4. Test with Stripe CLI:
```bash
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

### Error: "OpenAI API rate limit exceeded"

1. Check OpenAI dashboard for usage limits
2. Verify API key is valid
3. Consider upgrading OpenAI plan
4. Implement request caching

## 7. Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Fill in Supabase URL and anon key
- [ ] Add Stripe publishable key (test mode)
- [ ] Set up Supabase edge function secrets
- [ ] Add Stripe secret key to Supabase
- [ ] Add Stripe webhook secret to Supabase
- [ ] Add OpenAI API key to Supabase
- [ ] Configure GitHub Actions secrets
- [ ] Test health check endpoint
- [ ] Test payment flow with Stripe test mode
- [ ] Verify AI features work

## 8. Support

If you encounter issues:

1. Check this guide first
2. Verify all secrets are set correctly
3. Test individual components (database, payments, AI)
4. Check edge function logs: `supabase functions logs <function-name>`
5. Contact support with specific error messages

---

**Last Updated:** 2025-11-02
**Version:** 1.0.0
