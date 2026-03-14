

# Phase 1: Tech Debt + Foundation — Implementation Plan

Based on the uploaded H1 2026 Sprint Plan and Feature Backlog, here is the immediate implementation plan covering all three P0 tech debt items. These are small, well-scoped fixes that unblock the rest of the sprint.

---

## TD-01: Fix `pinned` Type Safety

**Problem:** The `pinned` property is accessed via `(signal as any).pinned` in 3 files — `SignalEntryCard.tsx`, `MorningContext.tsx`, and `Signals.tsx`. The `Signal` interface in `signals.ts` already has `pinned?: boolean`, but the Supabase row mapping and component code use unsafe casts.

**Fix:**
- In `SignalEntryCard.tsx`: Replace all `(signal as any).pinned` with `signal.pinned` (6 occurrences)
- In `MorningContext.tsx`: Replace `(s as any).pinned` with `s.pinned`
- In `Signals.tsx` row mapping (line 47): Replace `(row as Record<string, unknown>).pinned as boolean` with `row.pinned ?? false` — the types.ts already has `pinned: boolean` on the Row type, so no cast needed
- In `SignalEntryCard.tsx` update call (line 351): Replace `{ pinned: newPinned } as any` with `{ pinned: newPinned }`

---

## TD-02: Map `pinned` in Contact Hub

**Problem:** `ContactTimeline.tsx` `fetchContactSignals` (line 37-53) maps Supabase rows to `Signal` objects but does not include the `pinned` field.

**Fix:**
- Add `pinned: row.pinned ?? false,` to the mapping object in `fetchContactSignals`

---

## TD-03: Standardize Edge Function Error Logging

**Problem:** 4 edge functions use `logError` (brain-dump, linq-webhook, recall-webhook, phone-call-webhook). 4 do not: `gmail-poll`, `daily-digest`, `create-reminder`, `firecrawl-scrape`, `linq-send`, `linq-register-webhook`.

**Fix:**
- Add `logError` import and usage to the catch blocks of all edge functions that currently lack it
- Pattern: `const { logError } = await import("../_shared/log-error.ts"); await logError("function-name", err);`

---

## Summary

All three items are small (S-sized, 1-3 days). No database migrations needed. No new dependencies. Pure code hygiene that eliminates runtime risk and establishes consistency before the larger Phase 2 features.

