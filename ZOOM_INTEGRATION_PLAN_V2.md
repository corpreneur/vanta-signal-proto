# Vanta Signal - Integration Plan v2.0: Meeting Intelligence (Reconciled)

**Date:** 2026-03-12
**Authored By:** Manus (CBO, CDO, CoS, Product Team, Eng)
**Status:** Dev-Ready
**Reference:** This document reconciles the `VANTAZOOMCONVERGENCEBRIEF.pdf` with the as-built Vanta Signal architecture.

---

## 1. Executive Framing (CBO / CoS)

**The Why:** The strategic imperative remains unchanged. The Vanta Signal Platform must capture high-value intelligence from synchronous meetings to complement its existing text-based signal ingestion from Linq and Gmail. This integration closes that gap.

**The Reconciliation:** The initial convergence brief proposed a **Recall.ai + Claude + Notion** stack for the prototype. We accept the core recommendation to use **Recall.ai** for V1 to bypass Zoom's native API friction and accelerate time-to-market. However, the as-built Vanta prototype uses **Supabase** as its data layer, not Notion. Therefore, this plan adapts the recommended architecture to our existing stack.

**The Mandate:** The V1 implementation will use **Recall.ai + Supabase + Lovable AI Gateway**. This is a P0 initiative. The goal is to create a new `MEETING` signal type, ingested via a webhook pipeline from Recall.ai, processed by our existing classification engine, and stored in our Supabase database.

## 2. Product Requirements (Product Manager)

The product requirements are adopted directly from the convergence brief, as they are implementation-agnostic.

*   **Core User Story:** "As a creative entrepreneur who runs 5-10 Zoom meetings per week, I want every meeting automatically processed so that the intellectual capital generated in those calls — frameworks, decisions, quotes, commitments — is captured, tagged, and available to me without any manual effort."
*   **New Signal Type:** A new `MEETING` signal type will be introduced.
*   **Enriched Detail View:** The `SignalDetailDrawer` will be enhanced to display meeting-specific artifacts: a full transcript, an AI-generated summary, and an embedded video player.

## 3. Design Specifications (Chief Design Officer)

The design specifications are adopted directly from the convergence brief.

*   **Signal Card:** A new `MEETING` badge will be created using Zoom Blue (`#2D8CFF`). The card will feature a video camera icon for clear visual distinction in the main feed.
*   **Signal Detail Drawer:** For `MEETING` signals, the drawer will feature a tabbed interface:
    *   **Tab 1: Intelligence Summary (Default):** The existing view.
    *   **Tab 2: Meeting Summary:** Displays the full summary from Recall.ai.
    *   **Tab 3: Transcript:** A scrollable view of the full meeting transcript with speaker attribution.
    *   **Tab 4: Recording:** An embedded HTML5 `<video>` player for the MP4 recording.
*   **Design System Extension:**

| Element | Color Hex | Tailwind/CSS Variable |
| :--- | :--- | :--- |
| **MEETING** | `#2D8CFF` | `hsl(var(--vanta-accent-zoom-blue))` (new) |

## 4. Technical Implementation Plan (Reconciled for Supabase)

This plan replaces the Notion-based architecture with our existing Supabase infrastructure.

### Architecture:

**Recall.ai -> Supabase Edge Function (`recall-webhook`) -> Lovable AI Gateway -> Supabase DB**

1.  **Recall.ai Bot:** The Recall.ai bot joins a Zoom meeting and records it.
2.  **Webhook Event:** After processing, Recall.ai sends a `transcript.ready` webhook to our new Supabase edge function.
3.  **Processing Pipeline (`recall-webhook`):**
    a.  The function receives the webhook, verifies the signature, and parses the JSON payload which contains the full transcript and metadata.
    b.  It invokes our existing classification pipeline (the `classifySignal` logic from `linq-webhook`), adapted with a new prompt optimized for meeting transcripts and speaker context.
    c.  It writes the classified signal to the `signals` table and the associated artifacts to the new `meeting_artifacts` table.

### Database Schema Changes (Supabase):

**1. Update `signals` table:**

```sql
-- Add 'recall' to the signal_source enum
ALTER TYPE signal_source ADD VALUE 'recall';

-- Add a field to link to the meeting platform's ID
ALTER TABLE signals
ADD COLUMN meeting_id TEXT;
```

**2. Create `meeting_artifacts` table:**

```sql
CREATE TABLE public.meeting_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transcript_json JSONB, -- Store the full structured transcript from Recall.ai
  summary_text TEXT, -- Store the summary from Recall.ai
  recording_url TEXT, -- Store the MP4 download/playback URL
  attendees JSONB -- Store the list of participants
);

ALTER TABLE public.meeting_artifacts ENABLE ROW LEVEL SECURITY;
```

### New Supabase Function (`recall-webhook`):

A new edge function at `supabase/functions/recall-webhook/index.ts` will be created. It will be a composite of the existing `linq-webhook` and `gmail-poll` functions, containing:

*   **Signature Verification:** Logic to verify the `X-Recall-Signature` header.
*   **Payload Parsing:** Logic to parse the Recall.ai JSON payload.
*   **Classification:** A new `classifyMeetingSignal` function that adapts the existing classification prompt to handle long-form transcripts and speaker diarization.
*   **Database Insertion:** A transaction that inserts into both the `signals` and `meeting_artifacts` tables.

### Frontend Modifications:

*   `src/data/signals.ts`: Add `MEETING` to the `SignalType` enum and `recall` to the `SignalSource` enum.
*   `tailwind.config.ts` & `index.css`: Add the new `--vanta-accent-zoom-blue` color token.
*   `src/components/SignalDetailDrawer.tsx`: When `signal.source === 'recall'`, fetch the corresponding row from `meeting_artifacts` using the `signal.id` and render the new tabbed interface.

## 5. Phasing & Next Steps

*   **Phase 1 (This Plan):** Implement the **Recall.ai + Supabase** pipeline. This validates the end-to-end user experience with minimal external dependencies.
*   **Phase 2 (Future):** Explore migrating from Recall.ai to Zoom's native **RTMS API** for live, in-meeting signal detection, as recommended in the original brief. This would be a pure engineering swap-out, as the user-facing product will have already been validated.

**Immediate Next Steps:**

1.  **Engineering:** Sign up for the Recall.ai free tier. Use their API to have the bot join one internal test meeting. Capture the `transcript.ready` webhook payload to validate the JSON structure against this plan.
2.  **Product:** Formalize the meeting-specific signal tags (e.g., `decision`, `action_item`, `commitment`) to be added to the classification prompt.
3.  **All:** Lock this reconciled plan and begin the moment the Recall.ai payload is validated.
