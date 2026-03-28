

# Smart Contacts Evolution — Implementation Plan

## Context

The spec defines Smart Contacts as **"a relationship layer built on top of a contact list, not a CRM."** The current implementation already has significant foundations: signal-derived contacts, strength scoring, contact tags, engagement sequences, relationship briefs, and a timeline view. The spec asks us to close the gaps toward a carrier-grade contact card experience.

## Gap Analysis: Spec vs. Current State

| Spec Feature | Current State | Gap |
|---|---|---|
| Contact card with photo, title, company, notes | Partial — `ContactProfileHeader` has role/company/email/phone but stores in signals metadata hack | Needs a dedicated `contact_profiles` table |
| Manual contact creation with "How we met" | `AddContactContext` exists but minimal | Add relationship type selector, source tag, duplicate detection |
| Relationship type (Client, Prospect, Partner...) | Not implemented | New field on contact profile |
| Pinned contacts (up to 5) | Exists on signals but not contacts-level | Add `pinned` boolean to contact profiles |
| "Re-engage" tray (dormant 30+ days) | `CoolingAlerts` + `relationship_alerts` table exists | Wire into Contacts home as a visual tray |
| "New People" tray (unknown callers/texters) | Not implemented | Surface recent INTRO signals as suggestions |
| Post-call note prompt | `ContactNotes` component exists | Add post-call modal UX trigger |
| Interaction timeline with filters | `ContactTimeline` page exists with full timeline | Add filter toggles (All/Calls/Messages/Notes) |
| Call history summary widget | Not implemented on card | Add call stats to contact card |
| AI-generated contact summary ("Prepare") | `relationship-brief` edge function exists | Wire "Prepare" button to existing function |
| Search with filter chips | Basic search exists | Add relationship type + recency filter chips |
| Duplicate merge | Not implemented | New feature |

## Plan

### 1. Create `contact_profiles` table

New database table to persist contact data beyond signal derivation:

```sql
CREATE TABLE contact_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text,
  photo_url text,
  title text,
  company text,
  email text,
  phone text,
  relationship_type text DEFAULT 'personal',  -- client, prospect, partner, investor, vendor, personal
  how_we_met text,
  source_tag text DEFAULT 'manual',  -- manual, imessage, call, import
  private_notes text,
  pinned boolean DEFAULT false,
  pinned_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

With RLS for authenticated users. This gives contacts a persistent identity independent of signals.

### 2. Redesign the Contacts Home (`/contacts`)

Restructure the page layout to match the spec's action-oriented home:

- **Top rail**: Search bar (already exists, keep it)
- **Pinned section**: Up to 5 starred contacts from `contact_profiles.pinned = true`, displayed as compact avatar row
- **"Re-engage" tray**: Query contacts where `daysSinceLast > 30` and relationship_type in (client, partner, investor) — horizontal scrollable cards with one-tap Call/Message/Note
- **"New People" tray**: Recent INTRO signals not yet in `contact_profiles` — shown as suggestion cards with one-tap save
- **Full contact list**: Sorted by recency (default), with A-Z toggle — already exists

### 3. Evolve `SmartContactCard` to match spec

Update the card component to include:

- Contact avatar with photo (from `contact_profiles.photo_url`) or initial fallback
- Title + company from profile (not just signal-derived)
- Relationship type badge
- Call history summary widget: total calls, total minutes, last call date (derived from signals where `source = 'phone'`)
- "Prepare" button that calls the existing `relationship-brief` edge function
- Quick action strip: Call, Message, Note, Remind (consolidate existing CTAs)
- Inline-editable notes field

### 4. Enhance Manual Contact Creation

Upgrade `AddContactContext` to a full creation flow:

- Add relationship type selector (Client, Prospect, Partner, Investor, Vendor, Personal)
- Add source tag selector
- Insert into `contact_profiles` table on save
- Auto-duplicate detection: check name + phone match before insert
- Fields: name, phone, email, title, company, tags, "How we met"

### 5. Add Timeline Filters

On `ContactTimeline` page, add filter toggle bar:

- All / Calls / Messages / Notes
- Filter signals by `source` field mapping (phone -> Calls, linq/gmail -> Messages, manual -> Notes)

### 6. Wire "Prepare" Button

Add a "Prepare" button on the contact card and timeline header that:
- Calls the existing `relationship-brief` edge function
- Displays the 2-3 sentence AI summary in a sheet/drawer
- Already exists as infrastructure, just needs UI wiring

---

## Sprint 1 Priority (matching spec)

1. `contact_profiles` table migration
2. Contacts home redesign (pinned + re-engage + new people trays)
3. SmartContactCard evolution (profile fields, call stats, prepare button)
4. Enhanced manual creation flow
5. Timeline filter toggles

Duplicate merge and advanced search history are Sprint 2.

## Technical Notes

- The `contact_profiles` table decouples persistent profile data from signal-derived runtime data. The existing signal aggregation continues to power strength scores and activity metrics, while profile data (title, company, relationship type, pinned status) lives in the new table.
- No changes to `src/integrations/supabase/client.ts` or `types.ts` — those auto-generate after migration.
- Mobile-first, dark mode default, consistent with existing Vanta design language.

