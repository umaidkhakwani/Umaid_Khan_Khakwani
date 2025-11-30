# AI Chat and Subscription Bundle API

A RESTful API built with TypeScript, Express, and PostgreSQL following Domain-Driven Design (DDD) and Clean Architecture principles.

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
- Simulate billing logic with random payment failures
- Support subscription cancellation
- Preserve usage history

## Architecture

The project follows Clean Architecture with DDD principles:

```
src/
├── domain/              # Domain entities (business logic)
│   └── entities/
├── chat/                # AI Chat module
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── routes/
├── subscriptions/       # Subscription module
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── routes/
├── shared/              # Shared utilities
│   ├── errors/
│   ├── middleware/
│   └── types/
└── config/              # Configuration
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_chat_db
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
NODE_ENV=development
```

4. Create the PostgreSQL database:
```bash
createdb ai_chat_db
```

5. Build the project:
```bash
npm run build
```

6. Start the server:
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

## Database Migrations

Migrations run automatically on server startup. The database schema includes:

- `users` - User accounts
- `chat_messages` - Chat messages with questions and answers
- `subscription_bundles` - Subscription bundles
- `monthly_usage` - Monthly usage tracking for free quota

## API Endpoints

### Chat Module

#### Send a message
```
POST /api/chat/users/:userId/messages
Body: { "question": "Your question here" }
```

#### Get message history
```
GET /api/chat/users/:userId/messages?limit=50
```

#### Get message by ID
```
GET /api/chat/messages/:messageId
```

### Subscription Module

#### Create subscription
```
POST /api/subscriptions/users/:userId/subscriptions
Body: {
  "tier": "Basic" | "Pro" | "Enterprise",
  "billingCycle": "monthly" | "yearly",
  "autoRenew": true | false
}
```

#### Get user subscriptions
```
GET /api/subscriptions/users/:userId/subscriptions
```

#### Get active subscriptions
```
GET /api/subscriptions/users/:userId/subscriptions/active
```

#### Get subscription by ID
```
GET /api/subscriptions/subscriptions/:subscriptionId
```

#### Cancel subscription
```
PATCH /api/subscriptions/subscriptions/:subscriptionId/cancel
```

#### Toggle auto-renew
```
PATCH /api/subscriptions/subscriptions/:subscriptionId/auto-renew
Body: { "autoRenew": true | false }
```

### Health Check
```
GET /health
```

## Subscription Tiers

- **Basic**: 10 responses, $9.99/month
- **Pro**: 100 responses, $29.99/month
- **Enterprise**: Unlimited responses, $99.99/month

Yearly subscriptions are priced at 10x the monthly price.

## Usage Quota Logic

1. Each user gets 3 free messages per month
2. Free quota resets automatically on the 1st of each month
3. After free quota is exhausted, a valid subscription is required
4. When multiple active bundles exist, the system uses the one with the latest remaining quota
5. Structured errors are returned when quota is exceeded

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

Common error types:
- `QuotaExceededError` (403) - User has exceeded their quota
- `SubscriptionRequiredError` (403) - Free quota exhausted, subscription required
- `NotFoundError` (404) - Resource not found
- `ValidationError` (400) - Invalid input

## Development

### Linting
```bash
npm run lint
npm run lint:fix
```

### Formatting
```bash
npm run format
npm run format:check
```

## Project Structure

- **Domain Layer**: Pure business logic entities
- **Service Layer**: Business logic orchestration
- **Repository Layer**: Data access abstraction
- **Controller Layer**: HTTP request/response handling
- **Routes**: API endpoint definitions

## Notes

- OpenAI responses are mocked for demonstration purposes
- Payment processing is simulated with a 10% random failure rate
- Auto-renewal processing should be run as a scheduled job (cron) in production
- Monthly usage reset runs automatically on the 1st of each month

## License

ISC

