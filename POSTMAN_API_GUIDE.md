# Postman API Testing Guide

This guide provides all API endpoints ready to test in Postman.

## Base URL
```
http://localhost:3000
```

## Important Notes

⚠️ **Before Testing:**
1. Make sure your server is running (`npm run dev`)
2. You'll need valid `userId` values (UUIDs) - you can create users directly in the database or use any UUID format
3. Replace `{userId}` and `{subscriptionId}` with actual IDs from your database

---

## 1. Health Check

### GET Health Check
```
GET http://localhost:3000/health
```

**Headers:** None required

**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## 2. Chat Module APIs

### 2.1 Send a Chat Message

**Method:** `POST`  
**URL:** `http://localhost:3000/api/chat/users/{userId}/messages`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "question": "What is artificial intelligence?"
}
```

**Example with actual userId:**
```
POST http://localhost:3000/api/chat/users/123e4567-e89b-12d3-a456-426614174000/messages
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid-here",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "question": "What is artificial intelligence?",
  "answer": "This is a mocked response to: \"What is artificial intelligence?\"...",
  "tokens": 45,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (403 Forbidden) - Quota Exceeded:**
```json
{
  "error": {
    "message": "Valid subscription required. Free quota exhausted.",
    "statusCode": 403
  }
}
```

---

### 2.2 Get Message History

**Method:** `GET`  
**URL:** `http://localhost:3000/api/chat/users/{userId}/messages?limit=50`

**Headers:** None required

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50)

**Example:**
```
GET http://localhost:3000/api/chat/users/123e4567-e89b-12d3-a456-426614174000/messages?limit=10
```

**Expected Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "uuid-here",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "question": "What is AI?",
      "answer": "Mocked response...",
      "tokens": 45,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2.3 Get Message by ID

**Method:** `GET`  
**URL:** `http://localhost:3000/api/chat/messages/{messageId}`

**Headers:** None required

**Example:**
```
GET http://localhost:3000/api/chat/messages/123e4567-e89b-12d3-a456-426614174001
```

**Expected Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "question": "What is AI?",
  "answer": "Mocked response...",
  "tokens": 45,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": {
    "message": "Message not found",
    "statusCode": 404
  }
}
```

---

## 3. Subscription Module APIs

### 3.1 Create Subscription

**Method:** `POST`  
**URL:** `http://localhost:3000/api/subscriptions/users/{userId}/subscriptions`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**

**Basic Monthly Subscription:**
```json
{
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

**Pro Yearly Subscription:**
```json
{
  "tier": "Pro",
  "billingCycle": "yearly",
  "autoRenew": false
}
```

**Enterprise Monthly Subscription:**
```json
{
  "tier": "Enterprise",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

**Valid Values:**
- `tier`: `"Basic"`, `"Pro"`, `"Enterprise"`
- `billingCycle`: `"monthly"`, `"yearly"`
- `autoRenew`: `true`, `false`

**Example:**
```
POST http://localhost:3000/api/subscriptions/users/123e4567-e89b-12d3-a456-426614174000/subscriptions
```

**Expected Response (201 Created):**
```json
{
  "id": "uuid-here",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "tier": "Basic",
  "billingCycle": "monthly",
  "maxMessages": 10,
  "remainingMessages": 10,
  "price": 9.99,
  "startDate": "2024-01-15T10:30:00.000Z",
  "endDate": "2024-02-15T10:30:00.000Z",
  "renewalDate": "2024-02-15T10:30:00.000Z",
  "autoRenew": true,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (400 Bad Request) - Invalid Tier:**
```json
{
  "error": {
    "message": "Invalid tier. Must be one of: Basic, Pro, Enterprise",
    "statusCode": 400
  }
}
```

**Error Response (404 Not Found) - User Not Found:**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 404
  }
}
```

---

### 3.2 Get All User Subscriptions

**Method:** `GET`  
**URL:** `http://localhost:3000/api/subscriptions/users/{userId}/subscriptions`

**Headers:** None required

**Example:**
```
GET http://localhost:3000/api/subscriptions/users/123e4567-e89b-12d3-a456-426614174000/subscriptions
```

**Expected Response (200 OK):**
```json
{
  "subscriptions": [
    {
      "id": "uuid-here",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "tier": "Basic",
      "billingCycle": "monthly",
      "maxMessages": 10,
      "remainingMessages": 8,
      "price": 9.99,
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-02-15T10:30:00.000Z",
      "renewalDate": "2024-02-15T10:30:00.000Z",
      "autoRenew": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3.3 Get Active Subscriptions Only

**Method:** `GET`  
**URL:** `http://localhost:3000/api/subscriptions/users/{userId}/subscriptions/active`

**Headers:** None required

**Example:**
```
GET http://localhost:3000/api/subscriptions/users/123e4567-e89b-12d3-a456-426614174000/subscriptions/active
```

**Expected Response (200 OK):**
```json
{
  "subscriptions": [
    {
      "id": "uuid-here",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "tier": "Basic",
      "billingCycle": "monthly",
      "maxMessages": 10,
      "remainingMessages": 8,
      "price": 9.99,
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-02-15T10:30:00.000Z",
      "renewalDate": "2024-02-15T10:30:00.000Z",
      "autoRenew": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3.4 Get Subscription by ID

**Method:** `GET`  
**URL:** `http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}`

**Headers:** None required

**Example:**
```
GET http://localhost:3000/api/subscriptions/subscriptions/123e4567-e89b-12d3-a456-426614174002
```

**Expected Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "tier": "Basic",
  "billingCycle": "monthly",
  "maxMessages": 10,
  "remainingMessages": 8,
  "price": 9.99,
  "startDate": "2024-01-15T10:30:00.000Z",
  "endDate": "2024-02-15T10:30:00.000Z",
  "renewalDate": "2024-02-15T10:30:00.000Z",
  "autoRenew": true,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": {
    "message": "Subscription not found",
    "statusCode": 404
  }
}
```

---

### 3.5 Cancel Subscription

**Method:** `PATCH`  
**URL:** `http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}/cancel`

**Headers:** None required

**Body:** None required

**Example:**
```
PATCH http://localhost:3000/api/subscriptions/subscriptions/123e4567-e89b-12d3-a456-426614174002/cancel
```

**Expected Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "tier": "Basic",
  "billingCycle": "monthly",
  "maxMessages": 10,
  "remainingMessages": 8,
  "price": 9.99,
  "startDate": "2024-01-15T10:30:00.000Z",
  "endDate": "2024-02-15T10:30:00.000Z",
  "renewalDate": null,
  "autoRenew": false,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "message": "Subscription cancelled. It will remain active until the end of the billing cycle."
}
```

---

### 3.6 Toggle Auto-Renew

**Method:** `PATCH`  
**URL:** `http://localhost:3000/api/subscriptions/subscriptions/{subscriptionId}/auto-renew`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**

**Enable Auto-Renew:**
```json
{
  "autoRenew": true
}
```

**Disable Auto-Renew:**
```json
{
  "autoRenew": false
}
```

**Example:**
```
PATCH http://localhost:3000/api/subscriptions/subscriptions/123e4567-e89b-12d3-a456-426614174002/auto-renew
```

**Expected Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "tier": "Basic",
  "billingCycle": "monthly",
  "maxMessages": 10,
  "remainingMessages": 8,
  "price": 9.99,
  "startDate": "2024-01-15T10:30:00.000Z",
  "endDate": "2024-02-15T10:30:00.000Z",
  "renewalDate": "2024-02-15T10:30:00.000Z",
  "autoRenew": true,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": {
    "message": "autoRenew must be a boolean value",
    "statusCode": 400
  }
}
```

---

## Testing Workflow Example

Here's a complete testing workflow you can follow:

### Step 1: Health Check
```
GET http://localhost:3000/health
```
✅ Verify server is running

### Step 2: Create a Test User (in database)
You'll need a user ID. You can:
- Create a user directly in PostgreSQL
- Or use any UUID format like: `123e4567-e89b-12d3-a456-426614174000`

### Step 3: Send First Chat Message (Free Quota)
```
POST http://localhost:3000/api/chat/users/{userId}/messages
Body: { "question": "Hello, what is AI?" }
```
✅ Should succeed (1/3 free messages used)

### Step 4: Send 2 More Messages
```
POST http://localhost:3000/api/chat/users/{userId}/messages
Body: { "question": "Second question" }

POST http://localhost:3000/api/chat/users/{userId}/messages
Body: { "question": "Third question" }
```
✅ Should succeed (3/3 free messages used)

### Step 5: Try 4th Message (Should Fail)
```
POST http://localhost:3000/api/chat/users/{userId}/messages
Body: { "question": "Fourth question" }
```
❌ Should return 403 error: "Valid subscription required"

### Step 6: Create Subscription
```
POST http://localhost:3000/api/subscriptions/users/{userId}/subscriptions
Body: {
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}
```
✅ Should create subscription with 10 remaining messages

### Step 7: Send Message Again (Uses Subscription)
```
POST http://localhost:3000/api/chat/users/{userId}/messages
Body: { "question": "Now with subscription" }
```
✅ Should succeed (deducted from subscription quota)

### Step 8: Check Subscription Status
```
GET http://localhost:3000/api/subscriptions/users/{userId}/subscriptions/active
```
✅ Should show subscription with 9 remaining messages

### Step 9: Get Message History
```
GET http://localhost:3000/api/chat/users/{userId}/messages
```
✅ Should show all 4 messages

---

## Quick Reference: All Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/chat/users/:userId/messages` | Send chat message |
| GET | `/api/chat/users/:userId/messages` | Get message history |
| GET | `/api/chat/messages/:messageId` | Get message by ID |
| POST | `/api/subscriptions/users/:userId/subscriptions` | Create subscription |
| GET | `/api/subscriptions/users/:userId/subscriptions` | Get all subscriptions |
| GET | `/api/subscriptions/users/:userId/subscriptions/active` | Get active subscriptions |
| GET | `/api/subscriptions/subscriptions/:subscriptionId` | Get subscription by ID |
| PATCH | `/api/subscriptions/subscriptions/:subscriptionId/cancel` | Cancel subscription |
| PATCH | `/api/subscriptions/subscriptions/:subscriptionId/auto-renew` | Toggle auto-renew |

---

## Creating a Test User

If you need to create a user in the database, you can run this SQL:

```sql
INSERT INTO users (id, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  NOW(),
  NOW()
)
RETURNING id, email;
```

Then use the returned `id` as `{userId}` in your API calls.

---

## Common Issues

### Issue: "User not found" error
**Solution:** Make sure the userId exists in the database. Create a user first or use a valid UUID.

### Issue: "Valid subscription required" error
**Solution:** User has exhausted free quota (3 messages). Create a subscription to continue.

### Issue: Connection refused
**Solution:** Make sure the server is running with `npm run dev`

### Issue: Database connection error
**Solution:** Check your `.env` file and ensure PostgreSQL is running.

---

## Postman Collection Import

You can create a Postman collection with these endpoints. Here's a quick way:

1. Open Postman
2. Click "Import"
3. Create a new collection called "AI Chat API"
4. Add each endpoint manually using the details above
5. Set up environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `userId`: Your test user ID
   - `subscriptionId`: Subscription ID (get from create subscription response)

Then use `{{baseUrl}}/api/chat/users/{{userId}}/messages` format in Postman.

