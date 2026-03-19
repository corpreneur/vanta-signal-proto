

## Three-Part Refresh: Partner Logos, De-Pill, LinkedIn Integration

### 1. Connected Accounts — Partner Logo Refresh

Replace the single-letter placeholder icons (G, Z, L, in, S, N) on the Connected Accounts page with proper SVG brand logos for each integration partner.

**Files:** `src/pages/ConnectedAccounts.tsx`
- Add inline SVG components (or a shared `PartnerLogos.tsx` map) for: Google, Zoom, Linq, Slack, LinkedIn, Notion, Otter.ai, Fireflies.ai
- Replace the `<div>G</div>` icon blocks with the actual SVG mark for each integration
- Also update `src/pages/Connectivity.tsx` channel cards to use the same logo set instead of Lucide icons where a brand mark exists (Zoom, Gmail/Google, Slack)

**New file:** `src/components/PartnerLogos.tsx` — a single map of `{ [integrationId]: React.FC<SVGProps> }` so both pages share logos

---

### 2. Global De-Pill — Replace `rounded-full` with Sharp Geometry

The Vanta design system uses hard edges. All interactive pill-shaped elements (tags, badges, filters, lenses) currently using `rounded-full` should switch to `rounded-sm` (2px) or no radius.

**Files to update (~12 files, mechanical find-replace):**

| File | What changes |
|---|---|
| `src/components/ui/badge.tsx` | Base variant: `rounded-full` → `rounded-sm` |
| `src/components/CaptureTemplates.tsx` | Template pill buttons |
| `src/components/NoteCapture.tsx` | Quick tag buttons (`@person`, `#priority`) |
| `src/components/ViewfinderPills.tsx` | Lens selector buttons |
| `src/pages/ReleaseNotes.tsx` | Filter pills |
| `src/pages/ConnectedAccounts.tsx` | Status badges |
| `src/components/AskVantaBar.tsx` | Suggested prompt pills |
| `src/components/ContactTagManager.tsx` | Tag chips |
| `src/components/SignalEntryCard.tsx` | Any rounded-full on action chips |
| `src/components/CalendarSyncSettings.tsx` | Status dot (keep rounded for dots) |
| `src/components/CommsPrepCard.tsx` | Bullet dots (keep rounded) |
| `src/pages/PersonalInfo.tsx` | Avatar circle (keep rounded) |

**Rule:** Decorative circles (avatars, status dots, timeline dots) keep `rounded-full`. Interactive elements (buttons, badges, tags, filters) move to `rounded-sm`.

---

### 3. LinkedIn Integration for Dossiers and Meeting Briefs

Add LinkedIn profile enrichment to the contact dossier and pre-meeting briefing views. This does not require LinkedIn API access — it uses URL construction and existing signal data.

**A. Contact Profile Header — LinkedIn link**
- `src/components/contacts/ContactProfileHeader.tsx`: Add a "View on LinkedIn" button that constructs a `linkedin.com/search/results/people/?keywords=` URL from the contact name (or stored LinkedIn URL from `raw_payload`)
- If a LinkedIn URL is already captured in signals (the deep-link detector already finds them), surface it directly

**B. Meeting Brief Dossier — LinkedIn per attendee**
- `src/pages/Briefing.tsx`: In each attendee dossier section, add a LinkedIn search/profile link next to the attendee name
- Scan that attendee's signals for any captured LinkedIn URLs; if found, link directly; otherwise, fall back to a search link

**C. Edge function enrichment (optional fast-follow)**
- A `linkedin-enrich` edge function that, given a contact name + company, uses Firecrawl or a public profile scraper to pull headline, current role, and mutual connections
- Store results in `raw_payload._vanta_linkedin_profile` on a CONTEXT signal
- This is additive — the UI links work without it

**Files modified:**
- `src/components/contacts/ContactProfileHeader.tsx` — add LinkedIn button
- `src/pages/Briefing.tsx` — add LinkedIn link per attendee in dossier header
- `src/components/SmartContactCard.tsx` — add LinkedIn icon link on contact cards

