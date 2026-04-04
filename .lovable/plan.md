

## Plan: Enhance Zoom demo completion — working buttons, audio/video capture

### What exists now
The SummaryPanel at the bottom of the Zoom demo has four buttons:
1. **Reset demo** — works
2. **View artifact** — navigates to /meetings (works)
3. **Export PDF** — shows a "coming soon" toast (stub)
4. **Product concept** — navigates to /product/zoom-sdk (works)

### What we'll build

#### 1. Export PDF — generate a real meeting summary PDF
- When tapped, generate a client-side PDF using the summary data already in the page (narrative, key takeaways, action items, signals, participant list, duration)
- Use `jspdf` library (lightweight, no server needed) to build a clean, branded PDF
- Layout: Vanta Signal header → meeting metadata strip → narrative → key takeaways → detected signals → action items
- Trigger a browser download of `vanta-session-summary.pdf`

#### 2. Add audio capture simulation (Step 5)
- Add a new section after the summary: **Audio capture**
- Show a simulated audio waveform visualization (CSS bars animating) during the stream phase
- After session completes, show an "Audio recorded" confirmation with a mock playback bar (static, non-functional but visually indicates the capability)
- Label: "Raw audio captured via RTMS — 11m 08s"

#### 3. Add video capture simulation (Step 5 continued)
- Below the audio section, show a **Video capture** block
- During streaming: show a small "Recording" indicator with a red dot on the video grid
- After session completes: show a thumbnail grid of the 3 participant tiles with a "Recording saved" label and file size (e.g., "47.2 MB")
- Include a "Download recording" button (shows toast: "Video export requires native SDK")

#### 4. Clean up step 4 description
- Replace the current step 4 description ("The completion step now renders through a simplified single-file path to avoid the previous Safari crash") with proper product copy

### Files changed

| File | Change |
|------|--------|
| `src/pages/ZoomDemo.tsx` | Add PDF export logic, audio/video capture sections, fix step 4 copy |
| `package.json` | Add `jspdf` dependency |

### Technical notes
- PDF generation uses `jspdf` with manual text layout — no external fonts needed, uses built-in Helvetica
- Audio waveform is pure CSS (animated bar heights via Tailwind `animate-pulse` on staggered elements)
- Video recording indicator is a simple red dot + "REC" label overlaid on the video grid during streaming
- All new sections render inline in `ZoomDemo.tsx` (no new component files) to maintain the Safari-safe single-file architecture
- No backend changes needed — everything is client-side mock/demo

