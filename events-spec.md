# Analytics Events Specification

This document defines all analytics events tracked in the SexyResume application for conversion funnel monitoring and product analytics.

## Event Tracking Infrastructure

- **Frontend Analytics**: PostHog (user consent required)
- **Error Monitoring**: Sentry (frontend + edge functions, PII-free)
- **Database Storage**: Supabase `analytics_events` table
- **Privacy**: All events are PII-free and GDPR compliant

## Core Conversion Events

### 1. Parse Events

#### `parse_started`
User initiates resume upload and parsing.

**Properties:**
- `file_type`: string (pdf, docx, doc, txt)
- `file_size`: number (bytes)
- `timestamp`: ISO 8601 datetime

**Triggers:**
- User uploads file in ResumeUpload component
- Before file validation

**Success Criteria:**
- File passes validation
- Parse request sent to edge function

---

#### `parse_completed`
Resume parsing finished successfully.

**Properties:**
- `confidence`: number (0-1, parsing confidence score)
- `sections_found`: number (count of populated resume sections)
- `duration_ms`: number (parsing duration)
- `ai_used`: boolean (whether AI parsing was used vs heuristic)
- `timestamp`: ISO 8601 datetime

**Triggers:**
- `/parse-resume` edge function returns success
- Resume data saved to database

**Success Criteria:**
- Parsed data meets minimum quality threshold
- At least 3 sections populated
- Confidence score > 0.5

---

### 2. Review Events

#### `review_saved`
User completes parse review and saves corrections.

**Properties:**
- `corrections_made`: number (count of fields edited)
- `final_confidence`: number (0-1, updated confidence after review)
- `sections_corrected`: string[] (array of section names edited)
- `review_duration_seconds`: number
- `timestamp`: ISO 8601 datetime

**Triggers:**
- User clicks "Save" in ParseReviewWorkspace
- After validation passes

**Success Criteria:**
- At least personalInfo section complete
- Required fields validated
- Changes persisted to database

---

### 3. Template Events

#### `template_chosen`
User selects a resume template.

**Properties:**
- `template_id`: string (modern, classic, creative, minimal, executive)
- `recommendation_score`: number (0-100, if recommended by AI)
- `was_recommended`: boolean (true if from AI recommendation)
- `rank_in_recommendations`: number (1-5, position in recommendation list)
- `timestamp`: ISO 8601 datetime

**Triggers:**
- User clicks template in TemplateSelector
- Template applied to resume preview

**Success Criteria:**
- Template successfully loaded
- Preview rendered without errors

---

### 4. Checkout Events

#### `checkout_started`
User initiates payment checkout.

**Properties:**
- `product`: string (export_unlock)
- `amount`: number (price in cents)
- `currency`: string (usd)
- `trigger_source`: string (export_button, paywall, upgrade_prompt)
- `timestamp`: ISO 8601 datetime

**Triggers:**
- User clicks "Unlock Exports" button
- Stripe checkout session created

**Success Criteria:**
- Stripe session ID generated
- User redirected to Stripe checkout

---

#### `checkout_completed`
Payment successfully processed.

**Properties:**
- `product`: string (export_unlock)
- `amount`: number (amount paid in cents)
- `payment_method`: string (card, paypal, etc.)
- `stripe_session_id`: string
- `timestamp`: ISO 8601 datetime

**Triggers:**
- Stripe webhook `checkout.session.completed` received
- Entitlement unlocked in database

**Success Criteria:**
- Payment confirmed by Stripe
- `user_entitlements.export_unlocked = true`
- Receipt logged in `payment_receipts`

---

### 5. Export Events

#### `export_success`
Resume export completed successfully.

**Properties:**
- `format`: string (pdf, docx, txt, ats)
- `template`: string (modern, classic, creative, minimal, executive)
- `file_size`: number (bytes)
- `processing_time_ms`: number
- `watermarked`: boolean (false after payment)
- `timestamp`: ISO 8601 datetime

**Triggers:**
- `/export-resume` edge function returns success
- Download URL generated

**Success Criteria:**
- File uploaded to storage
- Signed URL created
- Export record saved to database

---

#### `export_fail`
Resume export failed.

**Properties:**
- `format`: string (pdf, docx, txt, ats)
- `error_type`: string (rate_limit, generation_error, storage_error, auth_error)
- `error_message`: string (sanitized error)
- `retry_count`: number
- `timestamp`: ISO 8601 datetime

**Triggers:**
- Export edge function returns error
- User sees error message

**Failure Types:**
- `rate_limit`: Too many exports in time window
- `generation_error`: PDF/DOCX generation failed
- `storage_error`: Failed to upload to Supabase Storage
- `auth_error`: Export feature locked or unauthorized

---

## Conversion Funnel Metrics

### Key Performance Indicators (KPIs)

#### 1. Parse Success Rate
```
parse_completed / parse_started × 100%
```
**Target**: > 85%
**Measures**: File parsing reliability and AI quality

---

#### 2. Review Completion Rate
```
review_saved / parse_completed × 100%
```
**Target**: > 60%
**Measures**: User engagement with parsed data quality

---

#### 3. Template Selection Rate
```
template_chosen / review_saved × 100%
```
**Target**: > 90%
**Measures**: Template recommendation effectiveness

---

#### 4. Checkout Conversion Rate
```
checkout_completed / checkout_started × 100%
```
**Target**: > 5%
**Measures**: Payment flow effectiveness and pricing

---

#### 5. Export Success Rate
```
export_success / (export_success + export_fail) × 100%
```
**Target**: > 99%
**Measures**: Technical reliability of export pipeline

---

#### 6. Time to Export
```
median(export_success.timestamp - parse_started.timestamp)
```
**Target**: < 5 minutes
**Measures**: End-to-end user flow velocity

---

## Dashboard Implementation

### Tiles Required

1. **Parse Success Rate**
   - Current 7-day rate
   - Trend vs previous 7 days
   - Breakdown by file type

2. **Export Success Rate**
   - Current 7-day rate
   - Trend vs previous 7 days
   - Breakdown by format (PDF, DOCX, TXT, ATS)

3. **Checkout Conversion**
   - Current 7-day conversion rate
   - Revenue generated
   - Average order value

4. **Time to Export**
   - Median time (last 7 days)
   - P50, P90, P95 percentiles
   - Funnel drop-off visualization

### Cohort Analysis

Track conversion rates by:
- User acquisition source
- Template selected
- Parse confidence score
- Review corrections count

---

## Error Monitoring (Sentry)

### Event Categories

#### Critical Errors (P0)
- Payment processing failures
- Export generation failures
- Database connection errors
- Authentication failures

#### High Priority (P1)
- Parse failures above threshold
- Stripe webhook signature failures
- RLS policy violations
- Rate limit exceeded patterns

#### Medium Priority (P2)
- File validation errors
- Template rendering issues
- Storage upload timeouts

#### Low Priority (P3)
- Client-side validation errors
- Preview generation warnings

### PII Protection

All Sentry events must:
- Strip email addresses
- Remove phone numbers
- Redact personal names
- Sanitize file contents
- Hash user IDs

### Sample Issue Link

Example Sentry issue for monitoring:
```
https://sentry.io/organizations/sexyresume/issues/[issue-id]/
```

---

## Implementation Checklist

- [x] Sentry initialized on frontend (see src/lib/sentry.ts)
- [ ] Sentry integrated in edge functions
- [x] Analytics events defined (see src/lib/analytics.ts)
- [ ] All conversion events tracked in user flows
- [ ] Dashboard component with KPI tiles created
- [ ] Error tracking active with PII protection
- [ ] Conversion funnel queries tested

---

## Database Schema

### `analytics_events` Table
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  source TEXT DEFAULT 'web'
);

CREATE INDEX idx_analytics_events_name_time
  ON analytics_events(event_name, timestamp DESC);

CREATE INDEX idx_analytics_events_user_time
  ON analytics_events(user_id, timestamp DESC);
```

### Query Examples

**Parse Success Rate (Last 7 Days):**
```sql
SELECT
  COUNT(*) FILTER (WHERE event_name = 'parse_completed') * 100.0 /
  NULLIF(COUNT(*) FILTER (WHERE event_name = 'parse_started'), 0)
    AS parse_success_rate
FROM analytics_events
WHERE timestamp > now() - interval '7 days'
  AND event_name IN ('parse_started', 'parse_completed');
```

**Checkout Conversion Rate:**
```sql
SELECT
  COUNT(*) FILTER (WHERE event_name = 'checkout_completed') * 100.0 /
  NULLIF(COUNT(*) FILTER (WHERE event_name = 'checkout_started'), 0)
    AS checkout_conversion_rate
FROM analytics_events
WHERE timestamp > now() - interval '7 days'
  AND event_name IN ('checkout_started', 'checkout_completed');
```

**Time to Export (Median):**
```sql
WITH export_times AS (
  SELECT
    user_id,
    session_id,
    MIN(timestamp) FILTER (WHERE event_name = 'parse_started') AS start_time,
    MAX(timestamp) FILTER (WHERE event_name = 'export_success') AS end_time
  FROM analytics_events
  WHERE event_name IN ('parse_started', 'export_success')
    AND timestamp > now() - interval '7 days'
  GROUP BY user_id, session_id
  HAVING COUNT(*) FILTER (WHERE event_name = 'export_success') > 0
)
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
  ORDER BY EXTRACT(EPOCH FROM (end_time - start_time))
) AS median_seconds
FROM export_times
WHERE end_time > start_time;
```

---

## Environment Variables

### Sentry Configuration
```env
VITE_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

### PostHog Configuration (Optional)
```env
VITE_POSTHOG_KEY=phc_[key]
VITE_POSTHOG_HOST=https://app.posthog.com
```

---

## Privacy & Compliance

### GDPR Compliance
- All analytics require user consent (CookieConsent component)
- Users can opt-out at any time
- Data deletion requests honored via `data-purge` edge function
- Retention: 90 days for analytics events

### Data Minimization
- No collection of PII in analytics events
- User IDs hashed before sending to PostHog
- Error stacks truncated to 500 chars
- File contents never logged

### User Rights
- Right to access: View analytics data in Privacy Dashboard
- Right to deletion: Purge all events via data subject request
- Right to portability: Export events in JSON format
- Right to restrict processing: Disable analytics tracking

---

## Testing

### Unit Tests
- Event tracking functions
- PII sanitization
- Error boundary behavior

### Integration Tests
- End-to-end conversion funnel
- Stripe webhook processing
- Export pipeline

### Monitoring
- Daily funnel metrics review
- Weekly conversion rate analysis
- Monthly cohort retention reports

---

**Last Updated**: 2025-10-04
**Version**: 1.0.0
**Owner**: Engineering Team
