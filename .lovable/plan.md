

# Smart Note with Accelerators — Final Plan

## Concept

After a user saves a note, VANTA returns a rich, editable result card with two distinct layers:

1. **Quick Actions** (static toolbar): Tag, Share, Save, Edit
2. **Accelerators** (AI-driven): Contextual actions inferred from the note's actual content — not generic suggestions, but parsed intents

### Accelerator Intelligence

The AI should parse the note for **specific actionable intents** and surface them as discrete, tappable actions.

Example input: *"send invoice for shoot and follow up on commercial shoot payment"*

Accelerators returned:
- Send invoice
- Send follow-up email

Example input: *"VANTA feature idea — smart note that organizes thoughts"*

Accelerators returned:
- Create a one-pager
- Send thought to JG / William
- Schedule reminder to revisit
- Surface associated files

The key distinction: accelerators are **extracted from meaning**, not templated.

## Result Card Layout

```text
┌─────────────────────────────────────┐
│ DECISION · HIGH                     │
│                                     │
│ Title: [editable inline field]      │
│                                     │
│ Tags:  ×Invoice  ×Payment  [+ add]  │
│ Add:   +JG  +William               │
│                                     │
│ ── Quick Actions ──                 │
│  [Tag]  [Share]  [Save]  [Edit]     │
│                                     │
│ ── VANTA Suggests ──                │
│  ▸ Send invoice                     │
│  ▸ Send follow-up email             │
│  ▸ Set reminder for next week       │
│                                     │
│ [+ New note]                        │
└─────────────────────────────────────┘
```

## Changes

### 1. Edge Function — `supabase/functions/brain-dump/index.ts`

**Tool schema** — add 4 new fields to `classify_signal`:

| Field | Type | Purpose |
|---|---|---|
| `suggestedTitle` | string | AI-generated note title |
| `suggestedTags` | string[] | Topic/keyword tags from content |
| `suggestedContacts` | string[] | People mentioned or relevant |
| `accelerators` | string[] | Parsed actionable intents from the note |

**System prompt update** — instruct the model to:
- Extract **specific actions** the user intends to take (send, follow up, schedule, create, etc.)
- Surface each as a concise, tappable accelerator phrase
- Also suggest contextual actions (reminders, file associations) when relevant
- Generate topic tags and identify mentioned people by name or initial

### 2. Frontend — `src/components/NoteCapture.tsx`

**New state fields:**
- `editableTitle` (string) — inline editable input, pre-filled by AI
- `editableTags` (string[]) — removable chips (×), plus inline add input
- `editableContacts` (string[]) — +Name chips to confirm/dismiss
- `newTagInput` (string) — controls the add-tag text field

**Result card redesign:**
- Classification badge row (signal type + priority)
- Editable title input
- Tags section: flex-wrap chips with × dismiss + `[+ add]` inline input
- Contacts section: +Name chips
- Quick Actions row: Tag, Share, Save, Edit (existing icons, repositioned)
- VANTA Suggests section: renders `accelerators` as contextual action buttons with a subtle label
- `+ New note` reset button at bottom
- All touch targets min 36px, flex-wrap for 393px viewport

### Files Modified

| File | Change |
|---|---|
| `supabase/functions/brain-dump/index.ts` | Add 4 fields to tool schema + rewrite system prompt for intent-based accelerator extraction |
| `src/components/NoteCapture.tsx` | Full result card redesign with editable title, tags, contacts, quick actions row, and accelerators section |

No database migration needed — new fields are transient in the AI response.

