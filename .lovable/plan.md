

# Active State Left-Border Indicator

Add a 2px lime left border on the active nav item across all sidebar navigation groups.

## Approach

Update `activeClassName` strings throughout `ProductSidebar.tsx` to include `border-l-2 border-vanta-accent`. This applies to:

1. **Dashboard item** -- already uses `activeClassName="text-vanta-accent bg-vanta-accent-faint"` → add `border-l-2 border-vanta-accent`
2. **Core items** (Signal Feed, Relationship Graph) -- `activeClassName="text-foreground bg-vanta-bg-elevated"` → add `border-l-2 border-vanta-accent`
3. **CollapsibleNavGroup default** -- default `activeClassName` param → add `border-l-2 border-vanta-accent`
4. **Cases section** -- same pattern → add `border-l-2 border-vanta-accent`

All nav items already have `border-l-2 border-transparent` added to their base `className` so the layout doesn't shift on activation.

Single file change: `src/components/ProductSidebar.tsx`.

