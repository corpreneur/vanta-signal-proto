

# Tech Architecture Page -- Hybrid Style

A single long-scroll page at `/architecture` with a sticky left-side section nav (desktop) and collapsible anchored sections. Vanta dark aesthetic throughout, but with developer-docs structure: endpoint tables, code blocks, flow diagrams, and typed interfaces.

---

## Page Structure

```text
┌─────────────────────────────────────────────┐
│  TECH ARCHITECTURE                          │
│  System-level documentation                 │
├──────┬──────────────────────────────────────┤
│ TOC  │  § System Overview (flow diagram)    │
│      │  § Linq API (webhook, auto-reply)    │
│      │  § Gmail Integration (OAuth, poll)   │
│      │  § Zoom / Recall.ai (meeting capture)│
│      │  § Phone FMC (CDR, SIP, ConnectX)    │
│      │  § Gemini AI Pipeline (classify)     │
│      │  § Database Schema (signals table)   │
│      │  § Edge Functions Reference          │
└──────┴──────────────────────────────────────┘
```

**On mobile** (current viewport): TOC becomes a horizontal scroll of pill anchors at the top, content stacks vertically.

---

## Sections Detail

### 1. System Overview
- A vertical flow diagram (reusing the `SignalArchitecture` pattern) showing:
  `Channels -> Edge Functions -> Gemini AI -> Supabase DB -> Dashboard`

### 2. Linq API
- **Endpoint table**: webhook URL, method, headers (`x-webhook-signature`, `x-webhook-timestamp`)
- **Payload schema**: `ParsedMessage` interface rendered as a styled type block
- **Flow**: Receive -> Verify HMAC -> Parse -> Classify -> Insert -> Auto-Reply (conditional)
- **Auto-reply rules** table: trigger conditions, template logic

### 3. Gmail Integration
- **Auth flow**: OAuth2 refresh token -> access token
- **Polling mechanism**: Edge function invocation
- **Email parsing**: `EmailMessage` interface
- **Deduplication**: thread-based

### 4. Zoom / Recall.ai
- **Integration pattern**: Bot joins meeting -> `transcript.ready` webhook
- **Payload**: `TranscriptTurn[]` interface, attendees, meeting title
- **Artifacts stored**: transcript JSON, summary, recording URL
- **Tables**: `signals` + `meeting_artifacts`

### 5. Phone FMC
- **Infrastructure**: MVNO -> ConnectX -> SIP interception
- **CDR webhook**: caller, callee, duration, transcript
- **Phone-specific tags**: commitment, decision, open_question, relationship_signal, deal_signal
- **Classification**: `PhoneClassification` interface

### 6. Gemini AI Pipeline
- **Gateway**: Lovable AI Gateway (`ai.gateway.lovable.dev`)
- **Model**: `google/gemini-2.5-flash`
- **Shared pattern**: System prompt -> JSON response -> typed Classification
- **Per-channel prompt differences** shown in a comparison table

### 7. Database Schema
- `signals` table columns and types
- `meeting_artifacts` table
- Signal source enum, signal type enum

### 8. Edge Functions Reference
- Table of all 5 functions: name, trigger, source, description

---

## Implementation

### New files
- `src/pages/Architecture.tsx` -- the page component (~400 lines)
- Sections as inline components or extracted into `src/components/arch/` if any exceed 100 lines

### Modified files
- `src/App.tsx` -- add route `/architecture`
- `src/components/ProductSidebar.tsx` -- add "Architecture" nav item under Platform group (using `Code2` or `FileCode` icon)
- `src/components/ProductLayout.tsx` -- add breadcrumb mapping

### Styling approach
- Reuse existing Vanta tokens: `bg-vanta-bg`, `border-vanta-border`, `text-vanta-text-mid`, `font-mono`
- Code blocks: `bg-vanta-bg-elevated border border-vanta-border rounded-md p-4 font-mono text-[11px]`
- Endpoint tables: `<Table>` component with monospaced cells
- Section headers: `font-mono text-[9px] uppercase tracking-[0.2em]` (matching Ontology/PhoneFMC pattern)
- TOC: sticky `top-20` on desktop, horizontal scroll pills on mobile

