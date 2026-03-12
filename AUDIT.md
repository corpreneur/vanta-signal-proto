# Vanta Signal Proto — Audit Report

**Date:** 2026-03-11
**Audited by:** Manus

## Summary

This audit cross-referenced the live Vanta Signal prototype against the `vanta-lovable-toolkit.pdf` and `vanta-manus-brief.pdf` specifications. The codebase was reviewed to pinpoint the source of each discrepancy. A total of 11 gaps were identified and categorized by severity.

*   **Critical:** 3 findings, 0 resolved
*   **Major:** 4 findings, 0 resolved
*   **Minor:** 4 findings, 0 resolved

## Findings

### [ROUTING] App.tsx — Standalone case pages are not implemented | CRITICAL

*   **File:** `src/App.tsx`
*   **Issue:** The router only defines routes for `/` and `/login`. All three standalone case page routes (`/case-01`, `/case-02`, `/case-03`) are missing. As a result, clicking any "Full Page" link in the UI results in a 404 "Not Found" page.
*   **Fix:** Implement the three missing routes in `App.tsx` and create the corresponding page components (`src/pages/Case01.tsx`, etc.) that render the case content without the cassette drawer UI.
*   **Status:** Pending

### [CONTENT] src/data/cases.ts — Case 01 `cardSignal` label is incorrect | CRITICAL

*   **File:** `src/data/cases.ts`
*   **Issue:** The spec explicitly requires the `cardSignal` label for Case 01 to be "The Trigger". The current data has it as "Signal".
*   **Fix:** Change `cardSignal: { label: "Signal", ... }` to `cardSignal: { label: "The Trigger", ... }` for the first case object in the `cases` array.
*   **Status:** Pending

### [COMPONENT] CassetteDrawer.tsx — `SignalArchitecture` component is missing | CRITICAL

*   **File:** `src/components/CassetteDrawer.tsx`
*   **Issue:** The spec requires a `SignalArchitecture` component to be rendered within Case 01's content, displaying a 3-source grid (iMessage, Email, Calendar) flowing into an orchestration box and then a network intelligence bar. This component does not exist and is not rendered.
*   **Fix:** Create a new component `src/components/case-parts/SignalArchitecture.tsx` that renders the specified visual flow diagram. Update `CassetteDrawer.tsx` to import and render this component when the section type is `signal-architecture`.
*   **Status:** Pending

### [CONTENT] src/data/cases.ts — Case 03 thread is missing two messages | MAJOR

*   **File:** `src/data/cases.ts`
*   **Issue:** The spec requires the Case 03 thread to have 7 entries, starting with two messages from Julian. The current data only has 5 entries and omits Julian's initial context-setting messages.
*   **Fix:** Add the two missing `Message` objects for Julian's texts to the beginning of the `messages` array for Case 03.
*   **Status:** Pending

### [DESIGN] src/index.css — Accent color is incorrect | MAJOR

*   **File:** `src/index.css`
*   **Issue:** The spec requires the accent color to be exactly `#c8fb4b`. The live app and CSS variables use `hsl(79 95% 64%)`, which resolves to `#c8fb4b`, but the brief was explicit about the hex code. This is a minor discrepancy but flagged as Major due to the explicit instruction.
*   **Fix:** While the resolved color is correct, for perfect adherence, change the HSL value to the direct hex code in the theme configuration if possible, or confirm that the HSL value is the intended source of truth.
*   **Status:** Pending

### [INTERACTION] src/components/CaseCard.tsx — Clicking "Full Page" does not open in a new tab | MAJOR

*   **File:** `src/components/CaseCard.tsx`
*   **Issue:** The spec requires that clicking the "Full Page ↗" link on a case card opens the standalone page in a new tab. The current implementation uses a standard `<a>` tag without `target="_blank"`, causing it to navigate in the same tab.
*   **Fix:** Add `target="_blank"` and `rel="noopener noreferrer"` to the `<a>` tag for the "Full Page" link.
*   **Status:** Pending

### [INTERACTION] src/components/NavDrawer.tsx — Clicking case link does not close nav drawer | MAJOR

*   **File:** `src/components/NavDrawer.tsx`
*   **Issue:** The spec requires that clicking a case in the nav drawer should open that case's cassette AND close the nav drawer. The current implementation correctly opens the cassette but leaves the nav drawer open.
*   **Fix:** The `onOpenCase` function is called, but the `onClose` for the nav drawer is not. The `onClick` for the button should call both `onOpenCase(i)` and `onClose()`.
*   **Status:** Pending

### [DESIGN] src/components/CassetteDrawer.tsx — Cassette drawer width is not 540px | MINOR

*   **File:** `src/components/CassetteDrawer.tsx`
*   **Issue:** The spec requires the cassette drawer to have a `max-width` of `540px` on desktop. The current implementation uses `max-w-[520px]`.
*   **Fix:** Change the Tailwind class from `max-w-[520px]` to `max-w-[540px]`.
*   **Status:** Pending

### [COMPONENT] src/components/case-parts/CaseThread.tsx — Vanta trigger bubble style is not different | MINOR

*   **File:** `src/components/case-parts/CaseThread.tsx`
*   **Issue:** The spec requires the Vanta trigger message bubble in Case 01 to be styled differently from a standard `out` bubble. The current implementation applies the same style to both.
*   **Fix:** The code has a conditional for `isVantaTrigger`, but it applies the same styles as a regular `isOut` message. Create and apply a distinct style for the Vanta trigger bubble as defined in the design tokens (`vanta-trigger-bg`, `vanta-trigger-border`).
*   **Status:** Pending

### [INTERACTION] src/pages/Index.tsx — Cassette scroll does not reset to top | MINOR

*   **File:** `src/pages/Index.tsx`
*   **Issue:** The spec requires that the scroll position of the cassette drawer resets to the top whenever a new case is opened. This is not currently implemented.
*   **Fix:** In the `openCase` function, after setting the active case, get a reference to the cassette drawer DOM element and set its `scrollTop` to `0`.
*   **Status:** Pending

### [DESIGN] src/components/case-parts/CaseTags.tsx — Tags have border-radius | MINOR

*   **File:** `src/components/case-parts/CaseTags.tsx`
*   **Issue:** The spec explicitly states zero border-radius on all elements. The tags in the cassette drawer have a slight border-radius.
*   **Fix:** Ensure the `<span>` element for the tags has a `border-radius: 0px` style, overriding any default browser or framework styles.
*   **Status:** Pending
