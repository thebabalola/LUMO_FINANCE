# Lumo Finance - Architecture & Developer Guide

## Overview

Lumo Finance is a web-based AI financial assistant. Users manage finances through natural conversation with Claude. The intelligence and money movement live in a Go (Fiber) backend: Claude tool calling, conversation memory in Redis, JWT/OTP/PIN security, and Nomba for actual transactions. The Cloudflare Worker remains only for text-to-speech.

## Architecture

```
User Browser (Next.js)
    ↓
Next API Routes (/api/chat, /api/wallet, /api/transactions)
    ↓
Go Backend (Fiber, /api/v1) — JWT auth, rate limiting, audit logs
    ↓
Claude API (agentic loop with 8 tools)
Nomba client (sandbox or live) — transfers, airtime, data, bills
PostgreSQL (users, wallets, transactions, audit_logs)
Redis (conversation memory, pending actions, OTP, refresh tokens, rate limits)
```

**Payment confirmation flow (the core security invariant):** the AI can prepare a payment (pending action in Redis, 5-min TTL) but can never execute one. Execution happens only via `POST /api/v1/chat/confirm` after bcrypt transaction-PIN verification, using the stored action's amount/recipient — never re-derived from the model.

### Technology

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand (simple, no reducer boilerplate)
- **Forms**: React Hook Form
- **Backend**: Go 1.24, Fiber v2, PostgreSQL (pgx/v5), Redis
- **AI**: Claude via anthropic-sdk-go (model from `CLAUDE_MODEL`, default `claude-sonnet-5`)
- **Payments**: Nomba (`NOMBA_MODE=sandbox` gives a deterministic no-credential fake)
- **Deployment**: docker-compose locally; Vercel for frontend

### Go Backend Routes (`/api/v1`)

| Route | Purpose |
|-------|---------|
| `POST /auth/register`, `/auth/verify-otp`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Email+password auth: OTP activation, JWT access (15m) + rotating refresh tokens (Redis, 7d) |
| `POST /users/me/pin`, `/users/me/pin/verify` | Transaction PIN (bcrypt, 4–6 digits) |
| `GET /users/me`, `PUT /users/me` | Profile |
| `GET /wallet/balance`, `/wallet/accounts`, `POST /wallet/link-account` | Wallet |
| `GET /transactions`, `/transactions/:id` | History |
| `GET /analytics/spending?period=`, `/analytics/summary` | Spending aggregation |
| `POST /chat` | AI chat (JSON): `{message, conversation_id?}` → `{conversation_id, message, pending_action?}` |
| `POST /chat/stream` | SSE variant: `text_delta` / `tool_activity` / `pending_action` / `done` / `error` events |
| `POST /chat/confirm` | Execute a pending action: `{action_id, pin}` (5 wrong PINs → 15-min lockout) |
| `POST /chat/cancel` | Discard a pending action |
| `POST /webhooks/nomba` | Transaction status updates (signature verification TODO) |

### Backend Packages (`backend/internal/`)

| Package | Purpose |
|---------|---------|
| `config` | Env-driven configuration, loaded once at startup |
| `auth` | JWT issue/verify, bcrypt password + transaction PIN, rotating refresh-token store (Redis) |
| `otp` | 6-digit OTP in Redis (10m TTL, 5 attempts) with pluggable Sender (console in dev) |
| `middleware` | Logger, error mapper, `AuthRequired` (Bearer → `c.Locals("user_id")`), Redis rate limiter |
| `audit` | Best-effort audit event recorder → `audit_logs` table |
| `nomba` | Payment client interface: `SandboxClient` (deterministic, ≥₦1M declines) + `HTTPClient` (live) |
| `ai` | ChatService: agentic loop, pending-action gating, PIN-confirmed execution, SSE streaming |
| `ai/claude` | anthropic-sdk-go wrapper + Lumo system prompt |
| `ai/tools` | 8 tool definitions + read-only executor (money tools are never in the executor) |
| `ai/conversation` | Redis conversation memory (24h TTL, 40-message cap, tool-pair-safe trimming) |
| `ai/pending` | Pending money-moving actions (5m TTL, atomic single-use consume) |
| `services` | Auth/User/Wallet/Transaction/Analytics services; TransactionService is the only money-moving path |
| `handlers` | One Fiber handler file per domain |

### Cloudflare Worker (TTS only)

`POST /tts` forwards to ElevenLabs (secret: `ELEVENLABS_API_KEY`, var: `ELEVENLABS_VOICE_ID`). The Worker's `/chat` and `/nomba/*` routes are dead paths kept for reference; chat goes through the Go backend.

## Key Files & Components

### Pages

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home page (redirects to /dashboard) |
| `app/dashboard/page.tsx` | Main dashboard with chat + wallet |
| `app/dashboard/layout.tsx` | Dashboard layout with sidebar |

### Components

| File | Purpose |
|------|---------|
| `components/chat/chat-interface.tsx` | Main chat container |
| `components/chat/chat-messages.tsx` | Message display (user + assistant) |
| `components/chat/chat-input.tsx` | Input form with send button |
| `components/dashboard/wallet-overview.tsx` | Balance card with quick actions |
| `components/dashboard/recent-transactions.tsx` | Transaction list |
| `components/sidebar.tsx` | Navigation sidebar |

### API Routes

| Route | Purpose |
|------|---------|
| `api/chat/route.ts` | Forwards `{message, conversationId}` to the Go backend `/chat` with a dev bearer token |
| `api/wallet/route.ts` | Returns account balance & info (mock — pending backend wiring) |
| `api/transactions/route.ts` | Returns recent transactions (mock — pending backend wiring) |

### State & Types

| File | Purpose |
|------|---------|
| `store/chat-store.ts` | Zustand store for messages + loading state |
| `types/chat.ts` | Message, ChatRequest, ChatResponse interfaces |
| `lib/utils.ts` | formatCurrency, formatDate, formatTime helpers |

## Data Flow

### Chat Message

1. User types message in `ChatInput` component
2. Message added to Zustand store; `handleSendMessage` calls `POST /api/chat` with `{message, conversationId}`
3. Next API route forwards to the Go backend `POST /api/v1/chat` (Bearer token)
4. Backend loads conversation memory from Redis, runs the Claude agentic loop (read-only tools execute server-side)
5. Backend returns `{conversation_id, message, pending_action?}`; conversation memory saved server-side
6. Response added to store; `conversationId` remembered for the next turn

### Transaction

1. User says: "Send ₦10,000 to David"
2. Claude verifies the recipient (verifyRecipient tool), then calls transferMoney — which only creates a pending action in Redis (5-min TTL)
3. Claude summarizes the transfer and asks the user to confirm with their PIN
4. Frontend calls `POST /api/v1/chat/confirm {action_id, pin}`
5. Backend verifies the PIN (bcrypt, lockout after 5 failures), debits the wallet atomically, executes via the Nomba client
6. Receipt returned; outcome appended to conversation memory so Claude knows it completed

## Development Workflow

### Adding a New Feature

1. Create component in `app/components/`
2. Add types to `app/types/` if needed
3. Create API route in `app/api/` if needed
4. Add Zustand store action if state needed
5. Import and use component

### Example: Adding "Analytics" Page

```bash
# Create page
touch app/analytics/page.tsx
touch app/analytics/layout.tsx

# Create components
touch app/components/analytics/spending-chart.tsx
touch app/components/analytics/category-breakdown.tsx

# Create API route
touch app/api/analytics/route.ts

# Add types
# Edit app/types/analytics.ts (create if needed)
```

### Testing Locally

```bash
npm run dev
# Visit http://localhost:3000
# Open Network tab to see API calls
# Check browser console for errors
```

## Security

- **No API keys in frontend**: All stored in Worker secrets
- **CORS handled by Worker**: Proxy sits between client and APIs
- **Confirmation required**: Every transaction needs user approval
- **Conversation history client-side**: Not persisted to server
- **HTTPS only**: All external API calls use HTTPS

## Deployment

### To Vercel

```bash
vercel deploy
```

Will auto-detect Next.js and deploy.

### To Custom Server

```bash
npm run build
npm start
```

Then serve on port 3000 with your hosting provider.

## Environment Variables

```
# .env.local
NEXT_PUBLIC_WORKER_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

That's it! Everything else is in the Worker's secrets.

## Code Style

- **No comments** unless "why" is non-obvious
- **Clear naming**: `formatCurrency` not `fmt$`
- **Component props**: Keep param names same as originating variable
- **TypeScript everywhere**: No `any` types
- **Tailwind only**: No CSS-in-JS

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm start           # Run production build locally
```

## Troubleshooting

### "Worker URL is undefined"
- Check `.env.local` has `NEXT_PUBLIC_WORKER_BASE_URL`
- Restart dev server after changing env

### Chat not responding
- Check Worker URL is correct
- Verify Worker has `ANTHROPIC_API_KEY` secret
- Check browser Network tab for 500 errors

### Transactions failing
- Verify Nomba API key in Worker secrets
- Check Nomba sandbox vs production URL
- Check request format matches Nomba docs

## Next Steps

- [ ] Add voice input with Web Speech API
- [ ] Add transaction confirmation modal
- [ ] Add spending analytics page
- [ ] Add transaction filters (date range, type)
- [ ] Add user authentication
- [ ] Add transaction notifications

## Cloudflare Worker

```bash
cd worker
npm install

# Add secrets
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ASSEMBLYAI_API_KEY
npx wrangler secret put ELEVENLABS_API_KEY

# Deploy
npx wrangler deploy

# Local dev (create worker/.dev.vars with your keys)
npx wrangler dev
```

## Code Style & Conventions

### Variable and Method Naming

IMPORTANT: Follow these naming rules strictly. Clarity is the top priority.

- Be as clear and specific with variable and method names as possible
- **Optimize for clarity over concision.** A developer with zero context on the codebase should immediately understand what a variable or method does just from reading its name
- Use longer names when it improves clarity. Do NOT use single-character variable names
- Example: use `originalQuestionLastAnsweredDate` instead of `originalAnswered`
- When passing props or arguments to functions, keep the same names as the original variable. Do not shorten or abbreviate parameter names. If you have `currentCardData`, pass it as `currentCardData`, not `card` or `cardData`

### Code Clarity

- **Clear is better than clever.** Do not write functionality in fewer lines if it makes the code harder to understand
- Write more lines of code if additional lines improve readability and comprehension
- Make things so clear that someone with zero context would completely understand the variable names, method names, what things do, and why they exist
- When a variable or method name alone cannot fully explain something, add a comment explaining what is happening and why

### Swift/SwiftUI Conventions

- Use SwiftUI for all UI unless a feature is only supported in AppKit (e.g., `NSPanel` for floating windows)
- All UI state updates must be on `@MainActor`
- Use async/await for all asynchronous operations
- Comments should explain "why" not just "what", especially for non-obvious AppKit bridging
- AppKit `NSPanel`/`NSWindow` bridged into SwiftUI via `NSHostingView`
- All buttons must show a pointer cursor on hover
- For any interactive element, explicitly think through its hover behavior (cursor, visual feedback, and whether hover should communicate clickability)

### Do NOT

- Do not add features, refactor code, or make "improvements" beyond what was asked
- Do not add docstrings, comments, or type annotations to code you did not change
- Do not try to fix the known non-blocking warnings (Swift 6 concurrency, deprecated onChange)
- Do not rename the project directory or scheme (the "leanring" typo is intentional/legacy)
- Do not run `xcodebuild` from the terminal — it invalidates TCC permissions

## Git Workflow

- Branch naming: `feature/description` or `fix/description`
- Commit messages: imperative mood, concise, explain the "why" not the "what"
- Do not force-push to main

## Self-Update Instructions

<!-- AI agents: follow these instructions to keep this file accurate. -->

When you make changes to this project that affect the information in this file, update this file to reflect those changes. Specifically:

1. **New files**: Add new source files to the "Key Files" table with their purpose and approximate line count
2. **Deleted files**: Remove entries for files that no longer exist
3. **Architecture changes**: Update the architecture section if you introduce new patterns, frameworks, or significant structural changes
4. **Build changes**: Update build commands if the build process changes
5. **New conventions**: If the user establishes a new coding convention during a session, add it to the appropriate conventions section
6. **Line count drift**: If a file's line count changes significantly (>50 lines), update the approximate count in the Key Files table

Do NOT update this file for minor edits, bug fixes, or changes that don't affect the documented architecture or conventions.
