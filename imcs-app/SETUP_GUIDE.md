# IMCS Next.js App - Setup Guide

## 🚀 Quick Start

This guide will help you get the IMCS Next.js app running locally. Total setup time: ~15 minutes.

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- A Supabase account (free)
- A WalletConnect project ID (free)

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Name**: IMCS
   - **Database Password**: (generate a strong one - SAVE THIS!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier is fine
5. Click "Create new project"
6. Wait ~2 minutes for project to initialize

### 1.2 Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `SUPABASE_SETUP.sql` in this directory
4. **Copy the entire contents** and paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Setup complete! Tables created:" message
7. Verify tables exist: Go to **Table Editor** and you should see:
   - submissions
   - votes
   - access_attempts
   - whitelist
   - referrals

### 1.3 Get API Credentials

1. Go to **Project Settings** (gear icon in left sidebar)
2. Go to **API** section
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

**IMPORTANT:** Keep these safe! You'll need them in Step 3.

---

## Step 2: WalletConnect Project ID (2 minutes)

1. Go to [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up / Log in
3. Click **Create New Project**
4. Fill in:
   - **Project Name**: IMCS
   - **Homepage URL**: http://localhost:3000 (for now)
5. Click **Create**
6. Copy your **Project ID** (looks like: `a1b2c3d4e5f6...`)

---

## Step 3: Environment Variables

1. In the `imcs-app` directory, create a file called `.env.local`
2. Copy contents from `.env.local.example`
3. Fill in your actual values:

```bash
# Supabase (from Step 1.3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WalletConnect (from Step 2)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=a1b2c3d4e5f6...

# Google Sheets (optional - keep your existing URL if you have it)
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/your-script-id/exec
```

**IMPORTANT:**
- Never commit `.env.local` to git
- These are your secret keys
- `.env.local` is already in `.gitignore`

---

## Step 4: Install Dependencies

```bash
cd imcs-app
npm install
```

This will install all required packages (~30 seconds).

---

## Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the splash screen with eyes!

---

## Step 6: Migrate Google Sheets Data (Optional)

If you have existing submissions in Google Sheets, you need to migrate them to Supabase.

### Option A: Manual Migration (Small Dataset)

1. Export your Google Sheet as CSV
2. Go to Supabase → **Table Editor** → **submissions**
3. Click **Insert** → **Import from CSV**
4. Map columns:
   - `wallet_address` → wallet column
   - `name` → name column
   - `info` → info/submission column
5. Click **Import**

### Option B: Script Migration (Larger Dataset)

Create a migration script:

```javascript
// migrate-sheets.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role key, not anon!
)

async function migrateData() {
  // 1. Fetch data from Google Sheets (use Google Sheets API or manual CSV)
  const data = [
    // { wallet_address: '0x...', name: 'Alice', info: 'My submission' },
    // { wallet_address: '0x...', name: 'Bob', info: 'Another submission' },
  ]

  // 2. Insert into Supabase
  for (const row of data) {
    const { error } = await supabase
      .from('submissions')
      .insert({
        wallet_address: row.wallet_address,
        name: row.name,
        info: row.info,
        ip_address: row.ip_address || null
      })

    if (error) {
      console.error(`Failed to insert ${row.wallet_address}:`, error)
    } else {
      console.log(`✅ Migrated ${row.wallet_address}`)
    }
  }

  console.log('Migration complete!')
}

migrateData()
```

Run it:
```bash
node migrate-sheets.js
```

---

## Step 7: Add Manual Whitelist Addresses (Optional)

For project collaborations or manual approvals:

1. Go to Supabase → **SQL Editor**
2. Run this query:

```sql
INSERT INTO whitelist (wallet_address, status, method)
VALUES
  ('0x1234567890123456789012345678901234567890', 'approved', 'collaboration'),
  ('0xABCDEF1234567890123456789012345678901234', 'approved', 'manual')
ON CONFLICT (wallet_address) DO NOTHING;
```

Replace with actual wallet addresses.

---

## Troubleshooting

### Issue: "Failed to fetch" or CORS errors

**Solution:**
1. Check that your Supabase URL and key are correct in `.env.local`
2. Restart the dev server (`npm run dev`)
3. Hard refresh browser (Cmd/Ctrl + Shift + R)

### Issue: "Wallet connection not working"

**Solution:**
1. Check that your WalletConnect Project ID is correct
2. Make sure you're using a browser with MetaMask or another wallet extension
3. Try a different wallet provider

### Issue: "Tables not found"

**Solution:**
1. Re-run the `SUPABASE_SETUP.sql` script in Supabase SQL Editor
2. Check **Table Editor** to verify tables exist
3. Make sure you ran the entire script, not just part of it

### Issue: "npm install" fails

**Solution:**
1. Make sure you have Node.js 18+ installed: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and try again: `rm -rf node_modules && npm install`

---

## Project Structure

```
imcs-app/
├── src/
│   ├── app/              # Next.js pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Splash screen
│   │   └── globals.css   # Global styles
│   │
│   ├── components/       # React components (TODO)
│   ├── lib/              # Utility libraries
│   │   ├── supabase.ts   # Supabase client & helpers
│   │   ├── wagmi.ts      # Wallet connection config
│   │   └── utils.ts      # Helper functions
│   └── hooks/            # Custom React hooks (TODO)
│
├── public/
│   └── assets/           # Images, audio, etc.
│
├── SUPABASE_SETUP.sql    # Database schema
├── .env.local            # Your secrets (DO NOT COMMIT)
└── package.json          # Dependencies
```

---

## Next Steps

Now that you have the project set up locally:

1. **Implement Components**: We need to build:
   - Splash screen with eyes
   - Main site layout
   - Circle drawing test
   - Typing test
   - Voting cards
   - Profile page
   - Leaderboard

2. **Test Locally**: Run through all features

3. **Deploy to Vercel**:
   - Push code to GitHub
   - Connect Vercel to repo
   - Add environment variables in Vercel dashboard
   - Deploy!

---

## Commands Reference

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Lint code
npm run lint
```

---

## Security Notes

### RLS Policies (Already Configured)

The `SUPABASE_SETUP.sql` script includes Row Level Security policies that:

- ✅ Allow anyone to READ submissions and leaderboards
- ✅ Allow authenticated users to INSERT votes (but not their own submission)
- ✅ Prevent users from UPDATE or DELETE any data
- ✅ Hide sensitive IP addresses from public access
- ✅ Allow only service role to write submissions (via API routes)

**Without RLS, anyone could open browser console and delete your entire database!**

### Environment Variables

- `.env.local` is in `.gitignore` - never commit it
- Use `NEXT_PUBLIC_` prefix for client-side variables only
- Never expose service role key in client code
- For production, set environment variables in Vercel dashboard

---

## Support

If you run into issues:

1. Check this guide again
2. Check the code comments
3. Check Supabase documentation: https://supabase.com/docs
4. Check RainbowKit documentation: https://rainbowkit.com
5. Ask in Discord/Telegram

---

## Timeline

Based on our 12-day launch plan (Jan 18 → Jan 31):

- **Days 1-3** (Jan 18-20): ✅ Setup complete! Now build core features
- **Days 4-6** (Jan 21-23): Voting system, gates, form
- **Days 7-9** (Jan 24-26): Profile, leaderboard, referrals
- **Days 10-11** (Jan 27-28): Polish, mobile, troll features
- **Day 12** (Jan 29): Deploy to production

Let's build sum imaginary magic crypto savant shit! 🧙‍♂️✨🚀
