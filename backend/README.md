# Lumo Finance Backend

Go/Fiber REST API for Lumo Finance. Handles user authentication, financial transactions, wallet management, and integrations with Nomba APIs.

## Tech Stack

- **Language**: Go 1.21+
- **Web Framework**: Fiber v2
- **Database**: PostgreSQL
- **Cache**: Redis
- **Payment Integration**: Nomba APIs
- **Deployment**: Docker

## Project Structure

```
backend/
├── main.go                  # Entry point
├── go.mod                   # Dependencies
├── .env.example             # Environment variables template
├── Dockerfile              # Docker configuration
├── Makefile                # Development commands
│
├── internal/
│   ├── db/                 # Database connection & initialization
│   ├── redis/              # Redis connection & cache
│   ├── handlers/           # HTTP request handlers
│   ├── middleware/         # Auth, logging, error handling
│   ├── models/             # Data structures
│   ├── services/           # Business logic
│   ├── repositories/       # Database queries
│   └── utils/              # Helper functions
│
├── migrations/             # SQL migration files
└── tests/                  # Test files (future)
```

## Setup

### Prerequisites

- Go 1.21+
- PostgreSQL 14+
- Redis 6+
- Make (optional, for Makefile commands)

### 1. Install Dependencies

```bash
go mod download
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your values:
- `DB_*`: PostgreSQL credentials
- `REDIS_*`: Redis connection
- `NOMBA_API_KEY`: Nomba API key
- `JWT_SECRET`: Secret for JWT tokens

### 3. Database Setup

```bash
# Create database
createdb lumo_finance

# Run migrations
psql -U postgres -d lumo_finance -f migrations/001_create_users_table.sql
```

### 4. Run Development Server

```bash
make dev
# or
go run main.go
```

Server runs on `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user

### User
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile

### Wallet
- `GET /api/v1/wallet/balance` - Get wallet balance
- `GET /api/v1/wallet/accounts` - List linked accounts
- `POST /api/v1/wallet/link-account` - Link bank account

### Transactions
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/:id` - Get transaction details
- `POST /api/v1/transactions/transfer` - Send money transfer
- `POST /api/v1/transactions/airtime` - Buy airtime
- `POST /api/v1/transactions/data` - Buy data
- `POST /api/v1/transactions/bill` - Pay bill

### Analytics
- `GET /api/v1/analytics/spending` - Get spending by category
- `GET /api/v1/analytics/summary` - Get spending summary

### Webhooks
- `POST /webhooks/nomba` - Nomba transaction webhook

## Development

### Run Tests
```bash
make test
```

### Format Code
```bash
make fmt
```

### Build Binary
```bash
make build
# Output: ./bin/api
```

### Docker

Build and run with Docker:

```bash
make docker-build
make docker-run
```

Or manually:

```bash
docker build -t lumo-finance-api .
docker run -p 8000:8000 --env-file .env lumo-finance-api
```

## Database Migrations

Migration files are in `migrations/` directory. Run them in order:

```bash
psql -U postgres -d lumo_finance -f migrations/001_create_users_table.sql
# Add more migrations as needed
```

To create a new migration:
```bash
touch migrations/002_your_migration.sql
```

## Integration with Frontend

The frontend calls the backend at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api/v1`).

Update `.env.local` in the frontend:
```
NEXT_PUBLIC_WORKER_BASE_URL=http://localhost:8000/api/v1
```

## Integration with Nomba

This backend proxies Nomba API calls. The Nomba integration includes:

1. **User Verification**: Verify user identity with Nomba
2. **Bank Account Linking**: Link user's bank account
3. **Transfers**: Send money to other bank accounts
4. **Airtime/Data**: Purchase via Nomba partners
5. **Bills**: Pay utilities through Nomba
6. **Webhooks**: Receive transaction updates from Nomba

All Nomba API keys are stored in `.env` and never exposed to the frontend.

## Architecture Decisions

### Fiber Web Framework
Lightweight, fast, Express-like syntax. Perfect for microservices.

### PostgreSQL + Redis
- **PostgreSQL**: Primary data store, ACID transactions
- **Redis**: Caching, rate limiting, sessions

### Handler Pattern
Each domain (auth, user, wallet, transaction) has its own handler with injected dependencies.

### Middleware
Pluggable middleware for logging, error handling, authentication.

## Security

- All API keys in environment variables
- JWT for authentication
- CORS configured per environment
- Input validation on all endpoints
- SQL queries use parameterized statements
- Rate limiting (to be implemented)

## Performance

- Redis caching for frequently accessed data
- Database connection pooling
- Async transaction processing
- Indexed database queries

## Monitoring & Logging

- All requests logged with timestamp, method, path
- Error responses include error message
- Transaction logs in database for audit trail

## Deployment

### Render / Railway / Heroku

```bash
git push your-remote main
```

Set environment variables in the platform dashboard.

### DigitalOcean / AWS / GCP

Use Docker image:
```bash
docker build -t lumo-finance-api .
# Push to registry and deploy
```

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check `DB_*` environment variables
- Ensure database exists: `psql -l`

### Redis Connection Error
- Verify Redis is running
- Check `REDIS_*` environment variables
- Test with `redis-cli ping`

### Nomba Integration Errors
- Verify `NOMBA_API_KEY` in `.env`
- Check network connectivity
- Review Nomba API documentation

## Contributing

1. Create a feature branch
2. Implement changes
3. Write tests
4. Submit pull request

## License

MIT - See LICENSE file
