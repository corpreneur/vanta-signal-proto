

# Brand-Forward Login and Dashboard Copy Update

## What Changes

### 1. Cinematic Login Page
Replace the current utilitarian login with a brand-forward entry point inspired by the consumer app screens:

- **Full-bleed dark background** with a large geometric circle element (oversized white/light circle at ~60% opacity, positioned off-center) as a bold design statement
- **Large VANTA wordmark** centered, scaled up from 42px to ~64px
- **Brand tagline** below the wordmark: "Less noise, more progress" in mono uppercase
- Keep the existing username/password form but push it lower, making the brand moment dominant
- Footer: "Proprietary · Confidential" remains
- Subtle entrance animation: circle scales in, wordmark fades up, form slides up with stagger

### 2. Dashboard Hero Copy
Replace the generic copy in Index.tsx hero section:

- **Headline**: "Vanta Command" stays (it works)
- **Subhead**: Replace "Real-time signal intelligence across every channel. Every conversation is a data point. Nothing is lost." with brand copy: "So you can focus, decide, and move."
- **Eyebrow**: Keep "Connectivity OS · Dashboard"

### 3. Bold Geometric Element on Dashboard
Add a subtle oversized circle or arc element behind the hero section as a background motif, echoing the login geometric language. Light opacity, non-intrusive.

## Files to Edit

| File | Change |
|---|---|
| `src/pages/Login.tsx` | Redesign layout: add geometric circle, scale up wordmark, add tagline, reposition form lower, add staggered animations |
| `src/pages/Index.tsx` | Update hero subhead copy, add subtle geometric background element |
| `src/index.css` | Add keyframes for staggered fade-up animations (if needed beyond existing `fadeUp`) |

## Technical Details

- The geometric circle is pure CSS (`w-[400px] h-[400px] rounded-full border border-white/10`) — no image generation needed
- Login form logic (hardcoded credentials, sessionStorage) remains unchanged
- Animations use existing `animate-fade-up` plus a new staggered delay variant via inline `animation-delay` styles
- Mobile responsive: circle scales down on smaller viewports, form remains full-width at max-w-[360px]

