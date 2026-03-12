# Vanta Signal - Integration Plan: Zoom Meeting Intelligence

**Date:** 2026-03-12
**Authored By:** Manus (CBO, CDO, CoS, Product Team, Eng)
**Status:** Dev-Ready

---

## 1. Executive Framing (CBO / CoS)

**The Why:** The Vanta Signal Platform currently excels at capturing real-time signals from text-based communication (iMessage via Linq). However, a significant portion of high-value intelligence is exchanged in synchronous meetings. This integration closes that gap by abstracting video, transcripts, and AI-generated summaries from Zoom meetings directly into the Vanta signal pipeline. It transforms transient conversations into durable, queryable assets, completing the 360-degree view of intelligence capture.

**The Mandate:** This is the next logical evolution of the platform. The objective is to build a robust, webhook-driven pipeline that listens for completed Zoom meetings, fetches the relevant artifacts (recording, transcript, summary), processes them through our existing classification engine, and surfaces them as a new `MEETING` signal type within the `/signals` feed. This is a P0 initiative.

## 2. Product Requirements (Product Manager)

The Zoom integration will introduce a new signal type and the backend infrastructure to support it. The user-facing changes will be minimal and focused on enriching the existing Signal Feed.

### User Stories:

*   **As a user, I want to see signals generated from my Zoom meetings automatically appear in my Signal Feed so that I can have a complete record of all intelligence.**
*   **As a user, I want to view the key takeaways, full transcript, and video recording of a meeting directly from the signal detail view so that I can quickly reference the source material.**
*   **As an administrator, I want to configure the Zoom integration with a Server-to-Server OAuth app so that the system can securely access meeting data without user intervention.**

### Core Features:

1.  **New Signal Type:** A new `MEETING` signal type will be introduced into the system.
2.  **Backend Webhook Pipeline:** A new set of Supabase edge functions will be created to handle webhooks from Zoom.
3.  **Data Ingestion:** The pipeline will process `recording.completed`, `recording.transcript_completed`, and `meeting.summary_completed` webhooks.
4.  **Signal Enrichment:** When a `MEETING` signal is displayed in the `SignalDetailDrawer`, it will include new tabs/sections for:
    *   **Summary:** The AI-generated meeting summary from Zoom.
    *   **Transcript:** The full meeting transcript.
    *   **Recording:** An embedded video player for the meeting recording.

## 3. Design Specifications (Chief Design Officer)

The primary design task is to seamlessly integrate the new meeting-related data into the existing `SignalDetailDrawer` without disrupting the established user experience.

### UI Modifications:

*   **Signal Feed (`SignalEntryCard.tsx`):**
    *   A new `MEETING` badge will be created with a distinct color (e.g., Zoom Blue: `#2D8CFF`).
    *   The card will display a meeting icon (e.g., a video camera) to visually differentiate it from other signal types.
*   **Signal Detail Drawer (`SignalDetailDrawer.tsx`):**
    *   When a `MEETING` signal is selected, the drawer will contain a tabbed interface.
    *   **Tab 1: Intelligence Summary (Default):** The existing view with the classified summary, entities, and actions.
    *   **Tab 2: Meeting Summary:** Displays the full, formatted Markdown summary from `summary_content`.
    *   **Tab 3: Transcript:** Displays the full meeting transcript in a scrollable view.
    *   **Tab 4: Recording:** Displays an HTML5 `<video>` player with the `download_url` of the MP4 recording.

### Design System Extensions:

| Element | Color Hex | Tailwind/CSS Variable |
| :--- | :--- | :--- |
| **MEETING** | `#2D8CFF` | `hsl(var(--vanta-accent-zoom-blue))` (new) |

## 4. Technical Implementation Plan (Head of Product Engineering)

This integration is primarily a backend build, with minor frontend modifications. It will leverage the existing Supabase infrastructure.

### Architecture:

1.  **Zoom S2S OAuth App:** A new Server-to-Server OAuth app will be created in the Zoom Marketplace to obtain credentials (`account_id`, `client_id`, `client_secret`). These will be stored as secrets in Supabase.
2.  **Webhook Endpoint:** A new Supabase edge function, `zoom-webhook`, will be created to receive and verify all inbound webhooks from Zoom.
3.  **Processing Pipeline:** Upon receiving a `recording.completed` or `meeting.summary_completed` event, the webhook handler will trigger a series of steps:
    a.  **Fetch Artifacts:** Call the Zoom API to get the recording files, transcript, and summary content.
    b.  **Classify Content:** Pass the transcript and summary to the existing `sonnet-classify` pipeline to extract entities, priority, and actions.
    c.  **Store Data:** Insert a new record into the `signals` table with the type `MEETING`, and store the raw transcript, summary, and recording URL in a new `meeting_artifacts` table linked by `signal_id`.
4.  **Frontend Update:** The `SignalDetailDrawer` will be updated to fetch and display the data from the `meeting_artifacts` table when the signal type is `MEETING`.

### File Structure (New & Modified):

*   **New Supabase Functions:**
    *   `supabase/functions/zoom-webhook/index.ts`: Main webhook handler.
    *   `supabase/functions/zoom-oauth/index.ts`: Handles token generation and refresh.
    *   `supabase/functions/zoom-processor/index.ts`: Fetches and processes artifacts.
*   **New Database Migrations:**
    *   A new migration to create the `meeting_artifacts` table (`signal_id`, `summary_content`, `transcript_content`, `recording_url`).
*   **Modified Frontend Files:**
    *   `src/components/SignalDetailDrawer.tsx`: Add tabbed interface for meeting artifacts.
    *   `src/data/signals.ts`: Add `MEETING` to the `SignalType` enum.
    *   `tailwind.config.ts` & `index.css`: Add the new `--vanta-accent-zoom-blue` color.

### Implementation Steps:

1.  **Setup Zoom App:** Create the S2S OAuth app in Zoom and add the required scopes (`recording:read:admin`, `meeting_summary:read:admin`, etc.).
2.  **Store Credentials:** Add the Zoom app credentials as secrets in the Supabase project.
3.  **Build OAuth Handler:** Create the `zoom-oauth` function to manage access tokens.
4.  **Build Webhook Handler:** Create the `zoom-webhook` function with signature verification.
5.  **Build Processor:** Create the `zoom-processor` function to orchestrate the fetching and classification.
6.  **Deploy Webhook:** Deploy the `zoom-webhook` function and register the URL in the Zoom app.
7.  **Update Database:** Create and run the migration for the `meeting_artifacts` table.
8.  **Update Frontend:** Modify the `SignalDetailDrawer` and design system.
9.  **End-to-End Test:** Schedule a test Zoom meeting, ensure it records, and verify that the signal appears correctly in the Vanta UI after the end of the meeting.
