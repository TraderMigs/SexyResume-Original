# Staged Purge Test - Quick Start Guide

## Purpose

This guide provides step-by-step instructions for running the comprehensive staged purge test to verify that data retention policies are enforced correctly.

## Prerequisites

1. **Supabase Instance**: You must have a Supabase project with the database schema deployed
2. **Service Role Key**: Required for bypassing RLS during testing
3. **Environment Variables**: `.env` file with proper configuration

## Required Environment Variables

Create or update your `.env` file:

```bash
# Required for test execution
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` must be set as an environment variable (not in `.env`) for security reasons.

## Step-by-Step Execution

### Step 1: Set Service Role Key

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Where to find your service role key:**
1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (NOT the anon key)

### Step 2: Verify Database Schema

Ensure these tables exist in your database:
- `users`
- `exports`
- `audit_logs`
- `data_lifecycle_policies`
- `purge_execution_logs`

```bash
# Optional: Check if tables exist
psql $DATABASE_URL -c "\dt public.*"
```

### Step 3: Run the Staged Purge Test

```bash
npm run test:unit -- src/test/purge.test.ts
```

**Expected Output:**
```
 ✓ src/test/purge.test.ts (13 tests) 15234ms
   ✓ Staged Purge Test - Full Retention Enforcement (13)
     ✓ should verify purge infrastructure exists
     ✓ should create test user for seeding
     ✓ should seed 5 old exports (>24h) for purging
     ✓ should seed 3 recent exports (<24h) to preserve
     ✓ should capture before counts
     ✓ should execute cleanup-exports function
     ✓ should capture after counts
     ✓ should verify old exports were deleted
     ✓ should verify recent exports were preserved
     ✓ should verify audit logs were created for deletions
     ✓ should verify purge execution log exists
     ✓ should generate purge-run.log with full report
     ✓ should cleanup test data

Test Files  1 passed (1)
     Tests  13 passed (13)
  Start at  15:30:25
  Duration  15.23s
```

### Step 4: Review Generated Log

After test completion, view the generated proof-of-execution log:

```bash
cat purge-run.log
```

This log contains:
- Before/after counts for exports and audit logs
- Delta calculations (records deleted, storage freed)
- Full purge execution results
- Sample audit entries with metadata
- Verification status (PASS/FAIL for each check)
- Compliance summary
- Production deployment recommendations

## What the Test Does

### 1. **Infrastructure Verification**
- Confirms database schema is properly deployed
- Verifies all required tables exist

### 2. **Data Seeding**
- Creates a test user
- Seeds 5 exports with timestamps >24 hours ago (should be purged)
- Seeds 3 exports with timestamps <24 hours ago (should be preserved)

### 3. **Purge Execution**
- Calls the `cleanup-exports` edge function
- Waits for async operations to complete
- Captures before/after metrics

### 4. **Verification**
- Confirms old exports were deleted (5 records)
- Confirms recent exports were preserved (3 records)
- Verifies audit logs were created for each deletion
- Validates purge execution log entry

### 5. **Report Generation**
- Generates comprehensive `purge-run.log`
- Includes all metrics, audit samples, and compliance info

### 6. **Cleanup**
- Removes all test data
- Leaves database in clean state

## Troubleshooting

### Error: "Missing Supabase credentials"

**Solution**: Ensure environment variables are set:
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-key"
echo $VITE_SUPABASE_URL  # Should output your Supabase URL
```

### Error: "Table does not exist"

**Solution**: Deploy the database migrations:
```bash
# Check which migrations have been applied
supabase db remote list

# Apply missing migrations
supabase db push
```

### Error: "Unauthorized" or "RLS policy violation"

**Solution**: The test uses the service role key which bypasses RLS. Ensure you're using the correct key:
```bash
# Verify service role key starts with "eyJ..."
echo $SUPABASE_SERVICE_ROLE_KEY | cut -c1-10
```

### Error: "cleanup-exports function not found"

**Solution**: Deploy the edge function:
```bash
# Deploy cleanup-exports function
supabase functions deploy cleanup-exports
```

### Test Hangs or Times Out

**Solution**: Check if the edge function is responding:
```bash
curl -X POST "$VITE_SUPABASE_URL/functions/v1/cleanup-exports" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## Interpreting Results

### ✓ All Tests Pass (Expected)

If all 13 tests pass:
- Retention policy is working correctly
- Old data (>24h) is being purged automatically
- Recent data (<24h) is preserved
- Audit trail is comprehensive
- System is production-ready

**Next Steps:**
1. Configure cron job in Supabase Dashboard (hourly)
2. Set up alerting for failed purge jobs
3. Review the generated `purge-run.log` for compliance evidence

### ✗ Tests Fail

If tests fail, check:

**Failed Deletion Test:**
- Edge function may not be deployed
- Storage bucket permissions may be incorrect
- Check edge function logs for errors

**Failed Preservation Test:**
- Logic may be incorrectly deleting recent exports
- Review the `cleanup-exports/index.ts` cutoff date logic

**Failed Audit Test:**
- `audit_logs` table may not exist
- RLS policies may be blocking inserts
- Check database permissions

## Production Deployment Checklist

After successful test execution:

- [ ] Configure Supabase cron job (hourly for `cleanup-exports`)
- [ ] Set up monitoring for `purge_execution_logs` table
- [ ] Configure alerting for failed purges (status = 'failed')
- [ ] Document purge schedule for compliance team
- [ ] Add `purge-run.log` to compliance evidence repository
- [ ] Test manual purge invocation
- [ ] Review and approve privacy policy updates (`docs/PRIVACY.md`)
- [ ] Update security documentation for operations team

## Compliance Evidence

The generated `purge-run.log` serves as proof that:

1. **GDPR Article 5(e)** - Storage limitation principle is enforced
2. **Audit Trail** - All deletions are logged with full context
3. **Data Integrity** - No unintended deletions occurred
4. **Automated Enforcement** - Retention is enforced automatically, not manually

**Store this log for:**
- Regulatory audits (GDPR, CCPA)
- Internal compliance reviews
- Security assessments
- Customer data requests

## Advanced Usage

### Running with Different Retention Periods

To test different retention periods, modify the test:

```typescript
// In src/test/purge.test.ts
const hoursAgo = 25; // Change this value (default: 25-29 hours)
```

### Dry Run Mode

To test without actual deletion:

```typescript
// Modify cleanup-exports/index.ts temporarily
dry_run: true  // Set to true for testing
```

### Testing with Real Data

**NOT RECOMMENDED** for production databases. Always use a staging environment.

If you must test with production-like data:
1. Create a full database backup first
2. Clone to a staging environment
3. Run tests on the clone
4. Review results before applying to production

## Support

If you encounter issues not covered in this guide:

1. Check edge function logs in Supabase Dashboard
2. Review database logs for RLS policy violations
3. Verify all migrations have been applied
4. Ensure Supabase project is on a paid plan (cron jobs require paid plan)

## Summary

The staged purge test provides comprehensive verification that data retention policies work as designed. Running this test before production deployment ensures:

- Automated cleanup functions correctly
- No data loss occurs
- Audit trail is complete
- Compliance requirements are met

Once all tests pass, the system is ready for production deployment with confidence that retention policies will be enforced automatically and correctly.
