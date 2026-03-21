

# Embeddable Feedback Widget

## What We're Building
A standalone, lightweight feedback submission widget that can be embedded into any external site via a `<script>` tag or iframe. It exposes the core submission flow from the `/feedback` page (author, subject, narrative, screenshots, ChatGPT links) without requiring the host site to run React or know about the Vanta Signal stack.

## Architecture

```text
External Site                         Vanta Signal Backend
┌──────────────────┐                 ┌─────────────────────┐
│  <script> tag    │  ── POST ──▶   │  feedback-widget     │
│  or <iframe>     │                 │  (edge function)     │
│                  │                 │     ↓                │
│  Shadow DOM      │  ◀── JSON ──   │  feedback_entries    │
│  widget UI       │                 │  table insert        │
└──────────────────┘                 └─────────────────────┘
```

## Steps

### 1. Create the edge function `feedback-widget`
- A new Supabase edge function that accepts POST requests with feedback data (author, subject, narrative, links, screenshot URLs)
- Inserts into `feedback_entries` table using service role (no auth required for external submitters)
- CORS headers allowing any origin
- Optional: triggers the existing scrape + AI analysis pipeline inline or flags for next cron run
- Returns `{ ok: true, id }` on success

### 2. Build the embeddable widget as a standalone HTML/JS bundle
- Create `public/feedback-widget.js` — a self-contained vanilla JS file (~8KB) that:
  - Injects a floating feedback button (bottom-right corner)
  - On click, opens a modal form inside a Shadow DOM (style-isolated from host page)
  - Form fields: author name (free text), subject dropdown, narrative textarea, ChatGPT link input, screenshot file upload
  - On submit, POSTs to the `feedback-widget` edge function endpoint
  - Shows success/error state, then auto-closes
- No React dependency — pure DOM manipulation for maximum portability
- Configurable via `data-*` attributes on the script tag (e.g., `data-project`, `data-theme="dark"`)

### 3. Create an embed instructions page at `/feedback/embed`
- A simple page in the app showing:
  - The `<script>` snippet to copy
  - An iframe alternative embed code
  - Live preview of the widget
  - Configuration options (theme, default author, allowed subjects)

### 4. Update release notes
- Add widget entry to `releaseNotes.ts`

## Embed Usage (what external sites will paste)

```html
<script
  src="https://vantasignal.lovable.app/feedback-widget.js"
  data-endpoint="https://fwmrhpayssaiuhqzzeig.supabase.co/functions/v1/feedback-widget"
  data-theme="dark"
  defer
></script>
```

## Security Considerations
- The edge function validates input shape and sanitizes text
- Rate limiting via a simple in-memory counter (10 submissions per IP per hour)
- No auth token exposed in the widget — the edge function uses service role internally
- CORS restricted to configurable allowed origins (default: `*` for development)

