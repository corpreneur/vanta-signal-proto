

# Subtle Tints Only -- Dashboard Channel Grid

Tone down the channel grid on the Index page so icons keep faint color hints but labels, counts, and borders go monochrome.

## Changes (all in `src/pages/Index.tsx`)

### CHANNELS array
- Keep each channel's `color` for the icon only
- Replace label/count text colors with `text-vanta-text-low` / `text-foreground`
- Replace `bg` hover with a single `bg-vanta-bg-elevated`
- Remove per-channel `border` usage

### Channel grid render
- Icon: keep `ch.color` but add opacity (`opacity-60`) so tints are subtle
- Label: switch from `ch.color` to `text-vanta-text-low`
- Count: keep `text-foreground` (already monochrome)
- "signals" subtext: keep `text-vanta-text-muted`
- Hover state: uniform `hover:bg-vanta-bg-elevated`

### Signal type badges (recent signals list)
- Keep `SIGNAL_TYPE_COLORS` as-is -- those are already small, subtle badges

Net result: icons retain identity through faint color, everything else is monochrome. Unified feel.

