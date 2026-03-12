

# Beef Up the Sidebar -- More Visual Weight

The sidebar currently feels thin and sparse: tiny text, minimal padding, no visual anchoring between groups. Here's how to give it more presence.

## Changes (all in `src/components/ProductSidebar.tsx`)

### 1. Increase text sizes and icon sizes
- Nav items: `text-[11px]` → `text-[12px]`, icons `h-3.5 w-3.5` → `h-4 w-4`
- Group labels: `text-[9px]` → `text-[10px]`, chevron `h-3 w-3` → `h-3.5 w-3.5`
- Dashboard icon already `h-4 w-4` -- keep as-is

### 2. Increase vertical padding on nav items
- Items: `py-1.5` → `py-2` for more comfortable tap targets (especially mobile)
- Group triggers: `py-1.5` → `py-2`

### 3. Add separators between groups
- Add a thin `border-b border-vanta-border` divider after Dashboard+Core group and before footer
- Add `py-2` spacing on each `SidebarGroup` for breathing room

### 4. Bolder group labels
- Change group label color from `text-vanta-text-muted` → `text-vanta-text-low` so they read stronger against the dark background
- Increase letter-spacing label weight slightly: `tracking-[0.2em]` → `tracking-[0.15em]` (tighter = denser = heavier feel)

### 5. VANTA wordmark
- Bump from `text-[15px]` → `text-[17px]` and add more header padding `py-4` → `py-5`

These are purely CSS class changes -- no structural or behavioral modifications.

