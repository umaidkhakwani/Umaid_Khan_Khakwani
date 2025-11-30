# Testing Guide: Auto-Renewal, Payment Failures, and Cancellation

This guide explains how to test the subscription features: auto-renewal, payment failure simulation, and cancellation.

## Table of Contents

1. [Testing Auto-Renewal](#testing-auto-renewal)
2. [Testing Payment Failures](#testing-payment-failures)
3. [Testing Cancellation](#testing-cancellation)
4. [Verifying Usage History Preservation](#verifying-usage-history-preservation)
5. [Quick Test Scenarios](#quick-test-scenarios)

---

## Testing Auto-Renewal

### How Auto-Renewal Works

- Subscriptions with `autoRenew: true` automatically renew when `renewalDate <= current date`
- The renewal job runs every hour
- On renewal: creates a new subscription period and deactivates the old one
- Payment is simulated with 90% success rate

### Method 1: Manual Date Manipulation (Recommended for Testing)

**Step 1: Create a subscription with auto-renew**

```bash
POST http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
Content-Type: application/json

{
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

**Step 2: Check the subscription**

```bash
GET http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}
```

Note the `renewalDate` - this is when it will auto-renew.

**Step 3: Manually update renewal date in database**

To test immediately, update the subscription in PostgreSQL:

```sql
-- Update renewal date to past date to trigger renewal
UPDATE subscription_bundles
SET renewal_date = NOW() - INTERVAL '1 day'
WHERE id = '{subscriptionId}';
```

**Step 4: Trigger renewal job manually**

You can either:
- Wait for the hourly job to run, OR
- Restart the server (renewal job runs on startup), OR
- Create a test endpoint (see below)

**Step 5: Verify renewal**

```bash
GET http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
```

You should see:
- Old subscription: `isActive: false`
- New subscription: `isActive: true` with new dates and full quota

---

### Method 2: Use Test Endpoints (Easier - Available in Development Mode)

I've added test endpoints that make testing much easier:

**Step 1: Create subscription with auto-renew**

```bash
POST http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
Content-Type: application/json

{
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

Save the `subscriptionId` from the response.

**Step 2: Set renewal date to past (using test endpoint)**

```bash
PATCH http://localhost:3000/api/test/subscriptions/{subscriptionId}/set-renewal-past?days=1
```

This sets the renewal date to 1 day ago, triggering immediate renewal.

**Step 3: Manually trigger renewal job**

```bash
GET http://localhost:3000/api/test/renewals/process
```

**Step 4: Check subscriptions**

```bash
GET http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
```

You should see:
- Old subscription: `isActive: false`
- New subscription: `isActive: true` with new dates and full quota

---

## Testing Payment Failures

### How Payment Failures Work

- When a subscription renews, payment is simulated
- 10% chance of payment failure (random)
- If payment fails: subscription is deactivated (`isActive: false`)
- If payment succeeds: new subscription period is created

### Testing Payment Failures

**Option 1: Run Multiple Times (Natural Random)**

Since it's random, you may need to test multiple times:

1. Create subscription with auto-renew
2. Set renewal date to past
3. Trigger renewal multiple times until you get a failure
4. Check that subscription is deactivated

**Option 2: Use Test Endpoints (Recommended)**

Use the test endpoints to easily test payment failures:

**Step 1: Create subscription**

```bash
POST http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
Content-Type: application/json

{
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

**Step 2: Update renewal date to past**

```sql
UPDATE subscription_bundles
SET renewal_date = NOW() - INTERVAL '1 day'
WHERE id = '{subscriptionId}';
```

**Step 3: Trigger renewal (may need multiple attempts)**

The renewal job will process it. Check the result:

```bash
GET http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}
```

**Expected Results:**
- **Success (90% chance)**: New subscription created, old one deactivated
- **Failure (10% chance)**: Subscription deactivated, no new subscription created

---

## Testing Cancellation

### How Cancellation Works

- Sets `autoRenew: false`
- Sets `renewalDate: null`
- Keeps `isActive: true` (remains active until `endDate`)
- Preserves all usage history

### Test Steps

**Step 1: Create subscription**

```bash
POST http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
Content-Type: application/json

{
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

Save the `subscriptionId` from the response.

**Step 2: Use some messages**

```bash
POST http://localhost:3000/api/chat/users/{userId}/messages
Content-Type: application/json

{
  "question": "Test message 1"
}
```

Repeat 2-3 times to use some quota.

**Step 3: Check subscription before cancellation**

```bash
GET http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}
```

Note:
- `autoRenew: true`
- `renewalDate: {some date}`
- `remainingMessages: {some number}`

**Step 4: Cancel subscription**

```bash
PATCH http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}/cancel
```

**Step 5: Verify cancellation**

```bash
GET http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}
```

**Expected Result:**
```json
{
  "id": "{subscriptionId}",
  "autoRenew": false,        // ✅ Changed to false
  "renewalDate": null,       // ✅ Set to null
  "isActive": true,          // ✅ Still active
  "remainingMessages": 7,    // ✅ Preserved
  "endDate": "2024-02-15..." // ✅ Still valid until end date
}
```

**Step 6: Verify it won't renew**

1. Update renewal date to past (if it was set):
```sql
UPDATE subscription_bundles
SET renewal_date = NOW() - INTERVAL '1 day'
WHERE id = '{subscriptionId}';
```

2. Trigger renewal job
3. Check subscription again

**Expected Result:**
- Subscription remains unchanged (won't renew because `autoRenew: false`)

---

## Verifying Usage History Preservation

### Test: Usage History After Cancellation

**Step 1: Create subscription and use messages**

```bash
# Create subscription
POST http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
{
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}

# Send 3 messages (uses subscription quota)
POST http://localhost:3000/api/chat/users/{userId}/messages
{"question": "Message 1"}

POST http://localhost:3000/api/chat/users/{userId}/messages
{"question": "Message 2"}

POST http://localhost:3000/api/chat/users/{userId}/messages
{"question": "Message 3"}
```

**Step 2: Check message history**

```bash
GET http://localhost:3000/api/chat/users/{userId}/messages
```

You should see 3 messages.

**Step 3: Cancel subscription**

```bash
PATCH http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}/cancel
```

**Step 4: Verify messages still exist**

```bash
GET http://localhost:3000/api/chat/users/{userId}/messages
```

**Expected Result:**
- ✅ All 3 messages still visible
- ✅ Messages are not deleted
- ✅ Usage history is preserved

**Step 5: Check subscription status**

```bash
GET http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}
```

**Expected Result:**
- ✅ Subscription shows `remainingMessages: 7` (10 - 3 = 7)
- ✅ Subscription is still active until `endDate`
- ✅ `autoRenew: false`

---

## Quick Test Scenarios

### Scenario 1: Complete Auto-Renewal Flow (Using Test Endpoints)

```bash
# 1. Create subscription
POST /api/subscriptions/users/{userId}/subscriptions
{"tier": "Basic", "billingCycle": "monthly", "autoRenew": true}

# 2. Get subscription ID from response
# 3. Set renewal date to past (using test endpoint)
PATCH /api/test/subscriptions/{subscriptionId}/set-renewal-past?days=1

# 4. Trigger renewal manually
GET /api/test/renewals/process

# 5. Check subscriptions
GET /api/subscriptions/users/{userId}/subscriptions

# Expected: Old subscription (isActive: false), New subscription (isActive: true)
```

### Scenario 2: Payment Failure (Using Test Endpoints)

```bash
# 1. Create subscription
POST /api/subscriptions/users/{userId}/subscriptions
{"tier": "Pro", "billingCycle": "monthly", "autoRenew": true}

# 2. Set renewal date to past
PATCH /api/test/subscriptions/{subscriptionId}/set-renewal-past?days=1

# 3. Trigger renewal (may need multiple attempts - 10% failure rate)
GET /api/test/renewals/process

# 4. Check subscription
GET /api/subscriptions/subscriptions/{subscriptionId}

# Expected (on failure): isActive: false, no new subscription created
# Expected (on success): New subscription created, old one deactivated

# Tip: Run step 3 multiple times until you get a failure (10% chance)
```

### Scenario 3: Cancellation Prevents Renewal (Using Test Endpoints)

```bash
# 1. Create subscription
POST /api/subscriptions/users/{userId}/subscriptions
{"tier": "Basic", "billingCycle": "monthly", "autoRenew": true}

# 2. Cancel it
PATCH /api/subscriptions/subscriptions/{subscriptionId}/cancel

# 3. Verify cancellation
GET /api/subscriptions/subscriptions/{subscriptionId}
# Expected: autoRenew: false, renewalDate: null

# 4. Set renewal date to past (even though cancelled)
PATCH /api/test/subscriptions/{subscriptionId}/set-renewal-past?days=1

# 5. Trigger renewal
GET /api/test/renewals/process

# 6. Check again
GET /api/subscriptions/subscriptions/{subscriptionId}

# Expected: Subscription unchanged (won't renew because autoRenew: false)
```

### Scenario 4: Usage History After Cancellation

```bash
# 1. Create subscription and use it
POST /api/subscriptions/users/{userId}/subscriptions
POST /api/chat/users/{userId}/messages (3 times)

# 2. Check history
GET /api/chat/users/{userId}/messages
# Expected: 3 messages

# 3. Cancel subscription
PATCH /api/subscriptions/subscriptions/{id}/cancel

# 4. Check history again
GET /api/chat/users/{userId}/messages
# Expected: Still 3 messages (preserved)
```

---

## Test Endpoints Available

The following test endpoints are available in **development mode only**:

### 1. Process Renewals Manually
```
GET http://localhost:3000/api/test/renewals/process
```
Triggers the renewal job immediately (processes all subscriptions due for renewal).

### 2. Set Renewal Date to Past
```
PATCH http://localhost:3000/api/test/subscriptions/{subscriptionId}/set-renewal-past?days=1
```
Sets the renewal date to N days ago (default: 1 day). This makes the subscription eligible for immediate renewal.

**Query Parameters:**
- `days` (optional): Number of days ago (default: 1)

### 3. Get Subscription Details with Usage
```
GET http://localhost:3000/api/test/subscriptions/{subscriptionId}/details
```
Returns subscription details along with usage statistics (total messages sent).

**Note:** These endpoints are only available when `NODE_ENV=development` in your `.env` file.

---

## Database Queries for Testing

### Check All Subscriptions for a User

```sql
SELECT 
  id,
  tier,
  is_active,
  auto_renew,
  renewal_date,
  remaining_messages,
  start_date,
  end_date
FROM subscription_bundles
WHERE user_id = '{userId}'
ORDER BY created_at DESC;
```

### Check Monthly Usage

```sql
SELECT 
  user_id,
  year,
  month,
  message_count,
  last_reset_date
FROM monthly_usage
WHERE user_id = '{userId}'
ORDER BY year DESC, month DESC;
```

### Check Chat Messages

```sql
SELECT 
  id,
  user_id,
  question,
  tokens,
  created_at
FROM chat_messages
WHERE user_id = '{userId}'
ORDER BY created_at DESC;
```

### Force Renewal Date (for testing)

```sql
-- Set renewal date to past (triggers renewal)
UPDATE subscription_bundles
SET renewal_date = NOW() - INTERVAL '1 day'
WHERE id = '{subscriptionId}';

-- Set renewal date to future (prevents renewal)
UPDATE subscription_bundles
SET renewal_date = NOW() + INTERVAL '1 month'
WHERE id = '{subscriptionId}';
```

---

## Tips for Testing

1. **Use a test user**: Create a dedicated test user for subscription testing
2. **Check logs**: The server logs show when renewals are processed
3. **Database inspection**: Use SQL queries to verify state changes
4. **Multiple attempts**: For payment failures, you may need to test multiple times (10% chance)
5. **Date manipulation**: Update `renewal_date` in database to test renewals immediately

---

## Expected Behaviors Summary

| Action | Auto-Renew | Renewal Date | Is Active | New Subscription |
|--------|-----------|--------------|-----------|------------------|
| **Normal Renewal (Success)** | true | Past | Old: false<br>New: true | ✅ Created |
| **Renewal (Payment Failed)** | true | Past | false | ❌ Not created |
| **Cancelled** | false | null | true (until endDate) | ❌ Won't renew |
| **Cancelled + Past Renewal** | false | null/past | true (until endDate) | ❌ Won't renew |

---

## Next Steps

1. Test auto-renewal using the steps above
2. Test payment failures (may need multiple attempts)
3. Test cancellation and verify it prevents renewal
4. Verify usage history is preserved after cancellation

If you want me to add test endpoints to make this easier, let me know!

