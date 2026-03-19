

## Granola-Inspired Enhancements for Idea Capture

The Granola screenshots showcase several patterns we can adapt to Vanta Signal's Idea Capture hub. Here's what maps well and how to build it.

### What We're Adding

**1. Capture Templates (like Granola's meeting type pills)**
A row of template pills above the note input: "Free Form", "Meeting Notes", "Investment Memo", "Intro Brief", "Decision Log". Selecting one pre-populates the textarea with a lightweight skeleton (section headers) and adjusts the AI classification prompt context.

**2. Before/After Split View (like Granola's "Your notes" → "AI enhanced")**
After a note is captured and classified, show a two-panel result: left panel shows the raw input text, right panel shows the AI-structured output (title, sections, tags, contacts, accelerators). Uses the same warm card aesthetic from Granola with the traffic-light dots header.

**3. "Ask Vanta" Chat Over Captures**
A compact input bar at the bottom of the result card: "Ask Vanta anything about this capture…" with suggested prompt pills (e.g., "Summarize key decisions", "Who should I follow up with?", "What are the next steps?"). Calls an edge function that passes the captured note + question to Gemini.

**4. Quick Share/Export Actions (like Granola's share menu)**
A share row on the result card with icon buttons for: Copy to clipboard, Email to participants, Open in Notion (deep-link placeholder), Share public link (future). Uses the same vertical list style from Granola's share panel.

**5. Session Notes List (like Granola's sidebar note list)**
Upgrade the "Recent Captures" section to show a more Granola-like card format: title bold, timestamp + attendee count, with template type pill badge.

### Technical Details

**Files to create:**
- `src/components/CaptureTemplates.tsx` — template pill selector + skeleton content map
- `src/components/CaptureResultSplit.tsx` — before/after two-panel result view with traffic-light header dots
- `src/components/AskVantaBar.tsx` — chat-over-capture input + suggested prompts
- `supabase/functions/ask-capture/index.ts` — edge function: takes note text + question, returns AI answer via Lovable AI

**Files to modify:**
- `src/pages/BrainDump.tsx` — integrate templates above tabs, replace inline result display with split view, add Ask Vanta bar
- `src/components/NoteCapture.tsx` — accept optional template skeleton, pass raw text back to parent for split view
- `src/data/releaseNotes.ts` — document v1.6.0

**Template data structure:**
```text
templates = [
  { key: "freeform", label: "Free Form", skeleton: "" },
  { key: "meeting", label: "Meeting Notes", skeleton: "Attendees:\n\nKey Points:\n\nDecisions:\n\nNext Steps:" },
  { key: "investment", label: "Investment Memo", skeleton: "Company:\n\nStage:\n\nAsk:\n\nThesis:\n\nRisks:" },
  { key: "intro", label: "Intro Brief", skeleton: "Who:\n\nContext:\n\nAsk:\n\nRelevance:" },
  { key: "decision", label: "Decision Log", skeleton: "Decision:\n\nContext:\n\nOptions Considered:\n\nOutcome:" },
]
```

**Split view layout:**
```text
┌─────────────────────┬─────────────────────┐
│ ● ● ●               │ ● ● ●   ✦ Enhanced  │
│                      │                     │
│  Your raw input      │  AI-structured      │
│  text as typed       │  title, sections,   │
│                      │  tags, contacts     │
│                      │                     │
├─────────────────────┴─────────────────────┤
│ Ask Vanta anything…    [Decisions] [Next]  │
└───────────────────────────────────────────┘
```

**Ask Vanta edge function:** Receives `{ noteText, question }`, builds a system prompt scoped to the note content, returns a concise answer. Uses `google/gemini-2.5-flash` for speed.

### Scope

This adds 4 new components, 1 new edge function, and modifies 3 existing files. The split view and templates are the highest-impact items. The Ask Vanta bar can be a fast-follow if you want to ship templates + split view first.

