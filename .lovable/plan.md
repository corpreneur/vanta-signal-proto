

## Plan: Add compact attendee summary strip to Zoom demo

### What we'll build

A horizontal strip below the page header showing the meeting participants — names, roles, and a subtle signal count badge. Matches the existing "inline stat strip" pattern used on the dashboard.

### Location

Insert between the `<header>` block (line 436) and Step 1 (line 438) in `src/pages/ZoomDemo.tsx`.

### Design

```text
┌──────────────────────────────────────────────────────────┐
│ 👤 ATTENDEES                                              │
│ ┌─────────────┐ ┌──────────────────┐ ┌────────────────┐  │
│ │ WT · You    │ │ SC · Sarah Chen  │ │ MR · Marcus R. │  │
│ │ Host        │ │ GP · Acme VC  ⚡2│ │ MD · Portfolio │  │
│ └─────────────┘ └──────────────────┘ └────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- Compact horizontal row of attendee chips with initials, name, title/company
- Signal count badges appear after signals are detected (phase `detecting` or `complete`)
- Uses existing monochrome + border styling, no new colors
- Fully inline in the same file — no new components

### Data

Define a const array with participant metadata (name, initials, role, company) reusing existing `BASE_PARTICIPANTS` names. Render inline as a `flex flex-wrap gap-2` row of bordered chips.

### File changed

| File | Change |
|------|--------|
| `src/pages/ZoomDemo.tsx` | Add `ATTENDEE_META` const + render attendee strip between header and Step 1 |

