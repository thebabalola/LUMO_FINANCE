# Lumo Finance - AI Financial Operating System

Lumo Finance is an AI-powered financial assistant that enables users to manage their finances through natural conversation. Send money, check balances, buy airtime, pay bills, and analyze spending—all via chat.

## 🚀 Features

- 💬 **Natural Language Chat** - "Send ₦10,000 to David" or "Check my balance"
- 📊 **Dashboard** - View wallet, transactions, and spending analytics
- 💰 **Money Transfers** - Send funds to bank accounts
- 📱 **Airtime & Data** - Purchase mobile services
- 💡 **Bill Payments** - Pay utilities and subscriptions
- 🔍 **Spending Insights** - Understand your financial patterns
- 🔐 **Secure** - Every transaction requires explicit confirmation

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Zustand
- **Backend**: Go, Fiber, PostgreSQL, Redis
- **AI**: Claude (Anthropic API)
- **API Proxy**: Cloudflare Worker
- **Payments**: Nomba APIs
- **Deployment**: Docker, Vercel (frontend), Any Go host (backend)

## 📁 Project Structure

```
lumo-finance/
├── frontend/                # Next.js web app
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── components/
│   │   ├── dashboard/
│   │   ├── store/          # Zustand state
│   │   ├── types/
│   │   └── lib/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── backend/                 # Go/Fiber REST API
│   ├── main.go
│   ├── go.mod
│   ├── internal/
│   │   ├── db/             # Database
│   │   ├── redis/          # Cache
│   │   ├── handlers/       # HTTP handlers
│   │   ├── middleware/
│   │   ├── models/         # Data structures
│   │   └── services/
│   ├── migrations/         # SQL migrations
│   ├── Makefile
│   ├── Dockerfile
│   └── README.md
│
├── worker/                  # Cloudflare Worker proxy
│   ├── src/index.ts        # Claude, ElevenLabs, Nomba
│   ├── wrangler.toml
│   └── package.json
│
├── docker-compose.yml       # Local development
├── LUMO_PRD.md             # Product specification
└── AGENTS.md               # Architecture guide
```

## ⚙️ Quick Start

### Option 1: Docker Compose (Recommended for local dev)

```bash
docker-compose up
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Option 2: Manual Setup

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

#### Backend

```bash
cd backend
cp .env.example .env

# Setup database
createdb lumo_finance
psql -U postgres -d lumo_finance -f migrations/001_create_users_table.sql

# Start server
make dev
```

Server runs on `http://localhost:8000`

#### Cloudflare Worker

```bash
cd worker
npm install

npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put NOMBA_API_KEY

npx wrangler deploy
```

## 📂 Documentation

- **[Frontend Setup](frontend/README.md)** - Next.js app documentation
- **[Backend Setup](backend/README.md)** - Go/Fiber API documentation
- **[Product Spec](LUMO_PRD.md)** - Complete feature specification
- **[Architecture](AGENTS.md)** - Technical architecture details

## 🏗️ Architecture

```
User Browser
    ↓
Next.js Frontend (port 3000)
    ↓
Go/Fiber Backend (port 8000)
    ├→ PostgreSQL (user data, transactions)
    ├→ Redis (caching, sessions)
    └→ Nomba APIs (financial transactions)
    
Claude AI (via Cloudflare Worker)
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Backend (Docker / Render / Railway)
```bash
cd backend
docker build -t lumo-api .
# Push to registry and deploy
```

## 📝 Development

### Frontend Commands
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter
npm start           # Start production build
```

### Backend Commands
```bash
cd backend
make dev             # Start dev server
make build           # Build binary
make test            # Run tests
make docker-build    # Build Docker image
```

## 🔐 Security

- All API keys in `.env` files (Cloudflare Worker secrets)
- No sensitive data in client code
- JWT authentication for backend
- Every transaction requires user confirmation
- HTTPS for all external calls

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT - See [LICENSE](LICENSE) file

## 🤝 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@lumo.finance

---

Built for the Nomba x DevCarrer Hackathon
