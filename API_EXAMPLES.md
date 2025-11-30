# API Usage Examples

This document provides examples of how to use the AI Chat and Subscription Bundle API.

## Prerequisites

Before using the API, you need to create a user. For this example, we'll assume you have a user with ID `user-123`.

## Chat Module Examples

### 1. Send a Chat Message

```bash
POST http://localhost:3000/api/chat/users/user-123/messages
Content-Type: application/json

{
  "question": "What is artificial intelligence?"
}
```

**Response (201 Created):**
```json
{
  "id": "msg-456",
  "userId": "user-123",
  "question": "What is artificial intelligence?",
  "answer": "This is a mocked response to: \"What is artificial intelligence?\". In a real implementation, this would be an AI-generated answer.",
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

### 2. Get Message History

```bash
GET http://localhost:3000/api/chat/users/user-123/messages?limit=10
```

**Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "msg-456",
      "userId": "user-123",
      "question": "What is artificial intelligence?",
      "answer": "This is a mocked response...",
      "tokens": 45,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Get Message by ID

```bash
GET http://localhost:3000/api/chat/messages/msg-456
```

## Subscription Module Examples

### 1. Create a Basic Monthly Subscription

```bash
POST http://localhost:3000/api/subscriptions/users/user-123/subscriptions
Content-Type: application/json

{
  "tier": "Basic",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

**Response (201 Created):**
```json
{
  "id": "sub-789",
  "userId": "user-123",
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

### 2. Create a Pro Yearly Subscription

```bash
POST http://localhost:3000/api/subscriptions/users/user-123/subscriptions
Content-Type: application/json

{
  "tier": "Pro",
  "billingCycle": "yearly",
  "autoRenew": false
}
```

### 3. Create an Enterprise Subscription

```bash
POST http://localhost:3000/api/subscriptions/users/user-123/subscriptions
Content-Type: application/json

{
  "tier": "Enterprise",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

### 4. Get All User Subscriptions

```bash
GET http://localhost:3000/api/subscriptions/users/user-123/subscriptions
```

**Response (200 OK):**
```json
{
  "subscriptions": [
    {
      "id": "sub-789",
      "userId": "user-123",
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

### 5. Get Active Subscriptions Only

```bash
GET http://localhost:3000/api/subscriptions/users/user-123/subscriptions/active
```

### 6. Get Subscription by ID

```bash
GET http://localhost:3000/api/subscriptions/subscriptions/sub-789
```

### 7. Cancel a Subscription

```bash
PATCH http://localhost:3000/api/subscriptions/subscriptions/sub-789/cancel
```

**Response (200 OK):**
```json
{
  "id": "sub-789",
  "userId": "user-123",
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

### 8. Toggle Auto-Renew

```bash
PATCH http://localhost:3000/api/subscriptions/subscriptions/sub-789/auto-renew
Content-Type: application/json

{
  "autoRenew": true
}
```

## Health Check

```bash
GET http://localhost:3000/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "error": {
    "message": "Invalid tier. Must be one of: Basic, Pro, Enterprise",
    "statusCode": 400
  }
}
```

### Quota Exceeded (403)
```json
{
  "error": {
    "message": "Quota exceeded. Please upgrade your subscription.",
    "statusCode": 403
  }
}
```

### Not Found (404)
```json
{
  "error": {
    "message": "Subscription not found",
    "statusCode": 404
  }
}
```

## Usage Flow Example

1. **User sends first message** (uses free quota)
   ```bash
   POST /api/chat/users/user-123/messages
   {"question": "Hello"}
   ```

2. **User sends 2 more messages** (still within free quota of 3)

3. **User sends 4th message** (free quota exhausted, needs subscription)
   - Returns 403 error: "Valid subscription required. Free quota exhausted."

4. **User creates Basic subscription**
   ```bash
   POST /api/subscriptions/users/user-123/subscriptions
   {"tier": "Basic", "billingCycle": "monthly", "autoRenew": true}
   ```

5. **User can now send messages** (deducted from subscription quota)

6. **On the 1st of next month**, free quota automatically resets to 3 messages

