# Setup New Supabase Database - Step by Step Guide

## What You Need
- Your Supabase dashboard open: https://supabase.com/dashboard
- This guide open in another window

---

## Step 1: Open SQL Editor

1. **Go to**: https://supabase.com/dashboard
2. **Click** your new project name
3. **Click** "SQL Editor" in the left sidebar (icon looks like `</>`)
4. **Click** "New query" button (top right area)

---

## Step 2: Run Migrations

You need to copy and paste SQL code from your migration files into Supabase.

### IMPORTANT: Run these IN ORDER, one at a time!

#### Migration 1: Core Tables
**File**: `supabase/migrations/20250926165411_azure_pebble.sql`

1. Open this file in your code editor
2. Copy ALL the text
3. Paste into Supabase SQL Editor
4. Click "Run" button (bottom right)
5. Wait for "Success" message

#### Migration 2: Resume Parsing
**File**: `supabase/migrations/20250927105340_holy_meadow.sql`

1. Open this file
2. Copy all text
3. Paste into SQL Editor (replace previous code)
4. Click "Run"
5. Wait for "Success"

#### Continue with remaining migrations in this order:

3. `20250927112956_heavy_recipe.sql`
4. `20250927115808_dawn_frost.sql`
5. `20250927120000_cover_letters.sql`
6. `20250927123118_steep_bush.sql`
7. `20250927130513_heavy_delta.sql`
8. `20250927150311_shy_hall.sql`
9. `20250927165407_curly_hall.sql`
10. `20250927173835_bronze_violet.sql`
11. `20250927181213_sweet_snowflake.sql`
12. `20250927182013_light_recipe.sql`
13. `20251001101216_sparkling_cell.sql`
14. `20251001122518_tender_shadow.sql`
15. `20251001132854_wooden_math.sql`
16. `20251001134328_tiny_swamp.sql`
17. `20251001134952_icy_frost.sql`
18. `20251001141351_solitary_hill.sql`
19. `20251001141658_polished_truth.sql`
20. `20251001142014_flat_tooth.sql`
21. `20251001142430_broken_torch.sql`
22. `20251002041707_patient_bar.sql`
23. `20251002095924_solitary_math.sql`
24. `20251003050000_webhook_replay_protection.sql`
25. `20251003100000_create_resume_exports_bucket.sql`
26. `20251102115357_create_admin_user_for_migs.sql`

---

## Step 3: Create Admin Account

After all migrations are done:

1. Open your terminal
2. Navigate to your project folder
3. Run: `npm run admin:create`
4. Follow the prompts to create your admin account

---

## Step 4: Verify Setup

Go to Supabase → Table Editor (left sidebar)

You should see these tables:
- users
- resumes
- resume_sections
- cover_letters
- exports
- payments
- webhook_events
- And many more!

---

## All Done! 🎉

Your database is ready. You can now run your app:
```bash
npm run dev
```
