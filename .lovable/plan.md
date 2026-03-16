

# Phase 2: Temporal & Identity Layers

Phase 1 (Action Layer) is complete. Per the CPO Assessment Revision, Phase 2 includes three items:

## What to Build

### 1. CPO-2.1 — Mode-Driven Dashboard Layouts
Reshape the Index dashboard based on the active user mode:
- **Executive mode**: Hide Channels grid, hide Noise footer. Promote Action Items and What's Ahead to top. Only show high-priority signals in Recent Signals.
- **Creative mode**: Current layout (no changes — this is the default).
- **DND mode**: Minimal view — greeting + Action Items only. Hide Brain Dump, Channels, CoolingAlerts, WhatsAhead, Recent Signals.

**Changes**: `src/pages/Index.tsx` — wrap sections in conditional renders based on `mode` from `useUserMode()`. No new components needed.

### 2. CPO-2.2 — Confidence Indicators on Signal Cards
Surface the AI classification confidence score on signal cards in the Recent Signals list and in the SignalDetailDrawer.

**Changes**:
- `src/pages/Index.tsx` — In the Recent Signals row, add a thin confidence bar or percentage badge if `rawPayload?.confidence` exists.
- `src/components/SignalDetailDrawer.tsx` — Add a "Classification Confidence" indicator in the metadata section showing the score with a tooltip explaining what it means.

### 3. CPO-2.3 — Timeline View for Daily Command
Add a time-anchored narrative section that groups the day into **Prep** (morning context + What's Ahead), **Active** (signals captured today in chronological order), and **Review** (completed items, cooling alerts). This replaces the flat Recent Signals list with a temporal narrative.

**Changes**:
- `src/components/DailyTimeline.tsx` — New component. Takes today's signals, meetings, and completed action items. Groups them into three time blocks with visual separators and time markers.
- `src/pages/Index.tsx` — Replace the "Recent Signals" section with `DailyTimeline` component. The existing data (signals, meetings) feeds directly in.

## Build Sequence (no approval breaks)

```text
1. Mode-Driven Layouts    → Index.tsx conditional rendering
2. Confidence Indicators  → Index.tsx + SignalDetailDrawer
3. Daily Timeline          → New component + Index integration
```

All three use existing data — no migrations or new edge functions needed.

