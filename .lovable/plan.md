

# Auto-Reply to All Linq Messages + SMS Notification

## What Changes

Two modifications to `supabase/functions/linq-webhook/index.ts`:

### 1. Auto-reply to ALL incoming messages (not just select signal types)
- Remove the `shouldAutoReply()` gating so every classified non-NOISE message gets an AI-generated reply
- Add fallback templates for signal types that currently lack them (INSIGHT, CONTEXT)

### 2. Text you at 832-651-0238 on every incoming message
- After processing each signal, send a notification text to your number via `sendLinqReply`
- Message will include: sender, signal type, priority, and AI summary
- This runs independently of the auto-reply to the sender

## Technical Details

**File