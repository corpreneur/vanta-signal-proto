

# Build Plan: All 6 Strategic Features

This is a large build covering six interconnected features. Here is the implementation plan organized by feature, with dependencies noted.

---

## 1. Pre-Meeting Brief Dossier (enhance existing)

The current `PreMeetingBriefCard` is a compact notification. Upgrade it to a full dossier experience.

**Changes:**
- Create `src/pages/Briefing.tsx` — a dedicated `/briefing/:id` route that renders a full-page dossier for a single brief
- Enhance `PreMeetingBriefCard` with a "View Full Dossier" link to this route
- The dossier page pulls all signals for each attendee, groups by channel, and renders a per-person timeline with key talking points
- Add route to `App.tsx` and sidebar nav under Core group

**Database:** No schema changes needed — `pre_meeting_briefs` already has `matched_signals` and `attendee_context` JSON fields.

---

## 2. Contact Timeline

A chronological interaction history for each contact, accessible from the Relationship Graph.

**Changes:**
- Create `src/pages/ContactTimeline.tsx` at `/contact/:name` showing all signals for a given sender, grouped by date, with channel icons
- Update `RelationshipGraph.tsx` to make each contact node clickable, navigating to `/contact/:encodedName`
- Add route to `App.tsx`
- Reuse existing `SignalEntryCard` for each timeline entry

**Database:** No changes — queries `signals` table filtered by `sender`.

---

## 3. Actionable Signals (Reply, Remind, Calendar Hold)

Add inline action buttons to `SignalEntryCard` and `SignalDetailDrawer`.

**Changes:**
- Add three action buttons to `SignalEntryCard`: **Reply** (opens compose in drawer), **Remind** (creates a follow-up signal with due date), **Calendar Hold** (opens native calendar via `webcal:` or Google Calendar URL)
- Reply: leverage existing Linq reply infrastructure in `SignalDetailDrawer` — extract reply logic into a shared `useSignalReply` hook
- Remind: inserts a new signal with `signal_type: CONTEXT`, `due_date` set to user-selected date, `source: manual`
- Calendar Hold: constructs a Google Calendar URL with pre-filled title/description from signal summary

**Database:** Remind action needs service_role insert. Create a small edge function `supabase/functions/create-reminder/index.ts` that accepts signal ID + due date, creates a reminder signal.

---

## 4. Mobile-First Command View

A streamlined view optimized for quick executive checks between meetings.

**Changes:**
- Create `src/pages/Command.tsx` at `/command` — a single-screen view showing:
  - Today's upcoming briefs (from `pre_meeting_briefs` + `upcoming_meetings`)
  - Top 3 actionable signals (high priority, not complete)
  - Quick capture button (inline `NoteCapture`)
- Add to sidebar under Core group
- Use large touch targets, minimal chrome, stacked vertical layout
- Auto-detect mobile viewport and show a banner on dashboard suggesting `/command`

---

## 5. Daily Digest (Edge Function + Settings)

A push-based summary delivered via Linq iMessage.

**Changes:**
- Create `supabase/functions/daily-digest/index.ts` — an edge function that:
  - Queries top 5 signals from the last 24h by priority
  - Queries overdue signals
  - Generates a formatted summary using Gemini Flash via Lovable AI
  - Sends via Linq API to self (LINQ_FROM_NUMBER)
- Add `pg_cron` job to run daily at 7:00 AM CT
- Add `digest_enabled` and `digest_time` settings to `system_settings` table (via insert tool)
- Add digest toggle to Settings page

**Database:** Insert new system_settings rows for digest config.

---

## 6. Design System Maturity (Design Tokens + Motion)

Polish the visual system with consistent motion and token usage.

**Changes:**
- Add CSS custom properties for motion durations and easings in `index.css`: `--motion-fast`, `--motion-normal`, `--motion-slow`
- Add reusable animation classes: `animate-slide-up`, `animate-slide-right`, `animate-scale-in`
- Create `src/components/ui/motion.tsx` — a wrapper component for entrance animations using CSS transitions
- Update key components (`SignalEntryCard`, `PreMeetingBriefCard`, channel grid tiles) to use the motion wrapper for staggered entrance animations
- Add a subtle page transition effect to `ProductLayout`

---

## Implementation Order

1. **Design System Maturity** — foundation for all other features
2. **Contact Timeline** — standalone, unblocks Graph interactivity
3. **Pre-Meeting Dossier** — enhances existing feature
4. **Actionable Signals** — requires reminder edge function
5. **Mobile Command View** — depends on briefs + actionable signals
6. **Daily Digest** — independent edge function + cron job

## New Files