

# Brain Dump Interface

A new page at `/brain-dump` where users paste or type unstructured thoughts. On submit, the text is sent to a new edge function that classifies it through the same AI pipeline used for Linq webhooks, then inserts the resulting signal into the `signals` table with `source = 'manual'`.

## Components

### 1. Edge Function: `supabase/functions/brain-dump/index.ts`
- Accepts `{ text: string }` POST body
- Reuses the same classification prompt as `linq-webhook` (signal type, priority, summary, actions)
- Inserts into `signals` table with `source = 'manual'`, `sender = 'Brain Dump'`
- Returns the classified signal back to the client

### 2. Page: `src/pages/BrainDump.tsx`
- Large textarea with placeholder guidance ("Paste a voice memo transcript, jot meeting notes, dump a thought...")
- Submit button that calls the edge function via `supabase.functions.invoke('brain-dump', ...)`
- Loading state while classifying
- On success: toast with signal type + summary, option to view in Signal Feed
- Matches existing Vanta design system (vanta-bg, mono type, accent colors)

### 3. Routing & Navigation
- Add `/brain-dump` route in `App.tsx` inside `ProtectedRoute` + `ProductLayout`
- Add nav item to `ProductSidebar.tsx` in the core items section (icon: `PenLine` from lucide)
- Add to `BREADCRUMB_MAP` in `ProductLayout.tsx`

## Data Flow

```text
User types text → POST /brain-dump edge fn
  → Lovable AI classifies (gemini-2.5-flash)
  → INSERT into signals table (source='manual')
  → Return classification to client
  → Toast + optional redirect to /signals
```

## Files Changed
- **New**: `supabase/functions/brain-dump/index.ts`
- **New**: `src/pages/BrainDump.tsx`
- **Edit**: `src/App.tsx` — add route
- **Edit**: `src/components/ProductSidebar.tsx` — add nav item
- **Edit**: `src/components/ProductLayout.tsx` — add breadcrumb

