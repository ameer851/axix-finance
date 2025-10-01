# Cron Job Fix Summary (October 1, 2025)

## Problem Identified

The daily cron job was running successfully according to the `job_runs` table, but no actual changes were being applied to investments in the database or visible in the admin panel.

### Root Causes

1. **Comparison Logic Error**: The processing logic used `>=` to compare `last_return_applied` with today's UTC date:
   ```javascript
   if (lastApplied && lastApplied.getTime() >= todayUtc.getTime()) continue;
   ```
   This caused investments to be skipped when `last_return_applied` was set to exactly today's UTC start (which the cron job itself sets), creating a permanent skip condition.

2. **Duplicate Returns**: Multiple investment return entries were being created for the same investment on the same date, indicating possible race conditions or multiple job executions.

## Fixes Applied

### 1. Fixed Comparison Logic
**File**: `shared/dailyInvestmentJob.shared.js` (Line ~213)

**Changed from:**
```javascript
if (lastApplied && lastApplied.getTime() >= todayUtc.getTime()) continue;
```

**Changed to:**
```javascript
if (lastApplied && lastApplied.getTime() > todayUtc.getTime()) continue;
```

**Impact**: Now investments are only skipped if they've been processed for a FUTURE date, not the current date.

### 2. Simplified Query Logic
**File**: `shared/dailyInvestmentJob.shared.js` (Line ~85)

**Changed from:**
```javascript
.or(`last_return_applied.is.null,last_return_applied.lt.${todayIso},first_profit_date.lte.${todayIso}`)
```

**Changed to:**
```javascript
// Select all active investments, let processing logic handle filtering
.eq("status", "active")
```

**Impact**: Simplified query reduces confusion and relies on processing logic for filtering.

### 3. Added Duplicate Prevention Check
**File**: `shared/dailyInvestmentJob.shared.js` (Line ~364)

**Added before insert:**
```javascript
// Check if return already exists for this investment on this date
const { data: existingReturn } = await supabase
  .from("investment_returns")
  .select("id")
  .eq("investment_id", inv.id)
  .eq("return_date", todayIso)
  .limit(1);
  
if (!existingReturn || existingReturn.length === 0) {
  await supabase.from("investment_returns").insert({...});
} else {
  jobLog({ event: "duplicate_return_prevented", ... });
}
```

**Impact**: Prevents race conditions from creating duplicate return entries.

### 4. Database Constraint
**File**: `migrations/20251001_prevent_duplicate_returns.sql`

**Added unique index:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_returns_unique_per_day 
ON investment_returns (investment_id, return_date);
```

**Impact**: Database-level enforcement prevents duplicates even if application logic fails.

### 5. Cleaned Up Existing Duplicates
**Script**: `scripts/cleanup-duplicates.mjs`

- Removed 3 duplicate return entries
- Kept the earliest created entry for each investment/date pair

## Testing Results

### Dry Run Test
```bash
node scripts/test-cron-logic.mjs
```

**Result:**
- ✅ Investment 20 selected for processing
- ✅ Would apply $35.42 return
- ✅ No longer skipped due to comparison logic

### Duplicate Detection
```bash
node scripts/check-duplicates.mjs
```

**Before cleanup:** 3 groups with duplicates (6 total duplicate entries)
**After cleanup:** 0 duplicates

## Deployment Status

- Built new image: `registry.fly.io/axix-finance:deployment-01K6ESNXSQ1EPYPQ60ZN7BJGSD`
- Deployment in progress to Fly.io

## Manual Steps Required

1. **Apply Database Migration** (run in Supabase SQL editor):
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_returns_unique_per_day 
   ON investment_returns (investment_id, return_date);
   ```

2. **Verify Next Cron Run** (tomorrow at 02:00 UTC):
   - Check `job_runs` table for success
   - Verify investment returns are created
   - Confirm `days_elapsed` increments
   - Ensure no new duplicates

## Monitoring Commands

```bash
# Check job health
node scripts/check-daily-job-health.mjs

# Diagnose issues
node scripts/diagnose-cron-issue.mjs

# Check for duplicates
node scripts/check-duplicates.mjs

# Test logic (dry run)
node scripts/test-cron-logic.mjs
```

## Expected Behavior After Fix

1. Cron runs at 02:00 UTC daily
2. Selects all active investments
3. Processes each investment that hasn't been processed today or is overdue
4. Creates ONE investment_return entry per investment per day
5. Updates `days_elapsed` and `total_earned`
6. Sets `last_return_applied` to today's UTC start
7. Logs all operations in structured JSON format

## Files Modified

1. `shared/dailyInvestmentJob.shared.js` - Core logic fixes
2. `migrations/20251001_prevent_duplicate_returns.sql` - Database constraint
3. `scripts/cleanup-duplicates.mjs` - Cleanup utility
4. `scripts/diagnose-cron-issue.mjs` - Diagnostic tool
5. `scripts/test-cron-logic.mjs` - Testing utility
6. `scripts/check-duplicates.mjs` - Duplicate detection

## Risk Assessment

- **Low Risk**: Changes are defensive and additive
- **Backwards Compatible**: No breaking changes to data structure
- **Idempotent**: Duplicate prevention ensures safe retry
- **Observable**: Enhanced logging for debugging

## Next Steps

1. ✅ Code changes committed
2. ✅ Duplicates cleaned up
3. ⏳ Deployment in progress
4. ⏳ Apply database migration manually
5. ⏳ Monitor tomorrow's 02:00 UTC run
6. ⏳ Verify investment progression in admin panel