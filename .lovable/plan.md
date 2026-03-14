

# Feature Backlog: Synthesized from Slack Strategy Thread

Incorporating feedback from JG, Julian Mitchell, and William Traylor alongside the previous backlog. Items marked with their origin.

---

## Prioritized Backlog

### 1. Signal Feed Curation & Algorithm Control (P0, ~5 pts)
**Origin:** JG ("curate what signals flow / controlling your algorithm"), Julian ("control + focused signal")

The feed should let users control *what* surfaces and *how*. This is the "your algorithm" idea.

**What to build:**
- Add temporal grouping headers (Today / Yesterday / This Week) to the signal list in `Signals.tsx`
- Add a "Morning Context" pinned strip: date, meeting count, unresolved high-priority count
- Add inline quick-actions on `SignalEntryCard`: checkmark (Complete) and clock (Snooze) — both already have the Supabase update pattern in place
- Add a "Pin" action so users can pin signals to the top of their feed (new `pinned` boolean column on `signals`)
- Source priority controls in Settings: let users weight channels (e.g., Phone signals always surface above Email)

---

### 2. Contact-Hubbed Signal View (P0, ~4 pts)
**Origin:** JG ("pop into my contact card for Julian and see the signals hubbed around him"), Julian ("contacts as a connected source")

The contact timeline at `/contacts/:name` already exists. The gap is making it a first-class vantage point, not a secondary page.

**What to build:**
- Redesign the Contacts page cards: show relationship strength bar, last signal date, dominant channel badge, signal count
- Enhance the `/contacts/:name` timeline to show grouped signals by type, with Smart Actions available inline
- Add a "View Contact" link inside `SignalDetailDrawer` when a signal has a sender — cross-linking the two vantage points
- Add a "Contact Hub" section to the contact timeline: recent signals, action history, suggested next actions

---

### 3. Contacts as a Signal Source (P1, ~3 pts)
**Origin:** Julian ("VANTA would treat your contact list as a connected source"), JG ("contacts as a source vs SMS as a source")

Contacts themselves generate intelligence: birthdays, time since last interaction, relationship decay.

**What to build:**
- Add a "Relationship Alerts" system: auto-generate signals when a contact goes cold (no interaction >30 days), or when a birthday/key date approaches
- Add this as a toggleable source in Settings alongside iMessage, Phone, etc.
- Surface these as `CONTEXT` type signals in the feed with a distinct "relationship" badge

---

### 4. Privacy & Trust Onboarding (P1, ~3 pts)
**Origin:** JG ("lean on MetaLab for privacy best practices"), Julian ("make privacy feel embedded/valued")

**What to build:**
- Add a "Security Setup" step to the post-login flow: a 3-step tap-through explaining how VANTA secures data (on-device processing, encrypted transit, no third-party sharing)
- Add a "Privacy" section to Settings with a summary of connected sources and what data each accesses
- Add a trust badge/shield icon in the sidebar footer linking to the privacy section

---

### 5. Contextual Enrichment Layer (P2, ~2 pts)
**Origin:** JG ("time of day, day of week, location — we can get as an MVNO")

**What to build:**
- Capture time-of-day and day-of-week context when classifying signals (pass to the brain-dump AI prompt)
- Use this to adjust Morning Context strip ("You have 3 signals from last night" vs "Quiet morning so far")
- Tag signals with temporal context metadata (evening, weekend, business hours) for smarter filtering

---

### 6. Suggested Modes (P2, ~2 pts)
**Origin:** JG ("proactively suggest modes based on usage")

**What to build:**
- After 7 days of usage, analyze signal patterns (time, volume, types) and surface a toast suggesting a mode
- E.g., "You seem to focus on high-priority items in the morning — try Executive mode?"
- One-tap to switch mode from the suggestion

---

## What's Already Done (from this thread)
| Item | Status |
|:---|:---|
| Everpresent Smart Note (VANTA orb) | Shipped |
| VANTA symbol as brand mark for capture | Shipped |
| Smart Note with Accelerators | Shipped |

## What's Explicitly NOT This Sprint
| Item | Reason |
|:---|:---|
| Instagram DM / LinkedIn integration | Channel integration, not UI sprint |
| User-designed homepage / drag widgets | Major architectural lift — future sprint |
| Full algorithm control UI | Needs design exploration with MetaLab first |

---

## Sprint Shape

```text
P0:  Feed Curation (5) + Contact Hub (4)     = 9 pts — must ship
P1:  Contacts as Source (3) + Privacy (3)     = 6 pts — should ship  
P2:  Context Enrichment (2) + Suggested Modes (2) = 4 pts — stretch

Total: ~19 pts
```

All items build on existing infrastructure. No new external integrations. The feed curation and contact hub are the highest-leverage items — they deliver the "multiple vantage points" vision JG described and the "curation + control" that Julian validated from research.

