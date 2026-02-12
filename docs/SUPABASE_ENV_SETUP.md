# Supabase Environment Variables Setup

## Required Variables

### `NEXT_PUBLIC_SUPABASE_URL`
**What it is:** Your Supabase project URL

**Format:** `https://<project-ref>.supabase.co`

**How to find it:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Look for **Project URL** under "Project API keys"
5. Copy the URL (e.g., `https://abcdefghijklmnop.supabase.co`)

**Example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

---

### `SUPABASE_SERVICE_ROLE_KEY`
**What it is:** Service role key (bypasses RLS - use server-side only)

**How to find it:**
1. Same page as above (Settings → API)
2. Look for **service_role** key (NOT the anon key)
3. Click "Reveal" to show the key
4. Copy the entire key

**Example:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Security Note:** Never commit this key to git! It has full database access.

---

### `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Optional)
**What it is:** Anonymous/public key (for client-side)

**How to find it:**
1. Same page (Settings → API)
2. Look for **anon** or **public** key
3. Copy the key

**Example:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Your Current Setup

You mentioned you have:
- ✅ `CS_SUPPORT_DATABASE_SECRET_KEY` (this might be your service role key)

**To complete setup, you need:**
1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (might be the same as `CS_SUPPORT_DATABASE_SECRET_KEY`)

---

## Quick Setup

1. **Get Supabase URL:**
   - Dashboard → Settings → API → Project URL

2. **Get Service Role Key:**
   - Same page → service_role key → Reveal → Copy

3. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

4. **Run seed script:**
   ```bash
   npx tsx scripts/seed-templates-auto.ts
   ```

---

## Alternative Variable Names

If you're using different variable names, you can update `.env.local` to include both:

```env
# Your existing
CS_SUPPORT_DATABASE_SECRET_KEY=your-key-here

# Add these (or alias them)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

Or update the script to check for `CS_SUPPORT_DATABASE_SECRET_KEY` as well.

---

## Verification

After setting up, verify with:
```bash
npx tsx scripts/seed-templates-auto.ts
```

Should output:
```
✅ compliance_magnet_loop - Compliance Magnet Loop
✅ founder_authority_sprint - Founder‑Led Authority Sprint
✅ outbound_precision_sprint - Outbound Precision Sprint
✅ partner_influencer_push - Partner / Influencer Push
✅ selective_paid_capture - Selective Paid Capture
```
