# AI Chat and Subscription Bundle API

A RESTful API built with TypeScript, Express, and PostgreSQL following Domain-Driven Design (DDD) and Clean Architecture principles. This API provides AI chat functionality with subscription-based quota management.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Project Structure & Module Descriptions](#project-structure--module-descriptions)
- [Workflows](#workflows)
- [Installation & Setup](#installation--setup)
- [API Endpoints](#api-endpoints)
- [Examples](#examples)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)

## Features

### Module 1: AI Chat Module
- Accepts user questions and returns mocked OpenAI responses
- Stores questions, answers, and tokens in the database
- Tracks monthly usage per user (3 free messages per month)
- Supports multiple subscription tiers (Basic, Pro, Enterprise)
- Auto-resets free quota on the 1st of each month
- Simulates OpenAI API response delay (1-3 seconds)

### Module 2: Subscription Bundle Module
- Create subscription bundles (Basic, Pro, Enterprise)
- Choose billing cycle (monthly or yearly)
- Toggle auto-renewal
- Simulate billing logic with random payment failures (10% failure rate)
- Support subscription cancellation
- Preserve usage history

## Architecture Overview

The project follows **Clean Architecture** with **Domain-Driven Design (DDD)** principles, organized in layers:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Controllers, Routes, Middleware)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Services - Business Logic)            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Domain Layer                    │
│  (Entities - Core Business Rules)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Infrastructure Layer            │
│  (Repositories - Data Access)           │
└─────────────────────────────────────────┘
```

## Project Structure & Module Descriptions

### 📁 `src/domain/entities/` - Domain Layer

**Purpose**: Contains pure business logic entities with no dependencies on external frameworks.

#### `User.ts`
- Represents a user in the system
- Contains: `id`, `email`, `createdAt`, `updatedAt`
- **Methods**: `create()` - Factory method to create new user instances

#### `ChatMessage.ts`
- Represents a chat message exchange
- Contains: `id`, `userId`, `question`, `answer`, `tokens`, `createdAt`
- **Methods**: `create()` - Factory method for creating chat messages

#### `SubscriptionBundle.ts`
- Represents a subscription bundle with quota management
- Contains: `id`, `userId`, `tier`, `billingCycle`, `maxMessages`, `remainingMessages`, `price`, `startDate`, `endDate`, `renewalDate`, `autoRenew`, `isActive`
- **Key Methods**:
  - `canUse()` - Checks if subscription is active and has quota
  - `useMessage()` - Deducts one message from quota (returns new instance)
  - `cancel()` - Cancels auto-renewal (returns new instance)
  - `deactivate()` - Marks subscription as inactive (returns new instance)

#### `MonthlyUsage.ts`
- Tracks monthly free quota usage per user
- Contains: `id`, `userId`, `year`, `month`, `messageCount`, `lastResetDate`
- **Key Methods**:
  - `increment()` - Increments message count (returns new instance)
  - `reset()` - Resets usage for new month (returns new instance)

### 📁 `src/config/` - Configuration Layer

#### `database.ts`
- **Purpose**: Database connection configuration and query helper
- **Features**:
  - Supports both `DATABASE_URL` and individual environment variables
  - Creates PostgreSQL connection pool
  - Provides `query()` helper function with logging
  - Handles connection errors gracefully

**How it works**:
```typescript
// Supports DATABASE_URL format:
DATABASE_URL=postgresql://user:password@host:port/database

// Or individual variables:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myappdb
DB_USER=postgres
DB_PASSWORD=password
```

#### `migrations.ts`
- **Purpose**: Database schema migration system
- **How it works**:
  1. Creates `schema_migrations` table to track applied migrations
  2. Reads SQL files from `migrations/` directory in order
  3. Executes migrations that haven't been applied yet
  4. Records each migration version in `schema_migrations` table
  5. Runs automatically on server startup

**Migration Files** (in order):
- `001_create_users_table.sql` - Creates users table
- `002_create_chat_messages_table.sql` - Creates chat_messages table
- `003_create_subscription_bundles_table.sql` - Creates subscription_bundles table
- `004_create_monthly_usage_table.sql` - Creates monthly_usage table

### 📁 `src/chat/` - AI Chat Module

#### `repositories/`
- **`ChatMessageRepository.ts`**: Data access for chat messages
  - `create()` - Saves new chat message
  - `findByUserId()` - Gets user's message history
  - `findById()` - Gets specific message by ID

- **`MonthlyUsageRepository.ts`**: Data access for monthly usage tracking
  - `findByUserIdAndMonth()` - Gets usage for specific user/month
  - `create()` - Creates new monthly usage record
  - `update()` - Updates existing usage record
  - `findForAutoReset()` - Finds records that need monthly reset

#### `services/`
- **`ChatService.ts`**: Core business logic for chat functionality
  - **`sendMessage()` Workflow**:
    1. Gets or creates monthly usage record for current month
    2. Checks if user has free quota available (3 messages/month)
    3. If free quota exhausted:
       - Finds active subscription bundles with remaining quota
       - Uses bundle with latest remaining quota
       - Deducts from bundle quota
    4. Simulates OpenAI API delay (1-3 seconds)
    5. Generates mock response
    6. Saves message to database
    7. Returns chat message

  - **`getMessageHistory()`**: Retrieves user's chat history
  - **`getMessageById()`**: Retrieves specific message

- **`UsageResetService.ts`**: Handles monthly quota reset
  - **`resetMonthlyUsageIfNeeded()` Workflow**:
    1. Checks if current day is the 1st of the month
    2. Finds all usage records from previous months
    3. For each user, creates/updates record for current month with count = 0
    4. Runs automatically via scheduled job

#### `controllers/`
- **`ChatController.ts`**: HTTP request/response handling
  - `sendMessage` - POST endpoint handler
  - `getMessageHistory` - GET endpoint handler
  - `getMessageById` - GET endpoint handler
  - Validates input and handles errors

#### `routes/`
- **`chatRoutes.ts`**: Defines REST API routes
  - `POST /api/chat/users/:userId/messages` - Send message
  - `GET /api/chat/users/:userId/messages` - Get history
  - `GET /api/chat/messages/:messageId` - Get message by ID

### 📁 `src/subscriptions/` - Subscription Module

#### `repositories/`
- **`SubscriptionBundleRepository.ts`**: Data access for subscriptions
  - `create()` - Creates new subscription
  - `findByUserId()` - Gets all user subscriptions
  - `findActiveByUserId()` - Gets active subscriptions only
  - `findActiveWithRemainingQuota()` - Gets active subscriptions with quota
  - `findDueForRenewal()` - Gets subscriptions due for auto-renewal
  - `findById()` - Gets subscription by ID
  - `update()` - Updates subscription

- **`UserRepository.ts`**: Data access for users
  - `findById()` - Gets user by ID
  - `findByEmail()` - Gets user by email
  - `create()` - Creates new user

#### `services/`
- **`SubscriptionService.ts`**: Core business logic for subscriptions
  - **`createSubscription()` Workflow**:
    1. Validates user exists
    2. Gets tier configuration (Basic/Pro/Enterprise)
    3. Calculates start/end dates based on billing cycle
    4. Calculates price (yearly = monthly × 10)
    5. Creates subscription bundle with full quota
    6. Sets renewal date if auto-renew is enabled
    7. Saves to database

  - **`processAutoRenewals()` Workflow**:
    1. Finds subscriptions due for renewal (renewalDate <= now)
    2. For each subscription:
       - Simulates payment (10% failure rate)
       - If payment succeeds: Creates new subscription period
       - If payment fails: Deactivates subscription
    3. Runs automatically via scheduled job

  - **`cancelSubscription()`**: Cancels auto-renewal, keeps subscription active until end date
  - **`toggleAutoRenew()`**: Enables/disables auto-renewal

#### `controllers/`
- **`SubscriptionController.ts`**: HTTP request/response handling
  - `createSubscription` - POST endpoint handler
  - `getUserSubscriptions` - GET endpoint handler
  - `getActiveSubscriptions` - GET endpoint handler
  - `getSubscriptionById` - GET endpoint handler
  - `cancelSubscription` - PATCH endpoint handler
  - `toggleAutoRenew` - PATCH endpoint handler

#### `routes/`
- **`subscriptionRoutes.ts`**: Defines REST API routes
  - `POST /api/subscriptions/users/:userId/subscriptions` - Create subscription
  - `GET /api/subscriptions/users/:userId/subscriptions` - Get all subscriptions
  - `GET /api/subscriptions/users/:userId/subscriptions/active` - Get active subscriptions
  - `GET /api/subscriptions/subscriptions/:subscriptionId` - Get subscription by ID
  - `PATCH /api/subscriptions/subscriptions/:subscriptionId/cancel` - Cancel subscription
  - `PATCH /api/subscriptions/subscriptions/:subscriptionId/auto-renew` - Toggle auto-renew

### 📁 `src/shared/` - Shared Utilities

#### `errors/`
- **`AppError.ts`**: Base error class and custom error types
  - `AppError` - Base error class with status code
  - `QuotaExceededError` (403) - Thrown when quota is exhausted
  - `SubscriptionRequiredError` (403) - Thrown when subscription needed
  - `NotFoundError` (404) - Thrown when resource not found
  - `ValidationError` (400) - Thrown for invalid input

#### `middleware/`
- **`errorHandler.ts`**: Global error handling middleware
  - Catches all errors from controllers
  - Formats error responses consistently
  - Logs unexpected errors

#### `types/`
- **`index.ts`**: Shared type definitions and constants
  - `SubscriptionTier` enum (Basic, Pro, Enterprise)
  - `BillingCycle` enum (monthly, yearly)
  - `SUBSCRIPTION_TIERS` - Configuration for each tier
  - `FREE_MESSAGES_PER_MONTH` - Constant (3)

### 📁 `src/jobs/` - Background Jobs

#### `renewalJob.ts`
- **Purpose**: Scheduled background job for maintenance tasks
- **Tasks**:
  1. Processes auto-renewals for subscriptions
  2. Resets monthly usage quotas on 1st of month
- **Schedule**: Runs every hour (configurable)
- **How it works**:
  - Starts automatically when server starts
  - Runs immediately on startup
  - Then runs every 60 minutes
  - In production, should use proper cron scheduler

### 📁 `src/index.ts` - Application Entry Point

**Purpose**: Initializes and starts the Express server

**Startup Sequence**:
1. Loads environment variables from `.env`
2. Configures Express middleware (helmet, cors, json parser)
3. Sets up routes
4. Configures error handling middleware
5. Runs database migrations
6. Starts renewal job
7. Starts HTTP server on configured port

## Workflows

### 🔄 Complete Chat Message Flow

```
1. User sends POST /api/chat/users/{userId}/messages
   ↓
2. ChatController.sendMessage() receives request
   ↓
3. Validates question input
   ↓
4. ChatService.sendMessage() is called
   ↓
5. Gets/creates MonthlyUsage for current month
   ↓
6. Checks free quota (messageCount < 3)
   ↓
7a. If free quota available:
    → Increments monthly usage count
    → Saves to database
   ↓
7b. If free quota exhausted:
    → Finds active subscription bundles with quota
    → If none found: throws SubscriptionRequiredError
    → Selects bundle with latest remaining quota
    → Deducts 1 from bundle.remainingMessages
    → Updates bundle in database
   ↓
8. Simulates OpenAI API delay (1-3 seconds)
   ↓
9. Generates mock AI response
   ↓
10. Saves ChatMessage to database
   ↓
11. Returns response to user
```

### 🔄 Subscription Creation Flow

```
1. User sends POST /api/subscriptions/users/{userId}/subscriptions
   ↓
2. SubscriptionController.createSubscription() receives request
   ↓
3. Validates tier and billingCycle
   ↓
4. SubscriptionService.createSubscription() is called
   ↓
5. Verifies user exists (throws NotFoundError if not)
   ↓
6. Gets tier configuration (maxMessages, price)
   ↓
7. Calculates dates:
   - startDate = now
   - endDate = now + 1 month/year (based on billingCycle)
   ↓
8. Calculates price:
   - Monthly: tier price
   - Yearly: tier price × 10
   ↓
9. Creates SubscriptionBundle entity:
   - remainingMessages = maxMessages
   - renewalDate = endDate (if autoRenew) or null
   ↓
10. Saves to database
   ↓
11. Returns subscription to user
```

### 🔄 Auto-Renewal Flow

```
1. RenewalJob runs (every hour)
   ↓
2. SubscriptionService.processAutoRenewals() is called
   ↓
3. Finds subscriptions where:
   - isActive = true
   - autoRenew = true
   - renewalDate <= now
   ↓
4. For each subscription:
   ↓
5. Simulates payment (90% success, 10% failure)
   ↓
6a. If payment succeeds:
    → Creates new subscription period
    → Sets new startDate = old endDate
    → Sets new endDate = startDate + billingCycle
    → Sets remainingMessages = maxMessages
    → Deactivates old subscription
    → Saves new subscription
   ↓
6b. If payment fails:
    → Deactivates subscription (isActive = false)
    → Updates subscription in database
   ↓
7. Job completes
```

### 🔄 Monthly Quota Reset Flow

```
1. RenewalJob runs (every hour)
   ↓
2. UsageResetService.resetMonthlyUsageIfNeeded() is called
   ↓
3. Checks if current day is 1st of month
   ↓
4. If not 1st: exits early
   ↓
5. If 1st: Finds all MonthlyUsage records from previous months
   ↓
6. For each user:
   ↓
7. Checks if record exists for current month
   ↓
8a. If exists and count > 0:
    → Resets messageCount to 0
    → Updates lastResetDate
   ↓
8b. If doesn't exist:
    → Creates new record for current month
    → Sets messageCount = 0
   ↓
9. All users' quotas reset
```

### 🔄 Subscription Cancellation Flow

```
1. User sends PATCH /api/subscriptions/{subscriptionId}/cancel
   ↓
2. SubscriptionController.cancelSubscription() receives request
   ↓
3. SubscriptionService.cancelSubscription() is called
   ↓
4. Gets subscription by ID (throws NotFoundError if not found)
   ↓
5. Calls subscription.cancel() method:
   → Sets autoRenew = false
   → Sets renewalDate = null
   → Keeps isActive = true (remains active until endDate)
   ↓
6. Updates subscription in database
   ↓
7. Returns updated subscription
   ↓
Note: Subscription remains active until endDate, but won't auto-renew
```

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Step-by-Step Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file** in the root directory:
   ```env
   # Option 1: Use DATABASE_URL (recommended)
   DATABASE_URL=postgresql://postgres:password@localhost:5432/myappdb
   
   # Option 2: Use individual variables
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=myappdb
   DB_USER=postgres
   DB_PASSWORD=password
   
   # Server configuration
   PORT=3000
   NODE_ENV=development
   ```

3. **Test database connection:**
   ```bash
   npm run test:db
   ```
   This will:
   - Test your PostgreSQL connection
   - Create the database if it doesn't exist
   - Verify all credentials

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start the server:**
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

The server will automatically:
- Run database migrations on startup
- Create all required tables
- Start the renewal job scheduler

## API Endpoints

### Chat Module

#### Send a Message
```http
POST /api/chat/users/:userId/messages
Content-Type: application/json

{
  "question": "What is artificial intelligence?"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "question": "What is artificial intelligence?",
  "answer": "Mocked AI response...",
  "tokens": 45,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Get Message History
```http
GET /api/chat/users/:userId/messages?limit=50
```

#### Get Message by ID
```http
GET /api/chat/messages/:messageId
```

### Subscription Module

#### Create Subscription
```http
POST /api/subscriptions/users/:userId/subscriptions
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
  "id": "uuid",
  "userId": "uuid",
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

#### Get User Subscriptions
```http
GET /api/subscriptions/users/:userId/subscriptions
```

#### Get Active Subscriptions
```http
GET /api/subscriptions/users/:userId/subscriptions/active
```

#### Get Subscription by ID
```http
GET /api/subscriptions/subscriptions/:subscriptionId
```

#### Cancel Subscription
```http
PATCH /api/subscriptions/subscriptions/:subscriptionId/cancel
```

#### Toggle Auto-Renew
```http
PATCH /api/subscriptions/subscriptions/:subscriptionId/auto-renew
Content-Type: application/json

{
  "autoRenew": false
}
```

### Health Check
```http
GET /health
```

## Examples

### Example 1: New User Sends First Message

```bash
# 1. User sends first message (uses free quota)
curl -X POST http://localhost:3000/api/chat/users/user-123/messages \
  -H "Content-Type: application/json" \
  -d '{"question": "Hello, how are you?"}'

# Response: Message created successfully
# Monthly usage: 1/3 free messages used
```

### Example 2: User Exhausts Free Quota

```bash
# User sends 3rd message (last free message)
curl -X POST http://localhost:3000/api/chat/users/user-123/messages \
  -H "Content-Type: application/json" \
  -d '{"question": "Third question"}'

# Response: Message created successfully
# Monthly usage: 3/3 free messages used

# User tries to send 4th message
curl -X POST http://localhost:3000/api/chat/users/user-123/messages \
  -H "Content-Type: application/json" \
  -d '{"question": "Fourth question"}'

# Response (403 Forbidden):
# {
#   "error": {
#     "message": "Valid subscription required. Free quota exhausted.",
#     "statusCode": 403
#   }
# }
```

### Example 3: User Creates Subscription and Continues

```bash
# 1. Create Basic subscription
curl -X POST http://localhost:3000/api/subscriptions/users/user-123/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "Basic",
    "billingCycle": "monthly",
    "autoRenew": true
  }'

# Response: Subscription created with 10 remaining messages

# 2. User can now send messages (deducted from subscription)
curl -X POST http://localhost:3000/api/chat/users/user-123/messages \
  -H "Content-Type: application/json" \
  -d '{"question": "Now I have a subscription"}'

# Response: Message created successfully
# Subscription: 9/10 messages remaining
```

### Example 4: Multiple Active Subscriptions

```bash
# User has multiple active subscriptions
# System automatically uses the one with latest remaining quota

# 1. Create Pro subscription (100 messages)
curl -X POST http://localhost:3000/api/subscriptions/users/user-123/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "Pro",
    "billingCycle": "monthly",
    "autoRenew": false
  }'

# 2. User sends message
# System uses Pro subscription (most recently created with quota)
# Pro: 99/100 remaining
# Basic: 9/10 remaining (untouched)
```

### Example 5: Subscription Auto-Renewal

```bash
# 1. Create subscription with auto-renew
curl -X POST http://localhost:3000/api/subscriptions/users/user-123/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "Basic",
    "billingCycle": "monthly",
    "autoRenew": true
  }'

# Subscription created with:
# - endDate: 2024-02-15
# - renewalDate: 2024-02-15
# - autoRenew: true

# 2. When renewalDate arrives:
# - RenewalJob processes the renewal
# - Simulates payment (90% success rate)
# - If successful: Creates new subscription period
# - If failed: Deactivates subscription
```

## Database Schema

### `users`
```sql
- id (UUID, Primary Key)
- email (VARCHAR(255), Unique)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `chat_messages`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- question (TEXT)
- answer (TEXT)
- tokens (INTEGER)
- created_at (TIMESTAMP)
```

### `subscription_bundles`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- tier (VARCHAR(50)) -- 'Basic', 'Pro', 'Enterprise'
- billing_cycle (VARCHAR(20)) -- 'monthly', 'yearly'
- max_messages (INTEGER) -- -1 for unlimited
- remaining_messages (INTEGER)
- price (DECIMAL(10, 2))
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- renewal_date (TIMESTAMP, Nullable)
- auto_renew (BOOLEAN)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `monthly_usage`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- year (INTEGER)
- month (INTEGER) -- 1-12
- message_count (INTEGER)
- last_reset_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, year, month)
```

### `schema_migrations`
```sql
- version (VARCHAR(255), Primary Key)
- applied_at (TIMESTAMP)
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": {
    "message": "Error message",
    "statusCode": 403
  }
}
```

### Error Types

- **`QuotaExceededError` (403)**: User has exceeded their subscription quota
- **`SubscriptionRequiredError` (403)**: Free quota exhausted, subscription required
- **`NotFoundError` (404)**: Resource not found (user, subscription, message)
- **`ValidationError` (400)**: Invalid input (wrong tier, billing cycle, etc.)

### Example Error Responses

```json
// Quota Exceeded
{
  "error": {
    "message": "Quota exceeded. Please upgrade your subscription.",
    "statusCode": 403
  }
}

// Subscription Required
{
  "error": {
    "message": "Valid subscription required. Free quota exhausted.",
    "statusCode": 403
  }
}

// Not Found
{
  "error": {
    "message": "Subscription not found",
    "statusCode": 404
  }
}
```

## Subscription Tiers

| Tier | Max Messages | Monthly Price | Yearly Price |
|------|--------------|---------------|--------------|
| **Basic** | 10 | $9.99 | $99.90 |
| **Pro** | 100 | $29.99 | $299.90 |
| **Enterprise** | Unlimited | $99.99 | $999.90 |

## Usage Quota Logic

1. **Free Tier**: Each user gets 3 free messages per month
2. **Quota Priority**: Free quota is used first, then subscription quota
3. **Multiple Subscriptions**: When multiple active bundles exist, the system uses the one with the latest remaining quota (most recently created)
4. **Auto-Reset**: Free quota automatically resets on the 1st of each month
5. **Quota Exhaustion**: When quota is exhausted, structured errors are returned

## Development

### Available Scripts

```bash
# Build TypeScript
npm run build

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# Test database connection
npm run test:db

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **Clean Architecture**: Separation of concerns across layers

## Notes

- **OpenAI Integration**: Currently mocked for demonstration. Replace `generateMockResponse()` in `ChatService.ts` with actual OpenAI API calls
- **Payment Processing**: Simulated with 10% random failure rate. Replace in `SubscriptionService.renewSubscription()` with actual payment gateway
- **Scheduled Jobs**: Currently runs every hour. In production, use proper cron scheduler (e.g., node-cron, Bull)
- **Database Migrations**: Run automatically on startup. In production, consider running migrations separately before starting the server

## License

ISC
