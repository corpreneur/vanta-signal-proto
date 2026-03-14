# Audit V4 — Live Deployment Notes (2026-03-14)

## Dashboard (/)
- ✅ Login works — auto-filled credentials, redirects to dashboard
- ✅ Greeting: "Good morning" — time-of-day logic working
- ✅ Date: Saturday, March 14 — correct
- ✅ Meetings today: 0 — correct
- ✅ Creative Mode badge visible
- ✅ Stats strip: 27 signals, 10 high strength, 72 actions fired, Pipeline ACTIVE
- ✅ Channel grid: iMessage 9 (71h ago), Phone 5 (1d ago), Zoom 4 (3d ago), Email 0 (idle), Calendar 0 (idle), Brain Dump 9 (0h ago)
- ✅ Recent Signals section with "View All" link
- ✅ Sidebar: Dashboard, Signal Feed, Channels (collapsed), Platform (collapsed), Product Concepts (collapsed), Cases (collapsed)
- ✅ Footer: Settings, Release Notes, Sign Out, Light/Dark toggle
- ✅ VANTA Orb FAB visible bottom-right (the breathing orb)
- ⚠️ Theme is dark mode despite code defaulting to light — localStorage may override
- ⚠️ Recent signals show "0h ago" for Brain Dump entries — these may be test data from recent Lovable commits

## Observations
- Dashboard is significantly improved from last audit — channel grid with signal strength bars, stats strip, mode badge
- VANTA Orb is the new FAB (replaces old Brain Dump page approach)
- Navigation restructured: "Product Concepts" group replaces old flat nav

## Signal Feed (/signals)
- ✅ 27 signals captured, 10 high strength, 72 actions fired, 1 filtered (noise)
- ✅ Signal Feed / Filtered Items tabs working
- ✅ Tag browser: ALL 27, INTRO 3, INSIGHT 9, INVESTMENT 2, DECISION 3, CONTEXT 1, MEETING 4, PHONE_CALL 5
- ✅ Filters: keyword search, type, chat mode, sender, priority all present
- ✅ Sort: Recent toggle visible
- ✅ Group auto-reply toggle visible
- ✅ Signal cards show: type badge, priority, source badge, risk level, time, sender, summary
- ✅ Smart Actions on each card: Copy Insight, Mark Reviewed, Remind, Cal Hold, Details
- ✅ VANTA Orb FAB visible bottom-right
- ✅ User mode integration — Creative mode active (full stream visible)
- ⚠️ Several Brain Dump entries from "9h ago" appear to be Lovable-generated test data (smart note design ideas)
- ⚠️ Signal count: 27 feed + 1 filtered = 28 total. Previously had discrepancy concern (PROD-02). Now seems consistent.

## Contacts (/contacts)
- Need to test

## Settings (/settings)
- Need to test tabs: General, Noise Queue, User Modes, Classification Audit

## Smart Contacts (/contacts)
- ✅ 14 contacts, 14 active (7d), 0 stalled (30d+)
- ✅ Sort modes: Strength, Recent, Density, Priority, A-Z — all present
- ✅ Search bar functional
- ✅ Contact cards show: avatar initial, name, recency, signal count, relationship score, high count, type breakdown, recent signal summaries
- ✅ Relationship scores: Steve Stoute 70, Marcus Thompson 65, Brain Dump 62, etc.
- ✅ Signal type badges per contact (INTRO, INVESTMENT, PHONE_CALL, MEETING, etc.)
- ✅ Sidebar expanded: Product Concepts group shows Daily Command, Smart Contacts, Relationship Graph, Brain Dump, Insight Engine, Investment Intel, Decision Capture

## Settings (/settings)
### General Tab
- ✅ Connected Sources: 5/5 active (Linq/iMessage, Phone, Zoom, Email, Calendar)
- ✅ Daily Digest toggle with time picker (07:00)
- ✅ Group Chat Auto-Reply toggle
- ✅ Reply Persona textarea with full system prompt visible
- ✅ All settings show last-updated timestamps

### Noise Queue Tab
- ✅ 1 item in queue, 0 dismissed, 1 total noise
- ✅ Promote To dropdown and Dismiss button functional
- ✅ Shows "Brain Dump" noise item: "blah blah blah..." — correct classification

### User Modes Tab
- ✅ Three mode cards: Creative (ACTIVE), Executive, Do Not Disturb
- ✅ Each card shows feature list (checkmarks)
- ✅ Creative mode correctly active

### Classification Audit Tab
- ✅ Full signal table with 28 total signals, 1 noise, 10 high priority
- ✅ Inline type/priority dropdowns for reclassification
- ✅ Search and filter by type
- ✅ Sort toggle

## VANTA Orb (FAB)
- ✅ Orb visible on all pages (bottom-right)
- ✅ Clicking opens Smart Note capture modal
- ✅ Modal shows: "New Note" header, textarea, quick tags (@person, #priority, #followup, #idea, #decision)
- ✅ Toolbar: Dictate, Tag, Edit, Share, Bookmark, Save button
- ✅ Backdrop blur overlay works
- ⚠️ Orb breathing animation visible but orbital accent dot not clearly visible in dark mode

## Light Mode
- ✅ Toggle works — switches to light background immediately
- ✅ Classification Audit table readable in light mode
- ✅ Sidebar, header, and all text elements have proper contrast
- ✅ Source badges (MANUAL, LINQ, PHONE, RECALL) have proper contrast in light mode
- ✅ Type dropdown badges (INSIGHT, DECISION, etc.) remain readable
- ✅ VANTA Orb visible in light mode (grey tone)
- ⚠️ NOISE badge row (row 43/44) — the badge text is slightly low contrast in light mode
