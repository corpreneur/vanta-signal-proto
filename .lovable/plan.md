

# Store Docs + Build Phase 1: The Action Layer

## Overview

Store the four strategic documents in the project, then sequentially build the four Phase 1 features from the CPO Assessment Revision plan. No approval loops — straight through.

## Step 1: Store Strategic Docs

Copy all four uploaded files into a `docs/` directory in the project root for reference.

## Step 2: Build CPO-1.4 — Inline Brain Dump on Daily Command (Index)

Add a single-line conversational input at the top of the Index dashboard with placeholder "What's on your mind?" that pipes text into the existing `brain-dump` edge function and shows a confirmation toast. Reuses the existing Brain Dump processing pipeline — no new backend work.

**Changes:**
- `src/pages/Index.tsx` — Add a text input component below the greeting hero, above the context row. On Enter, call the `brain-dump` edge function, show a toast, clear the input. Invalidate `signals-dashboard` query on success so the new signal appears without reload.

## Step 3: Build CPO-1.2 — Quick Actions in SignalDetailDrawer

Enhance the existing drawer with prominent, type-mapped action buttons that actually execute (not just display). The drawer already has "Smart Actions" but they need to be more prominent and functional.

**Changes:**
- `src/components/SignalDetailDrawer.tsx` — Elevate the existing Smart Actions section: make "Draft Reply" trigger the compose section, "Set Reminder" open a date picker and call `create-reminder`, "Pin" toggle the signal's `pinned` field. Add a "Mark Done" quick action that updates status to "Complete".

## Step 4: Build CPO-1.3 — "What's Ahead" Block on Dashboard

A forward-looking component on the Index page showing upcoming meetings (next 24-48h) cross-referenced with cooling alerts.

**Changes:**
- `src/components/WhatsAhead.tsx` — New component. Fetches upcoming meetings for the next 48 hours and active cooling alerts. If a cooling contact is an attendee of an upcoming meeting, flag it with a visual indicator. Renders as a compact timeline-style list.
- `src/pages/Index.tsx` — Insert `WhatsAhead` component between the stats strip and the channel grid.

## Step 5: Build CPO-1.1 — Action Items on Daily Command

AI-derived action items surface (commitments, follow-ups, open questions extracted from signals). This is the highest-value feature.

**Changes:**
- `src/components/ActionItems.tsx` — New component. Queries signals that have `status != 'Complete'` and `due_date IS NOT NULL` OR `priority = 'high'`, presenting them as a checklist. Checking an item marks the signal as "Complete". Links each item back to its source signal via the drawer.
- `src/pages/Index.tsx` — Insert `ActionItems` between the inline brain dump and the context row, creating a clear "capture → act → review" flow on the dashboard.

## Build Sequence (no approval breaks)

```text
1. Store docs           → docs/ directory
2. Inline Brain Dump    → Index.tsx input bar
3. Quick Actions        → SignalDetailDrawer enhancement
4. What's Ahead         → New component + Index integration
5. Action Items         → New component + Index integration
```

## Technical Notes

- All features use existing database tables and edge functions — no migrations needed.
- The Brain Dump input reuses the `brain-dump` edge function already in production.
- Action Items derive from the existing `signals` table (due_date, priority, status fields).
- What's Ahead cross-references `upcoming_meetings` and `relationship_alerts` tables.
- All queries use the existing authenticated RLS policies.

