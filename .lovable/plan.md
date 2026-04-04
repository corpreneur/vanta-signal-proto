

# Plan: Zoom Launch Buttons + RTMS Integration

## What We're Building

Two connected workstreams: (1) surface "Launch Zoom" / "Start Meeting" buttons across every relevant touchpoint in the app, and (2) wire those launches to trigger RTMS stream activation so Vanta captures live meeting intelligence automatically.

## RTMS Architecture (from Zoom docs)

RTMS streams can launch three ways:
- **Automatically** -- when a user joins/hosts a meeting
- **On-demand** -- via REST API with meeting ID
- **From a Zoom App** -- using `startRTMS()` in the Zoom Apps SDK

For Vanta, the flow is: user taps "Launch Zoom" in our UI → we open `zoommtg://` deep link or `https://zoom.us/j/{id}` → a webhook fires `meeting.started` → our backend calls the RTMS REST API to start streaming → live transcript data flows via WebSocket to our edge function → signals are classified and stored in real-time.

## Surface Points for Zoom Launch Buttons

### 1. WhatsAhead (Dashboard "Coming Up" section)
Each meeting row gets a "Launch" button (Video icon) on the right side, next to the existing Brief link. Taps open the Zoom meeting via `zoom_meeting_id` from `upcoming_meetings` table or fall back to creating a new meeting.

### 2. Timeline HourBlock (meetings in the day view)
Each meeting bar in the timeline gets a small Video launch icon. Clicking opens Zoom for that meeting.

### 3. PreMeetingBriefCard
Add a "Join Meeting" button in the actions row alongside "Full Dossier". This is the highest-intent moment -- user is reviewing the brief right before the call.

### 4. QuickActionsGrid
Replace the "Offers" (coming soon) slot with a "Start Zoom" action that launches a new Zoom meeting via `https://zoom.us/start/videomeeting`. Or add it as a new entry in the grid.

### 5. ContactProfileHeader
Add a Video/Zoom icon to the quick-action buttons row (alongside Call, Text, Email, LinkedIn). Launches a Zoom meeting with the contact.

### 6. Command Page -- ChannelAgnosticComms
Already has a Zoom channel button. Verify it works; no changes needed here.

### 7. Signal Detail Drawer (meeting cards)
For MEETING-type signals, add a "Rejoin" or "Open Recording" button that links to the Zoom recording or meeting URL.

## Backend: RTMS Webhook Listener

### New Edge Function: `rtms-webhook`
Receives RTMS events from Zoom's WebSocket relay:
- `meeting.rtms.started` -- log that stream is active
- `meeting.rtms.stopped` -- finalize transcript
- Transcript chunks arrive via WebSocket with speaker labels and timestamps
- Each chunk is buffered and periodically classified using the existing Haiku triage + Sonnet detection pipeline

### Database Changes
- Add `rtms_stream_id` column to `upcoming_meetings` to track active streams
- Add `rtms_status` enum column (`idle`, `streaming`, `completed`) to `upcoming_meetings`

### New Edge Function: `start-rtms-stream`
Called after user launches Zoom. Takes a `meeting_id`, calls Zoom's RTMS REST API to start the stream. Requires Zoom OAuth credentials (already partially scaffolded via the zoom-webhook function).

## Implementation Steps

1. **Create a shared `ZoomLaunchButton` component** -- accepts `meetingId?`, `meetingUrl?`, `contactName?`, renders the Zoom-blue video icon button. Handles deep link logic (`zoommtg://` for native, `https://zoom.us/j/` for web). Fires a toast confirmation and optionally calls `start-rtms-stream`.

2. **Wire the button into all 6 surface points** listed above.

3. **Create `start-rtms-stream` edge function** -- calls Zoom REST API to initiate RTMS. Requires `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID` secrets.

4. **Create `rtms-webhook` edge function** -- receives streaming transcript data, buffers it, classifies in chunks, writes signals to DB in near-real-time.

5. **Add DB migration** -- `rtms_stream_id` and `rtms_status` on `upcoming_meetings`.

6. **Update `supabase/config.toml`** -- add `[functions.rtms-webhook]` and `[functions.start-rtms-stream]` with `verify_jwt = false`.

## Technical Notes

- The `ZoomLaunchButton` component uses the existing `vanta-accent-zoom` color tokens already defined in the design system
- RTMS requires a Zoom General App with RTMS scopes (`rtms:media:read`). The PRD already calls for submitting this app for approval
- Until RTMS is approved, the launch buttons still work -- they just open Zoom without the live stream. The Recall.ai fallback continues to handle post-meeting processing
- No pills. All buttons use the existing square-edged mono-font pattern

