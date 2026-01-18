# IMCS - Action Plan & Implementation Guide

## 🎯 Quick Summary

Transform the current single-page HTML site into a React-based interactive platform with:
- Voting system for submissions ("texts from last night" style)
- Circle drawing + typing test gates for form access
- Wallet-based profiles with whitelist status
- Leaderboard for top submissions and voters
- Maintain exact current aesthetic and vibe

---

## 📋 Phase 0: Pre-Development Decisions

Before writing any code, we need to make these key decisions:

### Decision 1: Backend & Database
**Options:**
- [ ] **Supabase** (RECOMMENDED)
  - ✅ Free tier: 500MB database, 2GB bandwidth
  - ✅ Real-time subscriptions built-in
  - ✅ Built-in auth if needed
  - ✅ Simple API, good docs
  - ✅ Postgres under the hood
- [ ] Firebase Firestore
  - ⚠️ More expensive at scale
  - ✅ Good real-time support
  - ⚠️ NoSQL (less powerful queries)
- [ ] Custom API + PostgreSQL
  - ✅ Full control
  - ⚠️ More setup required
  - ⚠️ Need separate hosting

**RECOMMENDED:** Supabase

---

### Decision 2: Wallet Connection
**Options:**
- [ ] **RainbowKit + wagmi** (RECOMMENDED)
  - ✅ Beautiful UI out of the box
  - ✅ Supports all major wallets
  - ✅ Great developer experience
  - ✅ Well maintained
- [ ] Web3Modal + ethers
  - ✅ Also solid option
  - ⚠️ More manual setup
- [ ] Custom wallet connection
  - ⚠️ Not recommended unless you have specific needs

**RECOMMENDED:** RainbowKit + wagmi

---

### Decision 3: Deployment
**Options:**
- [ ] **Vercel** (RECOMMENDED for Next.js)
  - ✅ Zero-config deployment
  - ✅ Automatic HTTPS
  - ✅ CDN included
  - ✅ Free tier generous
  - ✅ Made by Next.js team
- [ ] Netlify
  - ✅ Also good option
  - ⚠️ Not as optimized for Next.js
- [ ] Custom hosting
  - ⚠️ More work, not recommended

**RECOMMENDED:** Vercel

---

### Decision 4: Google Sheets Integration
**Options:**
- [ ] **Keep as backup only** (RECOMMENDED)
  - Continue accepting submissions to Google Sheets
  - Also save to Supabase
  - Google Sheets as fallback/backup
- [ ] Migrate fully away from Google Sheets
  - Only use Supabase
  - Archive existing Google Sheets data

**RECOMMENDED:** Keep as backup (both Sheets + Supabase)

---

### Decision 5: Whitelist Criteria
**Options:**
- [ ] **Automatic based on score** (RECOMMENDED)
  - Top X submissions by score
  - OR top Y voters by karma
  - Clear, objective rules
- [ ] Manual curation
  - Team manually approves
  - More subjective
- [ ] Hybrid
  - Auto-approve top performers
  - Team reviews borderline cases

**RECOMMENDED:** Automatic + manual override ability

Define thresholds:
- [ ] Top ____ submissions by score (suggest: top 50%)
- [ ] OR top ____ voters by karma (suggest: top 30%)
- [ ] Minimum vote threshold: ____ (suggest: 10 votes received)

---

### Decision 6: Vote Requirements
**Options:**
- [ ] **Anonymous voting (IP-based)** (RECOMMENDED for initial launch)
  - Anyone can vote
  - Track by IP to prevent spam
  - Lower barrier to entry
  - More engagement initially
- [ ] Wallet-required voting
  - Must connect wallet to vote
  - More "legit" but higher friction
  - Smaller vote pool
- [ ] Hybrid: both options available
  - Anonymous votes worth 0.5 points
  - Wallet votes worth 1 point

**RECOMMENDED:** Start with anonymous (IP-based), add wallet voting later as bonus

---

### Decision 7: Music Auto-play
**Question:** Browser policies block auto-play. How to handle?

**Options:**
- [ ] Keep auto-play attempt (will work after user interaction)
- [ ] Add "unmute" button that appears after entering site
- [ ] Don't auto-play, make it optional

**RECOMMENDED:** Keep auto-play attempt (browsers allow after user clicks "enter" button)

---

## 📦 Phase 1: Project Setup

### Step 1.1: Create Next.js App

```bash
# Navigate to parent directory
cd /home/user

# Create new Next.js app
npx create-next-app@latest imcs-nextjs

# Select options:
# ✅ TypeScript? Yes (recommended)
# ✅ ESLint? Yes
# ✅ Tailwind CSS? No (we'll use inline styles to match current site)
# ✅ `src/` directory? Yes
# ✅ App Router? Yes
# ✅ Import alias (@/*)? Yes

# Move into new project
cd imcs-nextjs
```

---

### Step 1.2: Copy Assets

```bash
# Copy all assets from old site to new
cp -r ../imcs/assets ./public/assets
```

---

### Step 1.3: Install Dependencies

```bash
# Supabase
npm install @supabase/supabase-js

# Wallet connection (RainbowKit + wagmi)
npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query

# Utilities
npm install framer-motion  # For smooth animations
npm install canvas-confetti  # For celebration effects
```

---

### Step 1.4: Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id

# Google Sheets (keep existing for backup)
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/...
```

---

### Step 1.5: Set Up Supabase

1. Go to https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Run this schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  info TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  -- denormalized score for faster queries
  score INTEGER DEFAULT 0
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  voter_identifier TEXT NOT NULL, -- IP address or wallet address
  vote_type TEXT CHECK(vote_type IN ('upvote', 'downvote')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Prevent duplicate votes
  UNIQUE(submission_id, voter_identifier)
);

-- Access attempts (circle/typing tests)
CREATE TABLE access_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  attempt_type TEXT CHECK(attempt_type IN ('circle', 'typing')) NOT NULL,
  success BOOLEAN NOT NULL,
  score NUMERIC, -- Circle accuracy % or typing WPM
  created_at TIMESTAMP DEFAULT NOW()
);

-- Whitelist table
CREATE TABLE whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  status TEXT CHECK(status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
  method TEXT, -- 'auto_score', 'auto_karma', 'manual'
  added_at TIMESTAMP DEFAULT NOW()
);

-- Function to update submission scores (call after each vote)
CREATE OR REPLACE FUNCTION update_submission_score(sub_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE submissions
  SET score = (
    SELECT
      COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) -
      COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END)
    FROM votes
    WHERE submission_id = sub_id
  )
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update scores
CREATE OR REPLACE FUNCTION update_score_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_submission_score(NEW.submission_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vote_score_update
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_score_trigger();

-- View: Leaderboard by submission score
CREATE VIEW leaderboard_submissions AS
SELECT
  s.id,
  s.wallet_address,
  s.name,
  s.info,
  s.score,
  s.created_at,
  COUNT(v.id) as total_votes
FROM submissions s
LEFT JOIN votes v ON s.id = v.submission_id
GROUP BY s.id
ORDER BY s.score DESC, total_votes DESC;

-- View: Leaderboard by voter karma
CREATE VIEW leaderboard_voters AS
SELECT
  voter_identifier,
  COUNT(*) as votes_cast,
  COUNT(*) as karma_score -- TODO: more complex karma calculation
FROM votes
GROUP BY voter_identifier
ORDER BY karma_score DESC;

-- Indexes for performance
CREATE INDEX idx_submissions_wallet ON submissions(wallet_address);
CREATE INDEX idx_submissions_score ON submissions(score DESC);
CREATE INDEX idx_votes_submission ON votes(submission_id);
CREATE INDEX idx_votes_voter ON votes(voter_identifier);
CREATE INDEX idx_access_attempts_ip ON access_attempts(ip_address);
CREATE INDEX idx_whitelist_wallet ON whitelist(wallet_address);
```

---

## 📁 Phase 2: Project Structure

Create this folder structure:

```
imcs-nextjs/
├── public/
│   └── assets/              # (copied from old site)
│       ├── eyes/
│       ├── character/
│       ├── audio/
│       └── noise.png
│
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Splash screen (entry point)
│   │   ├── globals.css      # Global styles
│   │   │
│   │   └── site/            # Main site (after splash)
│   │       ├── layout.tsx   # Site layout (header, nav, footer, music)
│   │       ├── page.tsx     # Home page
│   │       │
│   │       ├── vote/
│   │       │   └── page.tsx
│   │       │
│   │       ├── submit/
│   │       │   └── page.tsx # Form with gates
│   │       │
│   │       ├── profile/
│   │       │   └── page.tsx
│   │       │
│   │       ├── leaderboard/
│   │       │   └── page.tsx
│   │       │
│   │       ├── gallery/
│   │       │   └── page.tsx
│   │       │
│   │       └── imagine/
│   │           └── page.tsx # "use ur imaginashun"
│   │
│   ├── components/
│   │   ├── splash/
│   │   │   ├── Eyes.tsx
│   │   │   └── EnterButton.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── NavButtons.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── NoiseOverlay.tsx
│   │   │
│   │   ├── gates/
│   │   │   ├── CircleDrawing.tsx
│   │   │   └── TypingTest.tsx
│   │   │
│   │   ├── voting/
│   │   │   ├── VotingCard.tsx
│   │   │   └── VoteButtons.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileCard.tsx
│   │   │   └── WalletConnect.tsx
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.tsx
│   │   │   └── PodiumTop3.tsx
│   │   │
│   │   ├── effects/
│   │   │   ├── PopupSavant.tsx
│   │   │   ├── ClickParticles.tsx
│   │   │   └── FloatingEmojis.tsx
│   │   │
│   │   └── shared/
│   │       ├── MusicPlayer.tsx
│   │       └── Button.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── voting.ts        # Vote logic
│   │   ├── whitelist.ts     # Whitelist logic
│   │   ├── gates.ts         # Circle/typing validation
│   │   └── utils.ts         # Helper functions
│   │
│   └── hooks/
│       ├── useVoting.ts
│       ├── useProfile.ts
│       ├── useLeaderboard.ts
│       └── useAccessGate.ts
│
├── .env.local
└── package.json
```

---

## 🎨 Phase 3: Core Component Implementation

### 3.1: Global Styles (`src/app/globals.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght:700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Comic Neue', cursive;
  overflow-x: hidden;
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="%23ff00ff"/></svg>'), auto;
}

/* Keyframe animations from original site */
@keyframes pulse {
  0%, 100% { transform: rotate(-2deg) scale(1); }
  50% { transform: rotate(2deg) scale(1.05); }
}

@keyframes float-away {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(2) rotate(360deg);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-30px) rotate(5deg); }
}

@keyframes shake {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

@keyframes scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

@keyframes rainbow-bg {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

---

### 3.2: Root Layout (`src/app/layout.tsx`)

```tsx
import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'IMCS - Imaginary Magic Crypto Savants',
  description: 'i wish i was autistic...in like a super hacker programmer type of way',
  openGraph: {
    title: 'Imaginary Magic Crypto Savants',
    description: 'i wish i was autistic...in like a super hacker programmer type of way',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@imcsnft',
    title: 'Imaginary Magic Crypto Savants',
    description: 'i wish i was autistic...in like a super hacker programmer type of way',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Noise overlay - covers entire app */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/assets/noise.png)',
              backgroundRepeat: 'repeat',
              pointerEvents: 'none',
              zIndex: 99999,
              opacity: 0.15,
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

---

### 3.3: Providers (`src/app/providers.tsx`)

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

---

### 3.4: Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export type Submission = {
  id: string
  wallet_address: string
  name: string
  info: string
  score: number
  created_at: string
}

export type Vote = {
  id: string
  submission_id: string
  voter_identifier: string
  vote_type: 'upvote' | 'downvote'
  created_at: string
}

export type AccessAttempt = {
  id: string
  ip_address: string
  attempt_type: 'circle' | 'typing'
  success: boolean
  score?: number
  created_at: string
}
```

---

## 🚧 Phase 4: Feature Implementation Priority

### Priority 1: Basic Migration (Week 1)
1. Splash screen with eyes
2. Main site layout (header, nav, footer)
3. Home page (static)
4. Music player
5. Popup savants
6. Click particle effects

### Priority 2: Access Gates (Week 1-2)
1. Circle drawing component
2. Typing test component
3. IP tracking for attempts
4. Form submission (still to Google Sheets + Supabase)

### Priority 3: Voting System (Week 2)
1. Voting card UI
2. Backend vote submission
3. Vote retrieval and display
4. Anonymous voting with IP tracking

### Priority 4: Profile & Whitelist (Week 2-3)
1. Wallet connection
2. Profile page
3. Whitelist calculation logic
4. Whitelist display

### Priority 5: Leaderboard (Week 3)
1. Submission leaderboard
2. Voter leaderboard
3. Real-time updates

### Priority 6: Polish & Troll Features (Week 3-4)
1. Easter eggs
2. Troll messages
3. Random effects
4. Mobile optimization

---

## 🎯 Next Steps

1. **Make decisions above** (backend, deployment, whitelist rules, etc.)
2. **Set up development environment** (Next.js + Supabase)
3. **Start with splash screen migration** (lowest risk, tests workflow)
4. **Incrementally add features** following priority order
5. **Test thoroughly** before deploying

---

## 📞 Questions to Answer NOW

Before starting development, please decide:

1. ✅ Backend: Supabase? (yes/no/other)
2. ✅ Wallet: RainbowKit? (yes/no/other)
3. ✅ Deploy: Vercel? (yes/no/other)
4. ✅ Google Sheets: Keep as backup? (yes/no)
5. ✅ Whitelist: Top 50% submissions OR top 30% voters? (define thresholds)
6. ✅ Voting: Anonymous (IP) or wallet-required or both?
7. ✅ Domain: Keep imcs.world pointing to new app?
8. ✅ Launch date: Any target? (timeline affects scope)

Once these are answered, we can start building immediately!

---

**Let's build sum imaginary magic crypto savant shit 🧙‍♂️✨🚀**
