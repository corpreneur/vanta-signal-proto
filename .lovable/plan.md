

# Making Capture Magical

The CMO's insight is clear: capture isn't about "creating a thought." It's a **magic food processor** — you throw in whatever fragment is on your mind (a name, a screenshot, a half-baked idea, something you overheard) and it processes it into structured signal. The current implementation has the right plumbing but the experience doesn't feel magical yet. Here's how to close that gap.

## What's Missing Today

The current capture flow is functional but mechanical:
- Text box → hit enter → toast notification → done
- The "processing" moment is invisible (just a spinner)
- Results appear as flat classification cards
- No sense of transformation happening
- The FAB orb is beautiful but the sheet it opens is utilitarian
- Multiple input modes exist but feel like separate tools, not one processor

## The Concept: One Slot, Any Input

Think of it like dropping something into a funnel. You don't pick "note mode" or "image mode" first — you just throw something in. The processor figures out what it is and what to do with it.

### 1. Unified Capture Bar (Replace InlineBrainDump)

Instead of a plain text input, build a **multi-modal capture strip** that accepts text, paste (images from clipboard), and drag-drop — all in one component. No mode tabs needed for the inline version.

- Text input as default, but if you paste an image it instantly shows a thumbnail
- If you paste a URL it auto-detects and shows a link preview chip
- Mic button on the right for voice-to-text (already have speech recognition hook)
- Single "Process" action regardless of input type

### 2. The Processing Moment (The Magic)

This is where the magic lives. When you hit capture:

- The input bar **collapses smoothly** into a compact "processing" state
- A **shimmer animation** ripples across a card that morphs from raw → structured
- Text appears to be "typed out" by the AI (letter-by-letter reveal of the summary)
- Signal type badge **fades in** with a subtle color wash
- Suggested actions **cascade in** one by one (staggered 150ms)
- The whole thing takes ~2 seconds of choreographed animation even if the AI responds faster (buffer the reveal)

### 3. Result Card: "Before → After" Split

When processing completes, show a compact **transformation card**:

```text
┌─────────────────────────────────────┐
│ ◇ What you captured                 │
│ "ran into james at the thing last   │
│  night, he's raising a series B,    │
│  should connect him w/ sarah"       │
│                                     │
│ ─ ─ ─ processed into ─ ─ ─         │
│                                     │
│ ● Introduction Signal     high      │
│   James — Series B raise,           │
│   connect with Sarah                │
│                                     │
│ → Send intro email to Sarah         │
│ → Set reminder: follow up w/ James  │
│ → Link to existing: Sarah Chen      │
└─────────────────────────────────────┘
```

### 4. SmartNoteFAB Sheet Simplification

Replace the 5-tab sheet with a **single unified capture surface**:
- Large text area that also accepts paste/drop
- Small icon row below for explicit mode switches (camera, mic, link) — but positioned as "input helpers" not "modes"
- Remove "Granola" and "Email" as primary tabs — fold them into the capture page only

### 5. Micro-copy That Sells the Magic

Update all capture-related copy to reinforce the processor metaphor:
- Placeholder: "Drop anything here… a name, a screenshot, a fragment of an idea"
- Processing state: "Processing…"  
- Result header: "Processed into signal"
- Toast: "Signal detected · Introduction" (not "Captured as INTRO")
- Empty state: "Nothing in the processor yet"

## Implementation Plan

### Step 1: Build unified capture input component
Create `UnifiedCaptureInput.tsx` — a single input that handles text, pasted images, pasted URLs, and voice toggle. No mode tabs. Detects input type automatically.

### Step 2: Build animated processing reveal
Create `CaptureProcessingReveal.tsx` — the choreographed animation sequence that transforms raw input into structured signal card with typewriter summary, cascading actions, and color wash.

### Step 3: Redesign InlineBrainDump
Replace current plain input with `UnifiedCaptureInput` + `CaptureProcessingReveal`. The inline bar on Focus/Signals pages becomes the magic food processor.

### Step 4: Simplify SmartNoteFAB sheet  
Remove mode tabs. Use `UnifiedCaptureInput` as the single capture surface. Keep small icon helpers (camera, mic) as secondary affordances below the input.

### Step 5: Update all capture micro-copy
Placeholder text, toast messages, result labels, empty states — all updated to "processor" language per section 5 above.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/UnifiedCaptureInput.tsx` | **Create** — multi-modal input (text + paste image + paste URL + voice) |
| `src/components/CaptureProcessingReveal.tsx` | **Create** — animated before/after transformation card |
| `src/components/InlineBrainDump.tsx` | **Rewrite** — use UnifiedCaptureInput + ProcessingReveal |
| `src/components/SmartNoteFAB.tsx` | **Simplify** — remove mode tabs, unified surface |
| `src/pages/BrainDump.tsx` | **Update** — integrate new components, update copy |
| `src/index.css` | **Add** — shimmer/typewriter animation keyframes |

No database changes required. All existing edge functions (brain-dump, brain-dump-image) continue to work as-is.

