

# Fix: Crash at Zoom Demo Step 4 Completion

## Problem

The app crashes with "undefined is not an object (evaluating 'N.type')" when the demo transitions to the complete phase and `PostSessionSummary` renders. This Safari-specific error means React encountered an undefined value where it expected a component or element.

## Root Cause Analysis

Two potential issues in `PostSessionSummary.tsx`:

1. **`MetaItem` defined after the default export** — while valid JS, some bundler optimizations or Safari JIT behavior may not resolve the forward reference correctly when the component first mounts.

2. **Plain `<a>` tags instead of React Router `<Link>`** — `href="/meetings"` and `href="/product/zoom-sdk"` cause full page reloads rather than SPA navigation, though this isn't the crash cause.

## Fix Plan

### `src/components/zoom-demo/PostSessionSummary.tsx`

1. **Move `MetaItem` above the default export** — define it before `PostSessionSummary` so there is no forward reference.
2. **Replace `<a>` tags with `<Link>` from react-router-dom** — prevents full page reloads and keeps SPA routing intact.
3. **Add defensive optional chaining** on `SIGNAL_COLORS[t]` lookups (already done, just verify).

### `src/pages/ZoomDemo.tsx`

4. **Add a safety guard** around the complete phase render — wrap `PostSessionSummary` in a null check or key to force clean mount:
   ```tsx
   {phase === "complete" && (
     <PostSessionSummary key="post-session" onReset={resetDemo} />
   )}
   ```

These are small, targeted changes — no new files, no DB changes.

