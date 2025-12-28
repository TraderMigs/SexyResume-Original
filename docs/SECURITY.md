
## Data Retention and Purge Policies

### Overview

SexyResume.com implements comprehensive data retention policies to comply with privacy regulations (GDPR, CCPA) and minimize data exposure. All retention policies are automated, audited, and configurable per data category.

### Retention Periods

| Data Category | Retention Period | Purge Method | Archive Required |
|--------------|------------------|--------------|------------------|
| Exports (PDF/DOCX) | 24 hours | Hard delete + storage cleanup | No |
| Parse Reviews | 7 days | Hard delete | No |
| Checkout Sessions | Until expiry or payment | Status update to 'expired' | No |
| Inactive Resumes | 365 days (no updates) | Soft delete | Yes |
| Inactive Cover Letters | 365 days (no updates) | Soft delete | Yes |
| Inactive User Accounts | 3 years (no login) | Anonymization + cascade | Yes (minimal) |
| Payment Receipts | 7 years | Archive only | Yes (legal requirement) |
| Analytics Events | 2 years | Hard delete | Optional |
| Audit Logs | 7 years | Archive after 1 year | Yes |

### Automated Cleanup Jobs

#### 1. Export Cleanup (Hourly)

**Schedule**: Every hour via cron
**Function**: `cleanup-exports`
**Process**:
1. Query exports with `created_at < NOW() - 24 hours`
2. Delete files from `resume-exports` storage bucket
3. Delete database records from `exports` table
4. Write audit log for each deletion
5. Update `purge_execution_logs` with metrics

**Audit Trail**:
```sql
-- Sample audit log entry
{
  "user_id": "uuid",
  "action": "export_purged",
  "resource_type": "export",
  "resource_id": "uuid",
  "metadata": {
    "job_id": "cleanup-uuid",
    "format": "pdf",
    "file_size": 102400,
    "reason": "retention_policy_24h",
    "purged_at": "2025-10-03T15:30:00Z"
  }
}
```

#### 2. Data Purge (Daily)

**Schedule**: Daily at 2 AM UTC via cron
**Function**: `data-purge`
**Process**:
1. Load active retention policies from `data_lifecycle_policies`
2. For each policy:
   - Calculate cutoff date based on retention period
   - Query records older than cutoff
   - Archive records if required (before deletion)
   - Soft delete or hard delete based on policy
   - Write comprehensive audit logs
3. Generate `purge_execution_logs` entry with full metrics

**Supported Operations**:
- Soft delete: Sets `deleted_at` timestamp, preserves data
- Hard delete: Permanent removal from database
- Archive-before-delete: Exports records to JSON archive in storage
- Anonymization: Replaces PII with anonymized values

### User Deletion Path

When a user requests account deletion (GDPR "Right to be Forgotten"):

**Step 1: Anonymize Personal Data**
```sql
UPDATE users SET
  email = 'deleted-' || id || '@anonymized.local',
  full_name = 'Deleted User',
  phone = NULL,
  location = NULL,
  linkedin = NULL,
  website = NULL,
  profile_picture_url = NULL,
  deleted_at = NOW()
WHERE id = user_id;
```

**Step 2: Cascade Non-Essential Records**
- Delete: Resumes, cover letters, exports, parse reviews
- Delete: Enhancement requests, role recommendations
- Delete: Referral codes, user achievements
- Delete: User sessions, feature adoption data

**Step 3: Retain Minimal Audit Data**
- Preserve: Payment receipts (7 years - legal requirement)
- Preserve: Audit logs (anonymized user ID reference)
- Preserve: Aggregated analytics (no PII)

**Step 4: Write Deletion Audit Log**
```sql
INSERT INTO audit_logs (user_id, action, metadata) VALUES (
  user_id,
  'user_account_deleted',
  '{"reason": "user_request", "method": "anonymization", "cascade_count": 42}'
);
```

### Legal Holds

During active litigation or investigations, data under legal hold CANNOT be purged:

```sql
-- Check for legal hold before purge
SELECT * FROM legal_holds 
WHERE status = 'active'
  AND (user_id = ANY(affected_users) OR data_category = ANY(affected_data_categories));
```

**Legal hold properties**:
- Prevents all automated purges
- Blocks manual force-purge attempts
- Logged in audit trail
- Requires super admin approval to create/release

### Compliance Reporting

Automated compliance reports generated monthly:

**Report Types**:
1. **Retention Compliance**: Verifies all policies executed on schedule
2. **Purge Summary**: Total records purged, storage freed, errors
3. **Data Inventory**: Current data volumes per category

**Sample Compliance Report**:
```json
{
  "report_type": "retention_compliance",
  "period": "2025-10",
  "compliance_score": 98.5,
  "violations": [],
  "summary": {
    "policies_executed": 9,
    "total_records_purged": 45231,
    "storage_freed_gb": 12.4,
    "failed_purges": 3
  },
  "recommendations": [
    "Review failed purges for exports table",
    "Consider reducing retention for analytics_events"
  ]
}
```

### Security Considerations

1. **Service Role Access**: Purge functions use `SUPABASE_SERVICE_ROLE_KEY`
2. **RLS Bypass**: Service role bypasses RLS for system operations
3. **Audit Everything**: Every delete operation logged with full context
4. **Rate Limiting**: Cleanup jobs limited to 1000 records per batch
5. **Error Recovery**: Failed purges logged, retried on next run
6. **Dry Run Mode**: Test purges without actual deletion

### Testing Retention Policies

Run staged purge test:
```bash
npm run test:unit -- src/test/purge.test.ts
```

**Test validates**:
- Old data (>retention period) is purged
- Recent data (<retention period) is preserved
- Audit logs created for each deletion
- Before/after counts match expectations
- Generates `purge-run.log` with full metrics

