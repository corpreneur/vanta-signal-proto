# ADR-0002: Design system tokens and component library

## Status

Accepted

## Date

2026-03-30

## Context

AI agents and developers need a single source of truth for visual decisions to prevent style drift, hardcoded colors, and inconsistent spacing across components.

## Decision

All colors defined as HSL CSS variables in index.css, consumed via Tailwind semantic tokens. Typography uses Barlow Condensed (display) and Inter (body). shadcn/ui is the component library. No inline styles, no CSS modules.

## Consequences

- Components use semantic tokens (bg-primary, text-foreground) — never raw hex/HSL values
- Dark mode support via .dark class toggling CSS variables
- New colors must be added to both index.css and tailwind.config.ts
- shadcn/ui components customized via variants, not overridden with raw styles

## Alternatives Considered

- **Chakra UI**: Rejected — heavier bundle, different theming paradigm
- **Styled-components**: Rejected — CSS-in-JS conflicts with Tailwind-first approach
- **Raw Tailwind without tokens**: Rejected — leads to hardcoded values and inconsistency
