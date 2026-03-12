# Vanta Signal - Sidecar Spec: Signal Feed

**Date:** 2026-03-11
**Authored By:** Manus (CBO, CDO, CoS, Product Team)
**Status:** Dev-Ready

---

## 1. Executive Framing (CBO / CoS)

**The Why:** The `AUDIT.md` revealed a critical gap: the prototype demonstrates manually triggered orchestration but fails to show the *automatic* signal detection that makes Vanta a true intelligence platform. This new "Sidecar" element, the Signal Feed, closes that gap. It provides a real-time, read-only view into the signal detection pipeline specified in the `vanta-signal-detection-arch.pdf`, making the invisible visible and proving the core thesis.

**The Mandate:** This is not a feature request; it is a strategic necessity. The Signal Feed is the missing piece of the narrative. It will exist as a new, protected page at `/signals`, acting as a sidecar to the primary case study experience. The product team is directed to build and integrate this page as a P0 priority.

## 2. Product Requirements (Product Manager)

The Signal Feed is a new, protected page that displays a reverse-chronological log of all signals captured by the automated detection pipeline. It is a read-only interface that reads data from the Notion Signal Database.

### User Stories:

*   **As a user, I want to see a real-time feed of captured signals so that I can understand the activity of the Vanta intelligence layer.**
*   **As a user, I want to filter the signal feed by type, sender, and priority so that I can quickly find relevant signals.**
*   **As a user, I want to see key details for each signal, including its type, sender, a summary, and the actions taken, so that I can understand the context of each event.**

### Core Features:

1.  **New Route:** A new protected route at `/signals` will be added.
2.  **Navigation Link:** A link to `/signals` will be added to the main navigation drawer (`NavDrawer.tsx`).
3.  **Signal Feed:** The main component of the `/signals` page. It will display a list of signal entries in reverse-chronological order.
4.  **Data Fetching:** The feed will fetch data from the Notion Signal Database on page load. It should poll for new data every 60 seconds.
5.  **Filtering:** The user will be able to filter the feed by `Signal Type`, `Sender`, and `Priority`.
6.  **Signal Entry Card:** Each item in the feed will be a card displaying:
    *   Signal Type Badge (colored)
    *   Sender Name
    *   Signal Summary
    *   Timestamp
    *   Actions Taken
7.  **Empty State:** If no signals have been captured, a message will be displayed: "No signals captured yet. Monitoring active."

## 3. Design Specifications (Chief Design Officer)

The aesthetic of the Signal Feed must be a seamless extension of the existing Vanta prototype design system. Precision and consistency are paramount.

### Layout & Components:

*   **Page Structure:** The `/signals` page will follow the existing page structure, including the `Nav` and `Footer`.
*   **Signal Feed:** A single-column, reverse-chronological list.
*   **Filters:** A simple set of dropdown filters at the top of the page.
*   **Signal Entry Card:** The design should be clean and information-dense, referencing the existing `CaseCard` component for visual language but adapted for this new context.

### Typography & Color:

*   **Fonts:** Continue to use `DM Serif Display` for headings and `Syne` / `DM Mono` for body and metadata, as defined in `tailwind.config.ts`.
*   **Color Palette:** The existing dark theme will be used. New accent colors are introduced for the signal type badges, as specified in the architecture document.

| Signal Type | Color Hex | Tailwind/CSS Variable |
| :--- | :--- | :--- |
| **INTRO** | `#c8fb4b` | `hsl(var(--vanta-accent))` (existing) |
| **INSIGHT** | `#4bf5c8` | `hsl(var(--vanta-accent-teal))` (new) |
| **INVESTMENT**| `#f5c84b` | `hsl(var(--vanta-accent-amber))` (new) |
| **DECISION** | `#c84bf5` | `hsl(var(--vanta-accent-violet))` (new) |
| **CONTEXT** | `rgba(245,244,240,0.3)` | `hsl(var(--vanta-text-low))` (existing) |

*   **Badge Style:** Badges will use `DM Mono`, uppercase, with accent colors for the text and a faint, matching background color (`accent-faint`).

## 4. Technical Implementation Plan (Head of Product Engineering)

This is a net-new feature. No modifications to existing case study components are required.

### File Structure:

1.  **New Page:** `src/pages/Signals.tsx`
2.  **New Components:**
    *   `src/components/SignalFeed.tsx`
    *   `src/components/SignalEntryCard.tsx`
    *   `src/components/SignalFilters.tsx`
3.  **New Data Types:** `src/data/signals.ts` (to define the `Signal` interface based on the Notion schema).

### Implementation Steps:

1.  **Update Routing (`App.tsx`):**
    *   Add a new `ProtectedRoute` for `/signals` pointing to the `Signals` page component.

2.  **Update Navigation (`NavDrawer.tsx`):**
    *   Add a new navigation link in the drawer to `/signals`.

3.  **Create `signals.ts` Data Types:**
    *   Define the `Signal` interface matching the structure of the data that will be fetched from the Notion API.

4.  **Build `Signals.tsx` Page:**
    *   This component will be the main container for the page.
    *   It will handle the data fetching logic using `@tanstack/react-query` to fetch from a mock Notion API endpoint (for now). A `useQuery` hook with a `refetchInterval` of 60000ms will be used.
    *   It will manage the state for the filters.

5.  **Build `SignalFeed.tsx` Component:**
    *   Receives the list of signals and the filter state as props.
    *   Filters the signals based on the current filter settings.
    *   Renders the list of `SignalEntryCard` components or the empty state message.

6.  **Build `SignalEntryCard.tsx` Component:**
    *   Receives a single `Signal` object as a prop.
    *   Renders the signal details, including the colored badge.

7.  **Extend Design System (`tailwind.config.ts` & `index.css`):**
    *   Add the new accent colors (`teal`, `amber`, `violet`) to the `vanta` color palette in the Tailwind config and the root CSS variables.

8.  **Mock Data:**
    *   Create a `src/data/mockSignals.ts` file to provide realistic sample data for UI development until the Notion API integration is live.
