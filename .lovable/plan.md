

# CMO Feedback Response — Implementation Plan

## Feedback Summary

Six areas of CMO feedback, each with concrete prototype changes:

1. **Sources of Signal** — Align on launch sources, clarify SMS/iMessage feasibility
2. **Signal Intelligence** — Rethink "risk" schema, make prioritization logic more transparent
3. **Views** — Add more "quick win" view lenses beyond the current set
4. **Focus View** — Move away from calendar-centric hub toward signal-humanity framing
5. **Capture** — Reframe from "create a thought" to "magic food processor" capture metaphor
6. **Actions** — Add capture-derived actions, lay groundwork for partner-based ephemeral offers

---

## Changes by Area

### 1. Sources of Signal — Launch Source Alignment

**Current state**: Platform lists 6 channels (iMessage/Linq, Phone, Zoom, Email, Calendar, Notes). No explicit launch-tier differentiation.

**Changes**:
- Update **Connectivity page** (`/connectivity`) to show a **Launch Tier** system:
  - **Tier 1 (Launch)**: SMS/iMessage (via Linq), Calendar, Capture (manual)
  - **Tier 2 (Fast-follow)**: Email, Phone
  - **Tier 3 (Roadmap)**: Zoom, Fireflies, Otter
- Add tier badges to each channel card (e.g., "Launch", "Fast-follow", "Roadmap")
- Add a summary strip: "3 launch sources · 2 fast-follow · 3 roadmap"

### 2. Signal Intelligence — Evolve Beyond "Risk"

**Current state**: Signals use `risk_level` (low/medium/high/critical) and `priority` (high/medium/low) as separate dimensions. The UI shows Shield icons for risk.

**Changes**:
- Rename "Risk Level" to **"Signal Weight"** across the UI — a more intuitive term that captures why something matters (urgency, stakes, time-sensitivity, relationship importance) rather than just "risk"
- Update `EnhancedActionItems.tsx`, `SignalEntryCard.tsx`, `SignalDetailDrawer.tsx` to use new terminology
- Add a **"Why this matters"** line in the signal detail drawer that surfaces the `classification_reasoning` field more prominently — making the AI's prioritization logic transparent and editable
- Update the Focus page Priority Lenses to use clearer categories: **Time-Sensitive**, **High-Stakes**, **Relationship**, **Quick Win** (replacing the current risk-centric framing)

### 3. Views — More Quick-Win Lenses

**Current state**: ViewfinderPills has 4 lenses (Recommended, Quick, Contact, Overdue).

**Changes**:
- Add new lenses to `ViewfinderPills.tsx`:
  - **"Under 5 min"** — signals with simple single-step actions (already partially "Quick")
  - **"Waiting On"** — signals in "In Progress" status awaiting response
  - **"This Week"** — signals with due dates in the current week
  - **"Relationships"** — INTRO and relationship-tagged signals
- Each lens gets a count badge showing how many signals match

### 4. Focus View — Signal-Humanity Hub

**Current state**: Dashboard hero says "Good morning" + "Clear until 11am" with meeting count — feels calendar-management focused per CMO feedback.

**Changes to `Index.tsx`**:
- Replace "Clear until {time}" with a **signal-centric context line** generated from actual data: e.g., "3 people waiting to hear from you · 1 decision by Friday" or "Quiet morning — good time to think"
- Replace the meeting-count stat with a **"People in your orbit today"** count (unique senders from today's signals + meeting attendees)
- Add a **"Signal Pulse"** indicator — a single-sentence AI-generated line from the `generate-brief` function that captures the emotional/relational tone of the day, not just logistics
- Keep WhatsAhead but reframe its header from calendar-forward to **"Coming Up"** with signals interspersed alongside meetings

### 5. Capture — Magic Food Processor

**Changes**:
- Update `InlineBrainDump.tsx` placeholder from "What's on your mind? Drop a note, link