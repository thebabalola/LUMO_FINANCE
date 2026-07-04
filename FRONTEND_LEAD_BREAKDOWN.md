<!-- 
Lumo Finance Colour Scheme:
1. Cream / Soft Blush ( #FCECDC )
    • Role: Primary background in Light Mode, and primary text/icon color in Dark Mode.
2. Ember Orange / Terracotta ( #EB6028 )
    • Role: The brand's core accent color. Used consistently across both modes for primary buttons, call-to-actions, and active states.
3. Deep Brown / Bordeaux ( #320A03 )
    • Role: Primary background in Dark Mode, and primary text/anchor color in Light Mode. 
-->

# 🎨 Frontend & Product Experience Lead — Lumo Finance
### Nomba x DevCareer Hackathon | July 2026

> **Role Assigned:** Team Member 2 — Frontend & Product Experience Lead  
> **Primary Responsibility:** Build everything the user sees and interacts with.  
> **Stack:** Next.js 15 · React 18 · TypeScript · Tailwind CSS · Framer Motion · Zustand · TanStack Query · React Hook Form

---

## 🗂️ Table of Contents

1. [Project Context](#1-project-context)
2. [Repo Structure Overview](#2-repo-structure-overview)
3. [Task Breakdown by Category](#3-task-breakdown-by-category)
   - [A. Next.js Application Setup & Routing](#a-nextjs-application-setup--routing)
   - [B. Authentication Pages](#b-authentication-pages)
   - [C. Dashboard](#c-dashboard)
   - [D. Chat Interface (Core UX)](#d-chat-interface-core-ux)
   - [E. Transactions Page](#e-transactions-page)
   - [F. Settings Page](#f-settings-page)
   - [G. Responsive Design & Mobile Optimization](#g-responsive-design--mobile-optimization)
   - [H. Animations & Motion Design](#h-animations--motion-design)
   - [I. Loading, Empty & Error States](#i-loading-empty--error-states)
   - [J. Accessibility](#j-accessibility)
   - [K. State Management](#k-state-management)
   - [L. API Integration (Frontend Side)](#l-api-integration-frontend-side)
   - [M. Reusable Components Library](#m-reusable-components-library)
   - [N. Forms & Validation](#n-forms--validation)
   - [O. Transaction Receipts & Confirmations](#o-transaction-receipts--confirmations)
4. [Judging Criteria Alignment](#4-judging-criteria-alignment)
5. [Engineering Standards (from Playbook)](#5-engineering-standards-from-playbook)
6. [Sprint Execution Plan](#6-sprint-execution-plan)
7. [Submission Checklist](#7-submission-checklist)
8. [Visual Direction, Design System & 3D Aesthetic](#8-visual-direction-design-system--3d-aesthetic)
   - [8.1 Commit Workflow](#81--commit-workflow-thebabalola-github-account)
   - [8.2 Colour Scheme Options](#82--colour-scheme-options-all-options-listed)
   - [8.3 Typography Options](#83--typography-options)
   - [8.4 Animation Libraries](#84--animation-libraries)
   - [8.5 3D Design Direction](#85--3d-design-direction)
   - [8.6 Landing Page & UI Inspiration](#86--landing-page--ui-inspiration)
   - [8.7 Landing Page Section Plan](#87--landing-page-section-plan-hero-first)
   - [8.8 3D UI Implementation Techniques](#88--3d-ui-implementation-techniques)
   - [8.9 Quick Visual Decision Summary](#89--quick-visual-decision-summary)
9. [Layout Architecture & Sketch Diagrams](#9-layout-architecture--sketch-diagrams)
   - [9.1 The Two-Zone Rule](#91--the-two-zone-rule)
   - [9.2 Zone 1 — Landing Page Layout](#92--zone-1--landing-page-layout)
   - [9.3 Zone 2 — App Shell Layout (Sidebar)](#93--zone-2--app-shell-layout-sidebar)
   - [9.4 Dashboard — The Core Screen](#94--dashboard--the-core-screen)
   - [9.5 Confirmed Colour Token Mapping](#95--confirmed-colour-token-mapping)
   - [9.6 Mobile Behaviour](#96--mobile-behaviour)
   - [9.7 Layout Decision Summary](#97--layout-decision-summary)

---

## 1. Project Context

**Lumo Finance** is an AI-native Financial Operating System for Africa. Instead of navigating multiple banking apps, users simply *chat* with Lumo to execute financial actions — transfers, airtime, bills — powered by **Nomba APIs** under the hood.

**Your job** is to make that experience feel seamless, trustworthy, and premium. Every pixel matters here. The UX *is* the product — the AI assistant is only as powerful as the interface around it.

**Judging Criteria Relevant to You:**
| Criterion | Weight | Your Impact |
|-----------|--------|-------------|
| Product UX & Clarity | 15% | **Direct — you own this entirely** |
| Technical Execution | 25% | **Partial — Next.js setup, API integration, component architecture** |
| Nomba Integration Depth | 20% | **Partial — confirmation/receipt UI surfaces Nomba data** |
| Security & Reliability | 20% | **Partial — form validation, error handling, loading states** |

---

## 2. Repo Structure Overview

```
LUMO_FINANCE/
├── frontend/                  ← Your primary workspace
│   ├── app/
│   │   ├── page.tsx           ← Landing/redirect page
│   │   ├── layout.tsx         ← Root layout (metadata, fonts)
│   │   ├── globals.css        ← Global styles + Tailwind config
│   │   ├── dashboard/
│   │   │   ├── page.tsx       ← Main dashboard page
│   │   │   └── layout.tsx     ← Dashboard layout with sidebar
│   │   ├── api/               ← Next.js API routes (talk to CF Worker)
│   │   │   ├── chat/route.ts
│   │   │   ├── wallet/route.ts
│   │   │   └── transactions/route.ts
│   │   ├── components/
│   │   │   ├── chat/          ← Chat UI (crown jewel)
│   │   │   │   ├── chat-interface.tsx
│   │   │   │   ├── chat-messages.tsx
│   │   │   │   └── chat-input.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── wallet-overview.tsx
│   │   │   │   └── recent-transactions.tsx
│   │   │   └── sidebar.tsx
│   │   ├── store/
│   │   │   └── chat-store.ts  ← Zustand state
│   │   ├── types/
│   │   │   └── chat.ts        ← TypeScript interfaces
│   │   └── lib/
│   │       └── utils.ts       ← formatCurrency, formatDate helpers
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/                   ← Team Member 1's territory (Go/Fiber)
├── worker/                    ← Cloudflare Worker proxy (API key guardian)
└── AGENTS.md                  ← Architecture reference (read this!)
```

---

## 3. Task Breakdown by Category

---

### A. Next.js Application Setup & Routing

**What:** Establish the foundational app architecture — routing, layout, metadata, fonts, and global styles.

**Tasks:**
- [ ] **Root layout** (`app/layout.tsx`) — Global HTML structure, Google Fonts (DM Sans is already linked), `<html lang="en">`, dark mode class
- [ ] **Metadata config** — Add `title`, `description`, `openGraph`, `twitter` cards, favicon to `layout.tsx`
- [ ] **Route structure** — Create all required page routes:
  - `/` → Landing / redirect to `/dashboard`
  - `/login` → Login page
  - `/register` → Registration page
  - `/dashboard` → Main dashboard (chat + wallet)
  - `/transactions` → Transaction history
  - `/settings` → User settings
- [ ] **Route groups** — Use Next.js App Router route groups: `(auth)` for login/register, `(app)` for protected dashboard routes
- [ ] **Middleware** (`middleware.ts`) — Protect `/dashboard`, `/transactions`, `/settings` — redirect unauthenticated users to `/login`
- [ ] **globals.css** — Define CSS custom properties for design tokens (colours, spacing, radius, shadows) beyond the bare-bones existing file
- [ ] **tailwind.config.js** — Add custom colours (`dark-50`, `dark-400`, `dark-700`, `dark-800` already referenced in components — define them here), custom font family

> **Playbook Rule:** A good project structure is one where you can find anything in under 10 seconds without searching.

---

### B. Authentication Pages

**What:** Build the login and registration flows. First thing a judge sees after the landing page.

**Tasks:**
- [ ] **`/login` page** — Email + password form with:
  - Lumo logo at top
  - "Sign in to Lumo" headline
  - Email input with real-time validation
  - Password input with show/hide toggle
  - "Forgot password?" link
  - Submit button with spinner loading state
  - "Don't have an account? Sign up" link
  - Google OAuth button (if Auth.js wired up by backend)
  - Human-readable error message on failed login
- [ ] **`/register` page** — Registration form with:
  - Full name, email, password, confirm password fields
  - OTP verification step (modal or inline after email submission)
  - Progress indicator: Step 1: Account → Step 2: Verify → Step 3: Done
  - Redirect to `/dashboard` on success
- [ ] **OTP input component** — 6 individual digit boxes, auto-focus-next-box pattern, paste support, resend timer countdown
- [ ] **Auth layout** — Two-panel desktop (Lumo branding left, form right), stacked on mobile
- [ ] **Form validation via React Hook Form** — Inline error messages below each field

**APIs to integrate (coordinate with Team Member 1):**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`

---

### C. Dashboard

**What:** The main product screen. Chat on one side, wallet + transactions on the other. This is the core experience judges will demo.

**Tasks:**
- [ ] **Dashboard layout** (`app/dashboard/layout.tsx`) — Sidebar + main content area, persistent across dashboard routes
- [ ] **Sidebar** (`components/sidebar.tsx`) — Already scaffolded, needs:
  - Lumo logo (SVG)
  - Nav links: Dashboard, Transactions, Settings with active state highlight
  - User avatar at bottom — use DiceBear API (`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`) for unique auto-generated avatars per user
  - Collapsible hamburger on mobile
- [ ] **Wallet Overview card** (`components/dashboard/wallet-overview.tsx`) — Already scaffolded, needs:
  - Balance displayed with ₦ formatting (`formatCurrency` from `lib/utils.ts`)
  - Balance visibility toggle (eye icon show/hide with blur animation)
  - Quick action buttons: **Send, Airtime, Data, Bills** — tapping pre-fills the chat input
  - Loading skeleton while balance fetches
  - Virtual account number display
- [ ] **Recent Transactions list** (`components/dashboard/recent-transactions.tsx`) — Already scaffolded, needs:
  - Last 5 transactions
  - Each row: type icon, description, amount (coloured by direction), date, status badge
  - "View all" link → `/transactions`
  - Empty state: illustrated + "No transactions yet. Chat with Lumo to send money."
  - Shimmer skeleton rows while loading
- [ ] **Dashboard page** (`app/dashboard/page.tsx`) — Two-column grid: `[Chat | Wallet + Transactions]` on desktop, stacked on mobile

---

### D. Chat Interface (Core UX)

**What:** The heart of Lumo. Every financial action flows here. Must feel fast, smart, and trustworthy. Judges will type into this live.

**Existing files to enhance:**
- `components/chat/chat-interface.tsx` — Container (exists)
- `components/chat/chat-messages.tsx` — Message rendering (exists)
- `components/chat/chat-input.tsx` — Input box (exists)

**Tasks:**
- [ ] **Chat header** — "Lumo Assistant" title, green pulsing online dot, "Powered by Nomba" badge
- [ ] **Message bubbles** — Distinct styles:
  - User → right-aligned, accent colour background
  - Assistant → left-aligned, dark card, Lumo avatar, timestamps on hover
  - Copy-to-clipboard on hover for assistant messages
- [ ] **AI typing indicator** — Animated three-dot loader when `isLoadingAiResponse === true`, auto-scroll into view
- [ ] **Transaction Confirmation Card** — Rendered *inside* the chat when AI detects a payment intent:
  ```
  ┌───────────────────────────────────┐
  │  💸 Send Money                    │
  │  To:     David Olu                │
  │  Bank:   GTBank • 0123456789      │
  │  Amount: ₦25,000                  │
  │  Fee:    ₦52.50                   │
  │  Total:  ₦25,052.50               │
  │                                   │
  │  [ ✓ Confirm ]   [ ✗ Cancel ]    │
  └───────────────────────────────────┘
  ```
  - **Confirm** → calls `POST /api/transactions/execute` → animates into receipt
  - **Cancel** → dismisses, AI acknowledges
- [ ] **Transaction Receipt Card** — After confirmed payment:
  - Animated green checkmark (Framer Motion)
  - Reference: `NMB-2026-XXXXX`
  - All transaction details
  - "Share Receipt" | "Done" buttons
- [ ] **Quick suggestion chips** — On empty chat, show clickable prompts:
  - "Send ₦10,000 to someone"
  - "Buy MTN airtime"
  - "Pay my electricity bill"
  - "What's my balance?"
- [ ] **Empty chat welcome screen** — "Good morning, [Name]. What would you like to do today?" + suggestion chips
- [ ] **Input enhancements:**
  - Submit on `Enter`, new line on `Shift+Enter`
  - Disabled + greyed while AI is responding
  - Character count if needed
  - Voice input button (Web Speech API — stretch goal)
- [ ] **Error state in chat** — Inline retry button in the message thread, not just an error bubble
- [ ] **Scroll behaviour** — Auto-scroll to latest, "Scroll to bottom ↓" button when user scrolled up

---

### E. Transactions Page

**What:** Full-page transaction history. Judges check here to see Nomba API data surfaced properly.

**Tasks:**
- [ ] **Create `/transactions/page.tsx`**
- [ ] **Filter bar:**
  - Date range (from / to)
  - Type: All / Transfers / Airtime / Data / Bills
  - Status: All / Successful / Failed / Pending
  - Search: by recipient name or Nomba reference number
- [ ] **Transaction table** (desktop) / **list** (mobile):
  - Columns: Type icon | Description | Recipient | Amount | Date | Status badge
  - Status colours: green Successful, red Failed, yellow Pending
  - Row click → Transaction Detail Modal
- [ ] **Transaction Detail Modal:**
  - Nomba reference number (most important for Nomba integration score)
  - Recipient, bank, amount, fee, net amount, date-time, status
  - "Repeat Transaction" → pre-fills chat input
- [ ] **Pagination or infinite scroll**
- [ ] **Empty state** — Illustrated + "No transactions found. Start chatting with Lumo."
- [ ] **Shimmer skeleton rows** while fetching
- [ ] **CSV export** button (stretch goal)

---

### F. Settings Page

**What:** User profile and account management.

**Tasks:**
- [ ] **Create `/settings/page.tsx`**
- [ ] **Profile section:**
  - Auto-generated DiceBear avatar
  - Display name (editable), email (read-only)
- [ ] **Security section:**
  - Change password form
  - OTP toggle for transaction verification
  - PIN setup UI placeholder
- [ ] **Notification preferences** (UI only)
- [ ] **Danger zone** — Delete account (confirmation modal)

---

### G. Responsive Design & Mobile Optimization

**What:** Nigerian users are majority mobile. The app must work perfectly on phones.

**Tasks:**
- [ ] **Mobile-first CSS** — Design mobile first, enhance upward
- [ ] **Breakpoints:**
  - `< 640px` — Mobile: sidebar hidden (hamburger), stacked layout
  - `640px–1024px` — Tablet: sidebar collapsible
  - `> 1024px` — Desktop: sidebar fixed, two-column dashboard
- [ ] **Mobile sidebar** — Slide-in drawer with overlay backdrop
- [ ] **Tap targets** — All buttons/links minimum 44×44px
- [ ] **No hover-only critical states** — Every hover interaction must have a touch equivalent
- [ ] **Test at 390px** (iPhone 14) and **360px** (Android)

---

### H. Animations & Motion Design

**What:** Motion makes Lumo feel alive and premium. Framer Motion is already in `package.json`.

**Tasks:**
- [ ] **Page transitions** — Fade-in/out between routes
- [ ] **Message entrance** — Chat bubbles slide in from bottom (user) or left (assistant)
- [ ] **Skeleton → content** — Fade from skeleton to loaded data
- [ ] **Transaction confirmation card** — Slides up from chat bottom
- [ ] **Success checkmark** — Animated SVG draw-on-path checkmark on receipt
- [ ] **Balance toggle** — Smooth blur/unblur when hiding balance
- [ ] **Quick action hover** — `scale(1.02)` at 200ms ease
- [ ] **Reduced motion** — All animations wrapped in `prefers-reduced-motion` check

**Motion Duration Standards (Engineering Playbook):**
| Priority | Duration | Use For |
|----------|----------|---------|
| Micro | 100–150ms | Hover, focus states |
| Standard | 200–300ms | Modals, dropdowns, page transitions |
| Complex | 400–600ms | Full-page entrances, data reveals |

---

### I. Loading, Empty & Error States

**What:** Every screen in all 7 states. This is what separates amateur from production-quality work.

**The 7 UI States (Engineering Playbook § 03.1):**
| State | Your Implementation |
|-------|---------------------|
| **Loading** | Skeleton cards (dashboard), shimmer rows (transactions), spinner (chat) |
| **Empty** | Illustrated empty state with CTA for transactions + first-load chat |
| **Partial** | Show available data + "Loading more..." |
| **Error** | Inline error + retry button — NEVER just `console.log` |
| **Success** | Receipt card + green toast |
| **Disabled** | Chat input greyed + cursor-not-allowed while AI responds |
| **Populated** | The happy path — all data present |

**Components to build:**
- [ ] `<SkeletonCard />` — Animated shimmer for wallet/transaction cards
- [ ] `<SkeletonRow />` — For transaction list rows
- [ ] `<EmptyState icon title description action />` — Reusable across all empty views
- [ ] `<ErrorState message onRetry />` — Human-readable error + retry
- [ ] `<LoadingSpinner size />` — Consistent spinner across the app
- [ ] Toast system via `react-hot-toast` (already installed):
  - Success → green toast
  - Failure → red toast with "Try again" action
  - Network error → yellow toast

---

### J. Accessibility

**Engineering Playbook Minimum Checklist:**
- [ ] All images have descriptive `alt` text
- [ ] Tab order is logical across all pages
- [ ] Colour contrast ≥ 4.5:1 (especially on dark backgrounds)
- [ ] Focus indicators visible — never `outline: none` without custom replacement
- [ ] Every form `<input>` has an associated `<label>`
- [ ] Error messages linked via `aria-describedby`
- [ ] Modals trap focus when open
- [ ] Chat message list has `role="log"` and `aria-live="polite"`
- [ ] Icon-only buttons have `aria-label`

---

### K. State Management

**What:** Zustand for global state, TanStack Query for server state.

**Existing:** `store/chat-store.ts` (messages + loading)

**Tasks:**
- [ ] **Extend `chat-store.ts`:**
  - `messages[]`, `isLoadingAiResponse`, `pendingTransaction` (null | TransactionIntent)
  - Actions: `addMessage()`, `setLoadingAiResponse()`, `setPendingTransaction()`, `clearPendingTransaction()`
- [ ] **Create `auth-store.ts`:**
  - `user` (name, email, id), `isAuthenticated`, `jwtToken`
  - Actions: `setAuthenticatedUser()`, `clearAuthenticatedUser()`, `setJwtToken()`
- [ ] **Create `wallet-store.ts`:**
  - `walletBalance`, `isBalanceVisible`, `recentTransactionList[]`
  - Actions: `setWalletBalance()`, `toggleBalanceVisibility()`, `setRecentTransactionList()`
- [ ] **Add `@tanstack/react-query`** for server-fetched data:
  - `useWalletBalance()` → cache 30s, refetch on window focus
  - `useTransactionList()` → cache 60s, refetch on focus
  - `useRecentTransactions()` → last 5, cache 30s

---

### L. API Integration (Frontend Side)

**What:** Wire your UI to the Next.js API routes (which proxy to the Cloudflare Worker).

**API contracts (coordinate with Team Members 1 & 3):**

| Route | Your Component | Payload |
|-------|---------------|---------|
| `POST /api/chat` | `chat-interface.tsx` | `{ message, history }` → `{ response }` |
| `GET /api/wallet` | `wallet-overview.tsx` | → `{ balance, accountNumber, bankName }` |
| `GET /api/transactions` | transactions page | → `{ transactions[] }` |
| `POST /api/transactions/execute` | Confirmation card | `{ transactionId }` → `{ success, receipt }` |
| `POST /api/auth/login` | Login page | `{ email, password }` → `{ token, user }` |
| `POST /api/auth/register` | Register page | `{ name, email, password }` → `{ userId }` |
| `POST /api/auth/verify-otp` | OTP component | `{ userId, otp }` → `{ token, user }` |

**Rules:**
- Use `axios` (already installed) for API calls
- Always handle loading + success + error for every request
- Never surface raw API error text to the user — translate to human-readable
- Attach `Authorization: Bearer <jwtToken>` to all authenticated requests

---

### M. Reusable Components Library

**What:** A clean, consistent component library the whole team can use.

**Proposed structure:**
```
app/components/
├── ui/                    ← Base primitives (zero business logic)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Spinner.tsx
│   └── Skeleton.tsx
├── layout/
│   ├── Sidebar.tsx        ← Exists (needs enhancement)
│   ├── PageHeader.tsx
│   └── Container.tsx
├── chat/                  ← Exists
├── dashboard/             ← Exists
├── transactions/          ← Create these
│   ├── TransactionRow.tsx
│   ├── TransactionModal.tsx
│   ├── TransactionFilters.tsx
│   ├── TransactionConfirmationCard.tsx
│   └── TransactionReceiptCard.tsx
└── auth/                  ← Create these
    ├── OTPInput.tsx
    └── AuthCard.tsx
```

**Rules (from `AGENTS.md`):**
- TypeScript everywhere — zero `any` types
- Long, clear names: `onSendMessage` not `onSend`, `isLoadingAiResponse` not `loading`
- UI primitives know nothing about business logic
- Feature components manage data, call hooks

---

### N. Forms & Validation

**What:** All user input validated before submission. React Hook Form (already installed).

**Engineering Playbook Rules:**
- Every field has a `<label>` — never rely on placeholder text alone
- Error messages appear **below the field**, not in toasts
- Validate on `blur`, not every keystroke
- Submit button disabled until all required fields are valid

**Forms to build:**
- [ ] **Login** — email (required, valid format), password (required, min 8 chars)
- [ ] **Register** — name, email, password, confirm password (must match)
- [ ] **OTP** — 6 individual digit inputs, paste detection, auto-submit on 6th digit
- [ ] **Chat input** — non-empty check only
- [ ] **Settings** — edit name, change password (old + new + confirm)

---

### O. Transaction Receipts & Confirmations

**What:** The fintech moment of truth. Must inspire total trust. This is where your Nomba integration score lives.

**The full flow:**
1. User: "Send ₦25,000 to John Doe"
2. AI interprets intent → returns structured transaction data
3. Frontend renders `<TransactionConfirmationCard>` inside chat
4. User clicks **Confirm** → button enters loading state → `POST /api/transactions/execute`
5. Success → card animates into `<TransactionReceiptCard>` (Framer Motion)
6. Failure → card shows error message + "Try Again" button

**Receipt card must include:**
- Animated green checkmark
- "Transfer Successful"
- Nomba Reference: `NMB-2026-XXXXXXX` ← judges check for this
- Amount: ₦25,000 | Fee: ₦52.50 | Total: ₦25,052.50
- Recipient: John Doe · GTBank · 0123456789
- Date-time: 2 July 2026, 09:45 PM WAT
- "Share Receipt" | "Done" buttons

---

## 4. Judging Criteria Alignment

| Criterion | Weight | How Your Frontend Work Scores |
|-----------|--------|-------------------------------|
| **Technical Execution** | 25% | Clean Next.js 15 architecture, TypeScript, proper hooks & state management, working API integration |
| **Security & Reliability** | 20% | Form validation (no bad data sent), confirmation step (no accidental payments), auth route guards, error handling |
| **Product UX & Clarity** | 15% | Responsive design, all 7 UI states, animations, clear information hierarchy |
| **Nomba Integration Depth** | 20% | Confirmation card + receipt showing Nomba reference numbers, Nomba-powered features prominently labelled |
| **Problem Relevance** | 20% | "Chat to pay" UX directly solves the fragmented African fintech problem stated in the PRD |

---

## 5. Engineering Standards (from Engineering Playbook)

### Code Quality
- **Clear over clever** — More lines is fine if it improves readability
- **Descriptive names** — `recentTransactionList` not `txns`, `isWalletBalanceVisible` not `show`
- **One hook, one concern** — `useWalletBalance()` only touches balance data
- **Thin components** — Business logic in hooks, presentation in JSX

### Structure
> Feature components live in `components/features/` — they know about business logic.  
> UI primitives live in `components/ui/` — they know nothing about business logic.

### Performance
- Lazy-load heavy components (e.g., Recharts spending charts) with `next/dynamic`
- Use `next/image` for all images
- `useCallback` + `useMemo` for expensive computations
- Profile with React DevTools before shipping

### Branding & SEO
- Unique `<title>` and `<meta description>` on every page
- Single `<h1>` per page
- OpenGraph tags in `layout.tsx`
- SVG logos — never PNG for logos

### Hackathon Principle (from Playbook)
> "The winners usually nail 3 things: **clarity, demo, and relevance.**"

Your UI must:
- Tell the story in **3 seconds**: Who it's for, what it does, why it matters
- Demo without friction — pre-populate data for judges
- Work on mobile — judges check on their phones

---

## 6. Sprint Execution Plan

Building phase: **1–7 July 2026**

### Day 1 (1 July) — Foundation
- [ ] All page route stubs created
- [ ] `tailwind.config.js` with design system tokens (colours, font, radius)
- [ ] `globals.css` with CSS custom properties
- [ ] Root layout with metadata + fonts
- [ ] Base components: `Button`, `Input`, `Card`, `Spinner`, `Skeleton`

### Day 2 (2 July) — Auth & Shell
- [ ] Login page + form validation
- [ ] Register page + OTP component
- [ ] Sidebar (fixed desktop, drawer mobile)
- [ ] Dashboard layout shell

### Day 3 (3 July) — Chat Interface
- [ ] Polish `chat-interface.tsx`, `chat-messages.tsx`, `chat-input.tsx`
- [ ] `TransactionConfirmationCard`
- [ ] `TransactionReceiptCard` with Framer Motion checkmark
- [ ] Typing indicator + empty state + suggestion chips
- [ ] Wire to `/api/chat`

### Day 4 (4 July) — Dashboard & Wallet
- [ ] `wallet-overview.tsx` with balance, quick actions, visibility toggle
- [ ] `recent-transactions.tsx` with skeleton + empty state
- [ ] Wire to `/api/wallet` + `/api/transactions`
- [ ] Full dashboard page composition

### Day 5 (5 July) — Transactions & Settings
- [ ] Full `/transactions` page with filters + modal
- [ ] `/settings` page
- [ ] All loading/error/empty states across all pages

### Day 6 (6 July) — Polish
- [ ] Framer Motion animations: page transitions, message entrance, receipt
- [ ] Full responsive sweep at all breakpoints
- [ ] Accessibility audit: keyboard nav, aria labels, contrast
- [ ] Error handling review: every API call guarded

### Day 7 (7 July) — Demo & Submit
- [ ] Pre-populate demo data (pre-fund test accounts, seed transaction history)
- [ ] Full end-to-end test on actual mobile device
- [ ] Critical bug fixes only (scope freeze)
- [ ] Verify hosted URL (Vercel) is public and accessible
- [ ] Record 2–3 min demo video — your chat UI is the star

---

## 7. Submission Checklist

> Deadline: **11:59 PM WAT, 7 July 2026**

**Hackathon requirements:**
- [ ] Public GitHub repo with commit history within hackathon dates
- [ ] Working MVP URL (Vercel: `cd frontend && vercel deploy`)
- [ ] 2–3 min demo video: chat → confirmation → receipt flow
- [ ] Architecture note in README: auth, webhooks, data handling

**Frontend quality gate:**
- [ ] App loads on mobile (390px) without horizontal scroll or layout breaks
- [ ] Login → register → OTP → dashboard flow works
- [ ] Chat receives AI response for any free-text input
- [ ] Confirmation card appears for "Send ₦X to [name]"
- [ ] Receipt card appears with Nomba reference after confirmed transaction
- [ ] No blank screens (all loading states implemented)
- [ ] No unhandled errors (all error states implemented)
- [ ] `npm run build` exits with 0 errors
- [ ] `npm run lint` exits with 0 errors
- [ ] Every page has `<title>` + `<meta name="description">`

---

> 📌 **The demo is what wins. Build the happy path first.**  
> `"Send ₦10,000 to David"` → confirmation card → Confirm button → receipt card with Nomba reference  
> That 30-second flow is your entire pitch. Nail it.

---

## 8. Visual Direction, Design System & 3D Aesthetic

> **Design philosophy:** Lumo's UI should feel like a premium fintech product from 2027 — not a generic SaaS dashboard. Think 3D-ish depth, rich surfaces, tactile glassmorphism, and cinematic motion. Flat is out. Dimension is in.

---

### 8.1 — Commit Workflow (thebabalola GitHub Account)

Per the `commits-instructions.md`, all frontend contributions are made under:

| Field | Value |
|-------|-------|
| **GitHub username** | `thebabalola` |
| **Email** | `t.babalolajoseph@gmail.com` |
| **Switch auth** | `gh auth switch --user thebabalola` |

**Before any git push, set identity:**
```bash
git config user.name "thebabalola"
git config user.email "t.babalolajoseph@gmail.com"
```

**Commit rules (modular, no PRs needed for this project):**
- Commit after every meaningful logical unit: a component, a page, a hook, a feature block
- No bulk/chunk commits — modular commits at intervals
- Commit message style: imperative mood, explain the *why* not just the *what*
- Aim for **5–7 commits per day** during the build sprint (1–7 July)
- Avoid identical/repetitive messages across commits
- Run `npm run build` after significant changes to confirm it compiles

**Example commit sequence for frontend:**
```
feat: scaffold Next.js route structure and middleware auth guard
feat: add Tailwind design tokens - colours, fonts, radius, shadows
feat: build Button, Input, Card, Spinner base UI components
feat: implement login page with React Hook Form validation
feat: add OTP digit input component with auto-focus and paste support
feat: build responsive sidebar with DiceBear avatar integration
feat: implement wallet overview card with balance toggle animation
```

---

### 8.2 — Colour Scheme Options (All Options Listed)

These are all the proposed colour palette options. Pick one before coding and stick to it — do not mix. Each scheme creates a completely different emotional tone.

---

#### 🩸 Option A — Crimson Silk (Warm, Bold, Luxury)

| Name | Hex | Use |
|------|-----|-----|
| Soft Blush | `#FBE4E3` | Page background, card surfaces |
| Crimson Silk | `#D72638` | Primary CTA, active states, accent |
| Ruby Red | `#C8112E` | *(corrected from `#G811IE`)* Hover states, destructive actions |
| Deep Bordeaux | `#3A0D12` | *(corrected from `#3FOD12`)* Dark surfaces, sidebar, text |

**Mood:** Confident, premium, bold. Think luxury fintech — like a high-end private bank app.  
**Risk:** Red can feel alarming in a payments context if not balanced carefully.

---

#### 🧊 Option B — Ice & Sapphire (Cool, Trustworthy, Corporate)

| Name | Hex | Use |
|------|-----|-----|
| Ice Blue | `#D6E6F3` | Page background, light surfaces |
| Powder Blue | `#A6C5D7` | Cards, secondary backgrounds |
| Sapphire | `#0F52BA` | *(corrected from `#OF52BA`)* Primary CTAs, brand accent |
| Deep Navy | `#000926` | Dark mode base, sidebar, text |

**Mood:** Trustworthy, professional, calm. Feels like a serious fintech — think Stripe, Wise, or Revolut.  
**Recommendation:** ✅ **Strong candidate for a payments app.** Blue codes trust.

---

#### 🌅 Option C — Ember & Terracotta (Warm, Human, African)

| Name | Hex | Use |
|------|-----|-----|
| Cream | `#FCECDC` | Page background, light surface |
| Ember Orange | `#EB6028` | Primary CTA, active states, accent |
| Deep Brown | `#320A03` | Dark surfaces, sidebar, rich text |

**Mood:** Warm, human, grounded. Feels distinctly African — warm earth tones, approachable. Connects emotionally with the target user (Nigeria, West Africa).  
**Recommendation:** ✅ **Most differentiated option for this hackathon.** No fintech looks like this. Memorable.

---

> ✅ **Confirmed pick:** **Option C (Ember & Terracotta) — 3-colour system only.**  
> `#FCECDC` and `#EB6028` are the two primary colours used interchangeably by mode.  
> `#320A03` handles CTAs, anchoring text, and deep accents. No other palette is in use.

---

### 8.3 — Typography Options

Drop Poppins. Use fonts that feel more editorial, premium, and intentional.

| Font | Style | Where to Get | Best For |
|------|-------|-------------|---------|
| **Aktiv Grotesk** | Neo-grotesque, sharp, clean | [fonts.adobe.com](https://fonts.adobe.com) | Headings, hero text — feels like a modern agency |
| **Agoma** | Geometric, wide letterforms | [Fontshare / independent foundries] | Display headings, logo mark |
| **Epic Pro** | Condensed, powerful display font | [MyFonts / independent] | Hero sections, large stat numbers |
| **DM Sans** | Humanist sans-serif | Already in the repo (`globals.css`) | Body text, UI copy — good fallback |
| **Inter** | Neutral, screen-optimised | Google Fonts | UI micro-text, data labels |
| **Clash Display** | Geometric, modern | [Fontshare — free](https://www.fontshare.com/fonts/clash-display) | Hero headings — free alternative to Aktiv |
| **Cabinet Grotesk** | Elegant grotesque | [Fontshare — free](https://www.fontshare.com/fonts/cabinet-grotesk) | Body + headings combo — free and premium-feeling |
| **Switzer** | Clean grotesque | [Fontshare — free](https://www.fontshare.com/fonts/switzer) | Body text alternative |

**Recommended pairing:**
```
Hero headings:   Aktiv Grotesk Bold / Clash Display (700)
Section titles:  Aktiv Grotesk Medium / Cabinet Grotesk (600)
Body text:       DM Sans Regular (400) — already configured
Data / numbers:  Inter Mono or tabular-nums variant
```

---

### 8.4 — Animation Libraries

These can be used individually or composed together. Choose based on what the effect requires.

| Library | What it does best | Install |
|---------|-------------------|---------|
| **GSAP (GreenSock)** | 🏆 Industry gold standard. Complex timelines, scroll-triggered reveals, morphing, 3D transforms. The most powerful option. | `npm i gsap` |
| **Anime.js** | Lightweight alternative to GSAP. Great for SVG animations, number counting, staggered entrances. Simpler API. | `npm i animejs` |
| **Lenis** | Smooth scroll library. Gives the page that buttery momentum-scroll feel you see on premium agency sites. Use alongside GSAP. | `npm i @studio-freight/lenis` |
| **Barba.js** | Page transition manager. Handles route-to-route animated transitions in SPA style. Pairs with GSAP. | `npm i @barba/core` |
| **Framer Motion** | Already in the repo. Great for React component-level animations (mount/unmount, gesture animations). Keep using for chat UI, cards, modals. | Already installed |

**Recommended combination for Lumo:**
```
Framer Motion  →  Component animations (cards, modals, chat bubbles, receipts)
GSAP + ScrollTrigger → Landing page hero reveal, scroll animations
Lenis → Smooth scroll across the whole site
Anime.js → Number counting animations (₦ balance reveal, stats)
```

---

### 8.5 — 3D Design Direction

**Goal:** Lumo's UI should feel 3D-ish — depth through shadows, layered surfaces, 3D icons, and dimensional elements. Not flat. Think "product has weight."

#### 3D Icons & Assets

| Source | What's There | Best For | Cost |
|--------|-------------|---------|------|
| **[3dicons.co](https://www.3dicons.co)** | High-quality, consistent 3D icon library — phone, wallet, card, lock, chart icons | Dashboard icons, feature section icons | Free |
| **[icons8.com/l/3d](https://www.icons8.com/l/3d)** | Massive 3D icon library, multiple styles (clay, glassmorphism, realistic) | Hero section, onboarding icons | Free tier + paid |
| **[Spline (spline.design)](https://spline.design)** | Build and export interactive 3D scenes — can embed live 3D in Next.js via `<iframe>` or Spline React component | Hero 3D background, animated 3D card/phone mockup | Free tier available |
| **[Sketchfab](https://sketchfab.com)** | Free 3D model library — downloadable `.glb` files for Three.js | Background 3D objects | Free |
| **[Handz (handz.design)](https://www.handz.design)** | 3D hand + phone mockup assets — perfect for fintech "holding your app" visuals | Hero section, feature showcases | Free |
| **[Blush Design](https://blush.design)** | Customisable 3D-style illustration packs | Auth pages, empty states, onboarding | Free tier |
| **[Artify 3D Lettering](https://www.artify.co/3d-lettering)** | Generate 3D text/lettering assets | Hero headline treatment, logo mark | Check pricing |
| **[Storyset](https://storyset.com)** | Animated illustrations (can export as SVG/Lottie) | Empty states, error states | Free |

> ✅ **Easiest to actually use in code:** `3dicons.co` (PNG/SVG downloads, drop straight into Next.js) and `icons8.com/l/3d` (same).  
> ✅ **Most impressive for judges:** Spline embedded 3D scene in the hero. One interactive 3D element in the hero immediately makes the project look premium.

#### How to embed a Spline 3D scene in Next.js:
```bash
npm install @splinetool/react-spline @splinetool/runtime
```
```tsx
import Spline from '@splinetool/react-spline';

export default function HeroSection() {
  return (
    <div className="relative w-full h-[600px]">
      <Spline scene="https://prod.spline.design/your-scene-url/scene.splinecode" />
    </div>
  );
}
```

---

### 8.6 — Landing Page & UI Inspiration

Study these before designing. Don't copy — absorb and adapt.

#### Agency/Motion Inspiration

| Site | Why Study It | What to Steal |
|------|-------------|--------------|
| **[motionsites.ai](https://motionsites.ai)** | Curated gallery of sites with excellent motion design | Hero animation patterns, scroll-triggered reveals |
| **[homeies-f662e0.webflow.io](https://homeies-f662e0.webflow.io)** | Webflow showcase with depth and texture | Card design, layered layout composition |
| **[awwwards.com](https://www.awwwards.com)** | World's best web design awards — filter by "fintech" | High-bar visual reference |
| **[godly.website](https://godly.website)** | Curated collection of experimental and premium sites | Animation ideas, typography scale |
| **[siteinspire.com](https://www.siteinspire.com)** | Clean, curated design inspiration | Layout structure, whitespace usage |
| **[lapa.ninja](https://www.lapa.ninja)** | Landing page inspiration specifically | Hero layout patterns |

#### Fintech Product UI Inspiration

| App / Site | Why Reference It |
|-----------|----------------|
| **Stripe.com** | World-class fintech landing. Gradient mesh hero, 3D card animations, scroll reveals |
| **Revolut.com** | Dark mode fintech done right — bold typography, product shots, clear value props |
| **Paystack.com** | Nigerian fintech — closest cultural/market reference. Study their hero layout |
| **Mono.co** | Nigerian API fintech — clean, minimal, developer-focused |
| **Brex.com** | Premium card-based layout, glassmorphism surfaces, 3D card renders |
| **Linear.app** | Not fintech, but the motion and depth are reference-level — hero animation especially |

---

### 8.7 — Landing Page Section Plan (Hero-first)

The landing page (if built) should tell the product story in one scroll. Hero is the most important section — judges form their opinion in the first 3 seconds.

#### Page Structure:
```
[  HERO  ]  ← Most time spent here. 3D elements. Bold headline. One CTA.
   ↓
[ PROBLEM ]  ← "Managing money in Nigeria is fragmented"
   ↓
[ SOLUTION ] ← How Lumo works — animated chat demo (GIF or live embed)
   ↓
[ FEATURES ] ← 3D icons + feature cards: Send, Airtime, Bills, Insights
   ↓
[ HOW IT WORKS ] ← 3-step numbered flow with motion
   ↓
[ SOCIAL PROOF ] ← "Built on Nomba" trust badge + hackathon context
   ↓
[ CTA FOOTER ] ← "Start chatting with Lumo" → /login
```

#### Hero Section Spec:
```
Background:     Dark (Deep Bordeaux / Deep Navy / Deep Brown depending on scheme)
Headline:       Large (72–96px desktop), bold, 3D lettered or gradient treated
                e.g. "Finance. Finally Conversational."
Subheadline:    One sentence — what Lumo does and for whom
CTA Button:     Primary + secondary ("Get started" / "Watch demo")
Visual:         Spline 3D scene OR phone mockup with Handz 3D hand asset
                showing the chat interface with a live "Send ₦10,000 to David" flow
Motion:         GSAP staggered entrance — headline first, subtext, then CTA, then 3D visual
Scroll cue:     Lenis smooth scroll activated from this point
```

---

### 8.8 — 3D UI Implementation Techniques

**Depth without actual 3D (CSS-only):**
```css
/* Card with 3D depth feel */
.lumo-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  transform-style: preserve-3d;
}

/* Subtle 3D tilt on hover via JS (GSAP) */
.lumo-card:hover {
  transform: perspective(1000px) rotateX(2deg) rotateY(-3deg);
  transition: transform 300ms ease;
}
```

**Glassmorphism layering:**
```css
/* Dashboard panel — glass over dark surface */
.glass-panel {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

**Number counter animation (Anime.js):**
```typescript
import anime from 'animejs';

// Animate balance reveal: 0 → ₦125,430
anime({
  targets: balanceRef.current,
  innerHTML: [0, 125430],
  round: 1,
  duration: 1200,
  easing: 'easeOutExpo',
  update: (anim) => {
    balanceRef.current!.innerHTML =
      '₦' + Math.floor(anim.animations[0].currentValue).toLocaleString();
  },
});
```

---

### 8.9 — Quick Visual Decision Summary

| Decision | Options | Pick When Ready |
|----------|---------|----------------|
| **Colour scheme** | A: Crimson Silk / B: Ice & Sapphire / C: Ember & Terracotta | — |
| **Primary font** | Aktiv Grotesk, Clash Display, Cabinet Grotesk | — |
| **Animation library** | GSAP + Lenis (landing) + Framer Motion (dashboard) | Recommended combo |
| **3D icons** | 3dicons.co (easiest) + icons8.com 3D | Start here |
| **Hero visual** | Spline scene OR Handz 3D phone + hand | Spline if time allows |
| **Inspiration** | motionsites.ai + Stripe + Paystack | Study before designing |
| **3D lettering** | artify.co 3D lettering | For hero headline only |

---

> 🎯 **The 3D-ish direction in one sentence:**  
> Dark surfaces. Layered glassmorphism cards. 3D icons from `3dicons.co`. Spline hero if time allows. GSAP scroll reveals. Lenis smooth scroll. Bold display font (Clash Display or Aktiv Grotesk). One of the three colour schemes chosen and committed to before a single line of CSS is written.

---

## 9. Layout Architecture & Sketch Diagrams

> Everything the user sees is shaped by layout decisions made before a single component is coded. These diagrams are the source of truth for the Lumo UI structure.

---

### 9.1 — The Two-Zone Rule

Lumo has two fundamentally different layout zones that must never be confused:

```
┌─────────────────────────────────────────────────────┐
│  ZONE 1: PUBLIC ZONE (Landing + Auth)               │
│                                                     │
│  Layout:  Full-width, no sidebar, top navbar        │
│  Routes:  /   /login   /register                    │
│  Feel:    Marketing page — wide, cinematic, bold    │
└─────────────────────────────────────────────────────┘
                        │
                   user logs in
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  ZONE 2: APP ZONE (All authenticated pages)         │
│                                                     │
│  Layout:  Left sidebar (240px) + main content area  │
│  Routes:  /dashboard   /transactions   /settings    │
│  Feel:    Productivity tool — focused, persistent   │
└─────────────────────────────────────────────────────┘
```

**Why two zones?**  
Once a user is logged in, they are not browsing — they are *doing tasks*. The sidebar anchors navigation so the full vertical height is available for the chat interface, which is the entire product.

---

### 9.2 — Zone 1 — Landing Page Layout

**Nav type: Top Navbar** (fixed, glassmorphic background on scroll)

```
╔══════════════════════════════════════════════════════════════╗
║  [🌟 Lumo]        [Features]  [How it works]  [→ Sign in]   ║ ← Fixed navbar
║                                                              ║   transparent → glass on scroll
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  HERO SECTION                             100vh              ║
║                                                              ║
║  left column (text)          right column (3D visual)        ║
║  ─────────────────           ───────────────────────         ║
║  "Finance.                   ┌───────────────────────┐       ║
║   Finally                    │                       │       ║
║   Conversational."           │  [Spline 3D scene     │       ║
║                              │   OR Handz phone      │       ║
║  One-line subtext here       │   mockup showing      │       ║
║  about Lumo + Nomba          │   live chat UI]       │       ║
║                              │                       │       ║
║  [→ Get Started]             └───────────────────────┘       ║
║  [▶ Watch Demo]                                              ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  PROBLEM SECTION            (GSAP + Lenis scroll reveal)     ║
║  "Managing money in Nigeria means switching between          ║
║   5 different apps just to complete 1 financial task."       ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  HOW IT WORKS               3-step horizontal flow           ║
║                                                              ║
║  [1. Chat]  ──→  [2. Confirm]  ──→  [3. Done in seconds]    ║
║   Type what       Review the         Nomba executes          ║
║   you want        transaction         instantly              ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  FEATURES GRID              3D icon cards from 3dicons.co    ║
║                                                              ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    ║
║  │ 💸       │  │ 📱       │  │ 🧾       │  │ 📊       │    ║
║  │  Send    │  │ Airtime  │  │  Bills   │  │Insights  │    ║
║  │  Money   │  │          │  │          │  │          │    ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘    ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  TRUST BAND                 dark strip, full width           ║
║  "Powered by Nomba  ·  Bank-grade security  ·  99.9% uptime" ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  FOOTER CTA                 full-width dark section          ║
║  "Ready to simplify your finances?"                         ║
║  [→ Start chatting with Lumo]                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Landing page colour application:**
- Background: `#320A03` (Deep Brown) throughout
- Ember gradient glow radiating from bottom of hero upward
- Navbar links: `#FCECDC` (Cream) at 80% opacity
- Hero headline: `#FCECDC` full opacity, bold display font
- "Get Started" CTA button: `#320A03` (Deep Brown) — anchored, authoritative
- Feature card backgrounds: glassmorphic overlay on `#320A03`

---

### 9.3 — Zone 2 — App Shell Layout (Sidebar)

**Why sidebar over top navbar in the app:**
> The chat input is the primary action. A top navbar in the app zone would steal vertical height from the chat area — which is the entire product. A left sidebar preserves 100% vertical height for content.

```
╔════════════════╦══════════════════════════════════════════════╗
║                ║                                              ║
║   [🌟 Lumo]   ║                                              ║
║                ║                                              ║
║   ───────────  ║         MAIN CONTENT AREA                    ║
║                ║         (swaps per route)                    ║
║   💬 Chat      ║                                              ║
║   📋 Txns      ║         /dashboard → Dashboard view          ║
║   ⚙️  Settings  ║         /transactions → Transactions view    ║
║                ║         /settings → Settings view            ║
║                ║                                              ║
║                ║                                              ║
║   ───────────  ║                                              ║
║                ║                                              ║
║   [● Avatar]   ║                                              ║
║   Babalola     ║                                              ║
║   ↳ Sign out   ║                                              ║
║                ║                                              ║
╚════════════════╩══════════════════════════════════════════════╝
  240px fixed         flex: 1  (all remaining viewport width)
```

**Sidebar colour application:**
- Background: `#320A03` (Deep Brown) — same as landing, creates visual continuity
- Active nav item: left border `3px solid #EB6028` (Ember Orange) + slightly lighter bg
- Inactive nav items: `#FCECDC` at 55% opacity
- Avatar: DiceBear `avataaars` style seeded from user email
- Hover state: `#EB6028` at 10% opacity background tint

---

### 9.4 — Dashboard — The Core Screen

The dashboard is where judges spend the most time. Three-column composition: sidebar + chat + right panel.

```
╔════════════════╦══════════════════════════════════╦════════════════════╗
║                ║                                  ║                    ║
║   [🌟 Lumo]   ║   CHAT COLUMN                    ║   RIGHT PANEL      ║
║                ║                                  ║                    ║
║   ───────────  ║  ┌────────────────────────────┐  ║  ┌──────────────┐  ║
║                ║  │  Lumo Assistant   🟢 Live  │  ║  │   ₦125,430   │  ║
║ ▶ 💬 Chat     ║  │  Powered by Nomba           │  ║  │   [👁 Hide]  │  ║
║   📋 Txns     ║  ├────────────────────────────┤  ║  │              │  ║
║   ⚙️  Settings ║  │                            │  ║  │ GTBank       │  ║
║                ║  │                            │  ║  │ 0123456789   │  ║
║                ║  │   [Welcome screen when     │  ║  ├──────────────┤  ║
║   ───────────  ║  │    no messages yet]        │  ║  │ Quick Actions│  ║
║                ║  │                            │  ║  │ [Send Money] │  ║
║   [● Avatar]  ║  │   OR                       │  ║  │ [Airtime   ] │  ║
║   Babalola    ║  │                            │  ║  │ [Data      ] │  ║
║               ║  │   [Chat message thread]    │  ║  │ [Bills     ] │  ║
║               ║  │                            │  ║  └──────────────┘  ║
║               ║  │   [Confirmation card       │  ║                    ║
║               ║  │    when transaction        │  ║  ┌──────────────┐  ║
║               ║  │    is pending]             │  ║  │ Recent Txns  │  ║
║               ║  │                            │  ║  │ ──────────── │  ║
║               ║  ├────────────────────────────┤  ║  │ ₦25k → John │  ║
║               ║  │ [Send ₦10k] [Airtime] ...  │  ║  │ ₦1k Airtime │  ║
║               ║  │ ← quick suggestion chips   │  ║  │ ₦3.5k DSTV  │  ║
║               ║  ├────────────────────────────┤  ║  │              │  ║
║               ║  │  [____type a message___ 🎙]│  ║  │  View all →  │  ║
║               ║  └────────────────────────────┘  ║  └──────────────┘  ║
║               ║                                  ║                    ║
╚═══════════════╩══════════════════════════════════╩════════════════════╝
  240px fixed        flex: 1.5  (~60%)               flex: 1  (~40%)
```

**Key interaction notes:**
- Clicking any quick action button (Send, Airtime, Data, Bills) **pre-fills the chat input** with the relevant prompt and focuses the input
- The right panel is **read-only context** — all actions happen via chat
- When a transaction confirmation card appears in chat, the right panel dims slightly to focus attention on the confirmation
- Transaction receipt replaces the confirmation card *in-place* via Framer Motion animation

---

### 9.5 — Confirmed Colour Token Mapping

Colour scheme locked: **Option C — 3-colour system, mode-aware**

> This is a pure 3-colour palette. `#FCECDC` and `#EB6028` are the two primary colours and swap roles depending on light or dark mode. `#320A03` is the constant anchor used for CTAs, deep text, and structural elements in both modes.

#### Light Mode

```
Token               Hex Value            Role in Light Mode
─────────────────   ──────────────────   ──────────────────────────────────────────────────
Cream (PRIMARY)     #FCECDC              Page background, card surfaces, main bg
Ember (SECONDARY)   #EB6028              Headings, icons, active states, emphasis text
Deep Brown          #320A03              CTAs (buttons), strong body text, nav text,
                                         borders, footer backgrounds
Muted Cream         rgba(252,236,220,.7) Placeholder text, secondary labels, captions
Success Green       #22C55E              Receipt checkmark, "Successful" badge, toasts
Danger Red          #EF4444              Failed transactions, error states, destructive
```

#### Dark Mode

```
Token               Hex Value            Role in Dark Mode
─────────────────   ──────────────────   ──────────────────────────────────────────────────
Ember (PRIMARY)     #EB6028              Page background tint, card surface overlay,
                                         primary surface colour
Cream (SECONDARY)   #FCECDC              Headings, body text, icon fills, active states
Deep Brown          #320A03              Sidebar bg, hero bg, page dark base, CTA buttons,
                                         deep surfaces, footer
Muted Cream         rgba(252,236,220,.5) Timestamps, secondary labels, placeholders
Success Green       #22C55E              Receipt checkmark, "Successful" badge, toasts
Danger Red          #EF4444              Failed transactions, error states, destructive
```

**The mode-swap rule:**
> 🌤 **Light mode:** `#FCECDC` leads (backgrounds, surfaces) — `#EB6028` accents (text, icons, highlights)  
> 🌑 **Dark mode:** `#EB6028` leads (surfaces, primary colour) — `#FCECDC` accents (text, icons, highlights)  
> `#320A03` never swaps — it is always the deep anchor: CTAs, structural text, sidebar, footer

---

### 9.6 — Mobile Behaviour

**Mobile breakpoint: < 640px**

```
┌────────────────────────────┐
│  [☰]    🌟 Lumo    [🔔]   │  ← Minimal top bar (hamburger + logo + notif)
├────────────────────────────┤
│                            │
│  ₦125,430   [👁]           │  ← Wallet card (scrollable, above chat)
│  GTBank • 0123456789       │
│  [Send] [Airtime] [Bills]  │
│                            │
├────────────────────────────┤
│                            │
│   Lumo Assistant  🟢       │
│                            │
│   [chat messages]          │
│                            │
│   [quick chips]            │
│   [___type here_______🎙]  │
│                            │
└────────────────────────────┘

  ↑ Sidebar slides in from left when [☰] is tapped
  ↑ Dark backdrop overlay behind it
  ↑ Tap anywhere on backdrop to close
```

**Mobile-specific rules:**
- Wallet card scrolls off screen upward — chat always fills the viewport bottom
- Chat input stays **sticky at the bottom** (position: sticky, bottom: 0)
- All tap targets minimum **44×44px**
- No hover states — everything touch-first
- Sidebar push-from-left with Framer Motion `x: -240 → 0` animation, 250ms ease

---

### 9.7 — Layout Decision Summary

| Decision | Choice | Rationale |
|----------|--------|----------|
| **Landing nav type** | Top navbar | Marketing page — full width needed for hero |
| **App nav type** | Left sidebar 240px | Preserves full vertical height for chat |
| **Mobile nav** | Hamburger → slide-in drawer | Standard pattern — users expect this |
| **Dashboard layout** | 3-column (sidebar + 60% chat + 40% panel) | Chat is primary; wallet is always-visible context |
| **Mobile dashboard** | Stacked: wallet card above, chat below | Chat stays at bottom — thumb-friendly |
| **Chat input position** | Sticky bottom | Always reachable — it's the core action |
| **Sidebar width** | 240px | Enough for icon + label; not so wide it competes with content |
| **Colour: light mode primary** | `#FCECDC` Cream | Page bg, card surfaces — leads in light mode |
| **Colour: dark mode primary** | `#EB6028` Ember Orange | Surface colour — leads in dark mode |
| **Colour: constant anchor** | `#320A03` Deep Brown | CTAs, sidebar, footer, deep text — never swaps |
| **Colour system** | 3-colour mode-aware | Cream ↔ Orange swap by mode; Brown anchors both |

---

*Role: Frontend & Product Experience Lead | Lumo Finance | Nomba x DevCareer Hackathon 2026*
