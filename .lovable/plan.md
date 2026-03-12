

# Color Refinement: Fewer Colors, Grouped

## Current Problem
The sidebar uses 6+ distinct accent colors (lime, teal, amber, violet, zoom-blue, phone-pink) across icons, creating a rainbow effect that feels noisy.

## Proposed Approach: 3-Tone System

| Tone | Usage | Color |
|------|-------|-------|
| **Lime accent** | Active item icon + text, Dashboard | `text-vanta-accent` |
| **Secondary muted** | Channel icons (all same tone) | `text-vanta-text-mid` |
| **Default low** | Platform, Product Concepts, Cases icons | `text-vanta-text-low` |

### Changes

**`src/components/ProductSidebar.tsx`**
- Remove individual `color` properties from `channelItems` and `productItems`
- All inactive icons use `text-vanta-text-low` (same as label text)
- Active item icons shift to `text-vanta-accent` via the existing `activeClassName`
- Channel icons get a slightly brighter `text-vanta-text-mid` to distinguish them as a group from platform/product items

**`src/index.css`** and **`tailwind.config.ts`**
- Keep all accent color CSS variables (they're still used in signal cards, pages, charts)
- No removals needed -- the colors just stop being used in the sidebar

### Result
- Sidebar becomes visually quieter with a monochrome hierarchy
- Active state pops clearly with lime
- Channel group is subtly differentiated from other groups
- Page content retains its full color palette for signals, cards, and charts

