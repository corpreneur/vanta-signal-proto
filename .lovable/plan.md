

# Implement Research-Backed Features: Relationship Context + Time-Aware Surfacing

Two features drawn directly from the latest interview observations.

---

## Feature 1: Inline Relationship Context on Signal Cards

**What:** When a signal card displays a sender who exists in the contact database, show a compact relationship context chip — strength label, last interaction recency, and signal count — directly on the card. Before calls and meetings, this context is already visible without navigating to the Contact Hub.

**How:**
- In `SignalEntryCard.tsx`, accept an optional `contactContext` prop with pre-computed strength, last interaction, and signal count
- In `SignalFeed.tsx`, compute a `Map<string, ContactContext>` from all signals (reusing the existing `computeStrength` logic from `Contacts.tsx`) and pass it down to each card
- Extract the shared `computeStrength` function into a utility (`src/lib/contactStrength.ts`) so both Contacts and SignalFeed use the same logic
- Render a small inline chip on each signal card: `[Warm · 12 signals · 3d ago]` with a link to `/contact/:name`

**UI:** Compact row below the sender name, mono text, muted styling — consistent with existing card design language.

---

## Feature 2: Quick Duration Filter ("Under 5 Min" + Time-Fit)

**What:** Add a "Quick Tasks" filter button to the signal feed that surfaces signals likely completable in under 5 minutes — short follow-ups, simple replies, acknowledgments. This maps directly to the strongest research signal around micro-task windows between meetings.

**How:**
- Add a new `duration` filter option to the feed controls (alongside sort and overdue buttons)
- Heuristic for "quick" signals: low/medium priority + signal types `CONTEXT`, `INTRO` + short summary (under 120 chars) + no due date complexity
- Add a `quickTask` boolean filter to `FilterState` or implement as a standalone toggle like `showOverdueOnly`
- In `Signals.tsx`, add the toggle button with a `Zap` icon labeled "Quick Tasks" that filters `feedSignals`

**UI:** A toggle button in the sort/filter controls row, styled identically to the existing "Overdue Only" button.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/contactStrength.ts` | New — extract shared strength computation |
| `src/components/SignalEntryCard.tsx` | Add optional contact context chip below sender |
| `src/components/SignalFeed.tsx` | Compute contact context map, pass to cards |
| `src/pages/Contacts.tsx` | Import shared strength util instead of local |
| `src/pages/Signals.tsx` | Add "Quick Tasks" toggle filter |
| `USER_RESEARCH_SUMMARY_V2.md` | Append latest interview observations |

