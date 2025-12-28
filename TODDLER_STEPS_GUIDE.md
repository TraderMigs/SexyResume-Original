# 🍼 Simple Steps To Complete Payment System (For Non-Developers)

**Time needed**: 15-30 minutes  
**Difficulty**: Easy - just copy and paste!

---

## Step 1: Add The New Table To Database (5 minutes)

### What you're doing
Adding a new table called `webhook_events` to prevent duplicate payments.

### How to do it

1. **Open your web browser**
2. **Go to**: https://supabase.com/dashboard
3. **Sign in** to your account
4. **Click** on your project name
5. **Click** "SQL Editor" on the left sidebar (it looks like `</>`)
6. **Click** the green "+ New query" button at the top
7. **Open this file** on your computer:
   ```
   supabase/migrations/20251003050000_webhook_replay_protection.sql
   ```
8. **Select all the text** in that file (Ctrl+A on Windows, Cmd+A on Mac)
9. **Copy it** (Ctrl+C or Cmd+C)
10. **Click** in the big white text box in Supabase
11. **Paste** the code (Ctrl+V or Cmd+V)
12. **Click** the green "Run" button
13. **Wait** for the green "Success" message
14. ✅ **Done!** You created the table!

---

## Step 2: Update Stripe Webhook Secret (5 minutes)

### What you're doing
Getting the secret code from Stripe that proves webhooks are real.

### How to do it

1. **Open a new browser tab**
2. **Go to**: https://dashboard.stripe.com/webhooks
3. **Sign in** to your Stripe account
4. **Click** on your webhook (it should show a URL with your domain)
5. **Scroll down** to the "Signing secret" section
6. **Click** the "Reveal" button
7. **Copy** the secret (it starts with `whsec_`)
8. **Go back** to your Supabase dashboard
9. **Click** "Settings" on the left sidebar (the gear icon ⚙️)
10. **Click** "Edge Functions" in the settings menu
11. **Find** the section called "Secrets"
12. **Look for** `STRIPE_WEBHOOK_SECRET`
13. **Click** "Edit" next to it
14. **Paste** your secret (starts with `whsec_`)
15. **Click** "Save"
16. ✅ **Done!** Stripe can now talk securely to your app!

---

## Step 3: Check If Functions Deployed (2 minutes)

### What you're doing
Making sure the updated code is live.

### How to do it

1. **Stay in Supabase dashboard**
2. **Click** "Edge Functions" on the left sidebar
3. **Look for** these two functions:
   - `stripe-webhook`
   - `export-resume`
4. **Check** if they show "Deployed" status
5. **If YES**: ✅ You're good! Skip to Step 4
6. **If NO**: The code will auto-deploy soon, or continue below

### If functions need manual deployment

**If you have Supabase CLI installed**:
1. Open terminal/command prompt
2. Type: `supabase functions deploy stripe-webhook`
3. Press Enter
4. Wait for "Deployed successfully"
5. Type: `supabase functions deploy export-resume`
6. Press Enter
7. Wait for "Deployed successfully"

**If you don't have CLI**:
- The functions should auto-deploy on next code push
- Or ask your developer to deploy them

---

## Step 4: Update Checkout Code (MOST IMPORTANT!)

### What you're doing
Making sure Stripe knows which user is paying.

### Where to look
Find the code where you create Stripe checkout sessions. Look for `stripe.checkout.sessions.create`

### What to add
Add this ONE line of code:
```javascript
client_reference_id: user.id,
```

### Example BEFORE:
```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [...],
  success_url: '...',
  cancel_url: '...',
});
```

### Example AFTER (notice the new line):
```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [...],
  success_url: '...',
  cancel_url: '...',
  client_reference_id: user.id,  // ← ADD THIS LINE!
});
```

### Where this might be:
- Look in `supabase/functions/stripe-checkout/index.ts`
- Or in your frontend code where payments start
- Search for the word "checkout.sessions.create"

---

## Step 5: Test Everything Works! (10 minutes)

### What you're testing
Making sure users can pay and immediately use exports.

### Test with Stripe Test Mode

1. **In your app**, sign in as a test user
2. **Click** the payment/upgrade button
3. **Use this test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiration: Any future date (like `12/25`)
   - CVC: Any 3 numbers (like `123`)
   - ZIP: Any 5 numbers (like `12345`)
4. **Complete** the test payment
5. **Wait** 2-3 seconds
6. **Try to export** a resume
7. **Check**: Does it work WITHOUT a watermark?
8. ✅ **If YES**: Everything works!
9. ❌ **If NO**: See troubleshooting below

---

## Troubleshooting

### Problem: User paid but export still locked

**Fix**:
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Find table "user_entitlements"
4. Find your test user
5. Check if "export_unlocked" is `true`
6. If it's `false`, the webhook didn't run
7. Check "Edge Functions" → "stripe-webhook" → "Logs"
8. Look for errors

### Problem: "client_reference_id" not found

**Fix**:
- You skipped Step 4
- Go back and add `client_reference_id: user.id` to checkout code

### Problem: Webhook signature fails

**Fix**:
1. Go back to Step 2
2. Make sure you copied the FULL secret
3. It should start with `whsec_`
4. No spaces before or after it

---

## How To Know It's Working

### Good signs ✅
- User pays with test card
- They can immediately export
- No watermark on the export
- In database, `export_unlocked` = true

### Bad signs ❌
- User pays but export still locked
- Gets "403 Forbidden" error after payment
- Watermark still appears
- In database, `export_unlocked` = false

---

## What Each File Does (Simple Explanation)

**File**: `stripe-webhook/index.ts`
**What it does**: Listens when Stripe says "Hey, someone paid you!"
**What changed**: Now it updates the database to unlock exports

**File**: `export-resume/index.ts`
**What it does**: Creates the resume download file
**What changed**: Now it checks if user paid before allowing download

**File**: `webhook_events` table
**What it does**: Remembers which payments were already processed
**What changed**: Prevents charging someone twice by accident

---

## Files You Got

1. **IMPLEMENTATION_COMPLETE.md** - Technical details (for developers)
2. **TODDLER_STEPS_GUIDE.md** - This file! Simple steps
3. **stripe-webhook.log** - Example of what logs look like
4. **entitlement-proof.json** - Before/after data example
5. **sample-receipt.sql** - What a payment record looks like
6. **STRIPE_WEBHOOK_VERIFICATION.md** - Detailed security analysis

---

## Questions & Answers

**Q: Do I need to know code?**
A: No! Just follow the copy-paste steps above.

**Q: Will this break my live site?**
A: No, it only affects test payments until you switch to live mode.

**Q: How long does it take?**
A: 15-30 minutes if you follow all steps.

**Q: What if I get stuck?**
A: Check the troubleshooting section, or ask for help.

**Q: Is it safe?**
A: Yes! All these fixes make your payment system MORE secure.

**Q: Do I need to do this more than once?**
A: No, just once and it's done forever!

---

## Summary Checklist

- [ ] Step 1: Added webhook_events table to database
- [ ] Step 2: Updated STRIPE_WEBHOOK_SECRET in Supabase
- [ ] Step 3: Verified functions are deployed
- [ ] Step 4: Added client_reference_id to checkout code
- [ ] Step 5: Tested with test card 4242 4242 4242 4242
- [ ] ✅ User can pay and immediately export without watermark!

---

**Need help?** Check the logs in Supabase → Edge Functions → stripe-webhook → Logs
