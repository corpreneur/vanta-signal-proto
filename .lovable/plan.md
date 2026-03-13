

# Dashboard UI/UX Enhancement Plan

Looking at the current dashboard screenshot and code, here are the improvements I'd recommend, organized by impact:

## 1. Add a "Today" Context Row (High Impact)
Merge the best of the Command page into the dashboard -- show today's date, next meeting countdown, and current user mode in a compact bar between the hero and the stats strip. This gives the dashboard temporal awareness without requiring users to navigate to /command.

## 2. Staggered Entry Animations (Medium Impact)
The dashboard currently renders all at once. Wrap each section (hero, stats, channels, signals) in the existing `<Motion>` component with staggered delays for a polished, progressive reveal.

## 3. Improve the Stats Strip
- Make each stat a clickable link (signals count -> /signals, high strength -> /signals?priority=high, actions -> /signals)
- Add subtle micro-sparkline or trend indicator (e.g. "+3 today") using the captured_at timestamps to show daily delta
- Give the "Pipeline Active" indicator more visual weight with a subtle background pill

## 4. Channel Grid Polish
- Add a subtle hover arrow/chevron indicator to reinforce clickability
- Show a "last signal" relative timestamp under each count (e.g. "2h ago") so users can see channel freshness at a glance
- Animate the count numbers on load

## 5. Recent Signals Enhancement
- Make signal rows clickable (open the SignalDetailDrawer or link to /signals with the signal pre-selected)
- Add source channel icon next to each signal for visual scanning
- Show a small colored left-border accent per signal type instead of/in addition to the text badge
- Increase from 5 to 6-8 items

## 6. Add a "Noise Filtered" Summary Line
Below the recent signals section, add a subtle footer line: "X items filtered as noise · Review queue" linking to /noise-queue. This surfaces the noise management feature and builds confidence that the system is working.

## 7. Add Greeting / Time-of-Day Awareness
Replace the static "Vanta Command" heading with a contextual greeting: "Good morning" / "Good afternoon" / "Good evening" based on local time, with the date below.

## Technical Approach

**Files to modify:**
- `src/pages/Index.tsx` -- all UI changes above
- No new components needed; uses existing `Motion`, `Link`, channel/signal data

**Data changes:** None. All enhancements use existing `signals` query data plus `Date.now()` for time-of-day logic.

**No database or migration changes required.**

