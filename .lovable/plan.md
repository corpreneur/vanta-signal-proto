

# Plan: Layer Three Features into Zoom Demo

## What We're Adding

Three new sections to the existing `/zoom-demo` page that complete the meeting lifecycle: a pre-meeting dossier before the session, a live video grid during the session, and a post-session AI summary after completion.

## 1. Pre-Meeting Brief Panel (before Step 1)

A new section at the top that appears immediately on page load, showing attendee intelligence before the session starts.

- **Attendee dossiers** for Sarah Chen and Marcus Rivera, each showing:
  - Relationship strength bar (e.g., 82/100)
  - Last interaction date and channel
  - 2-3 matched past signals (e.g., "Mentioned Series A timing — 3 weeks ago")
  - One open commitment or action item
- **Styling**: Same card/border pattern, with a "Dossier" step indicator (Step 0 or unnumbered header section)
- **Behavior**: Always visible, dims once the session starts (like the existing step dimming pattern)
- Uses mock data only — no DB queries needed

## 2. Live Video Grid Mockup (during RTMS streaming phase)

A simulated participant video layout that appears alongside the transcript during the `streaming` and `detecting` phases.

- **Grid layout**: 2x2 tiles (You, Sarah Chen, Marcus Rivera, and a "Vanta Signal" AI tile)
- Each tile shows:
  - Initials avatar circle with participant name below
  - Active speaker highlight (green border pulses when their transcript line is current)
  - Mute/unmute icon state
  - The "Vanta Signal" tile shows a waveform animation during streaming
- **Placement**: Above the transcript panel in Step 3, wrapped in a bordered container
- **Responsive**: On the 393px viewport, tiles stack as a 2x2 grid with small sizing
- Pure CSS/mock — no actual video streams

## 3. Post-Session Summary Card (after Step 4 completion)

Replaces the current minimal "Session complete" block with a rich AI-generated meeting summary.

- **Meeting metadata strip**: Duration (11m 08s), participants (3), signals captured (3)
- **Narrative summary**: 2-3 paragraph mock summary of the meeting (e.g., "Series A terms were agreed at $12M pre-money with Q3 close targeted...")
- **Key takeaways**: Bulleted list of 3-4 items extracted from the signals
- **Action items**: Checklist-style items with assignees (e.g., "Sarah Chen: Send updated term sheet by Friday")
- **Attendee enrichment badge**: Shows that Sarah Chen and Marcus Rivera profiles have been updated with new signals
- **Links**: "View full artifact" (links to `/meetings`), "Export PDF" (placeholder), and existing "Reset demo" + "Product concept" buttons

## Implementation

All changes are in `src/pages/ZoomDemo.tsx` only:

1. Add mock data constants for attendee dossiers, meeting summary, and action items
2. Add a `PreSessionDossier` section rendered before Step 1, dimmed after `jwt-ready`
3. Add a `VideoGrid` section rendered inside Step 3 when `rtmsStatus === "streaming"` or phase is `detecting`
4. Replace the existing "complete" block with the expanded `PostSessionSummary`
5. No new files, no DB changes, no edge functions — all mock/simulation data

## Technical Notes

- Active speaker detection in the video grid syncs with `transcriptIndex` — the tile whose name matches the current `TRANSCRIPT_LINES[transcriptIndex].speaker` gets the highlight border
- Post-session summary uses the same signal color tokens (`SIGNAL_COLORS`) for inline type badges
- All new sections follow the existing mono-font, square-edge, no-pill design pattern

