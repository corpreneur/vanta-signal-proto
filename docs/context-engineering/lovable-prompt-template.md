# Lovable Implementation Prompt Template

> Source: `product-engineer/templates/lovable_prompt.md`
> Use this template for every feature implementation in Lovable.

---

## Context Engineering Pre-Flight

Complete this section before writing the implementation prompt. Do not skip.

### RPI Gate

#### Research (complete before planning)
- What files are directly involved in this feature? List paths.
- What existing components, hooks, or utilities should this feature follow or extend?
- What data model changes are required? Reference table names and column names explicitly.
- What auth, RLS, or API contract constraints apply?

#### Plan (complete before implementing)
- List every change required, in order, with file path and component name.
- Flag any ambiguity or decision that must be resolved before implementation begins.
- Confirm the plan is complete. Do not proceed until confirmed.

### Context Budget
- **Estimated tokens in this prompt:** [fill before submitting]
- **Context window target:** stay below 40% fill. If over, compact prior conversation to a summary block before submitting.
- If this is not the first session on this feature: paste a SESSION_SUMMARY.md block below instead of raw prior conversation.

### SESSION_SUMMARY (paste here if continuing a prior session)
- Last session: [date]
- What was built: [1-2 sentences]
- Current state: [what works, what is broken, what is next]

---

## Prompt Body

### Context
[1–2 sentences describing the feature and why it matters. Reference the business context so Lovable understands the intent, not just the mechanics.]

### Design System

| Token | Value | Notes |
|---|---|---|
| Background | `var(--background)` | Use semantic tokens |
| Text Primary | `var(--foreground)` | Never hardcode hex |
| Text Secondary | `var(--muted-foreground)` | |
| Accent | `var(--primary)` | |
| Accent Hover | `var(--primary-foreground)` | |
| Success | `var(--success)` | Add to index.css if needed |
| Error | `var(--destructive)` | |
| Border | `var(--border)` | |
| Font Display | Barlow Condensed | 900 weight, uppercase |
| Font Body | Inter | 400-500 weight |
| Radius | `var(--radius)` | |

> **Note:** Always use the project's semantic tokens from `index.css` and `tailwind.config.ts`. The table above is a template — fill with actual token names from the project.

### Data Model

```typescript
// Describe interfaces or Supabase table changes
interface Example {
  id: string;
  // fields
  created_at: string;
  updated_at: string;
}
```

### Supabase Changes
- Tables to create/modify: [list]
- RLS policies required: [list]
- Edge functions needed: [list]

---

## Implementation

### What to Build
[Describe the feature in implementation terms. Be specific about components, pages, and behavior.]

### Component Structure
```
[ComponentName]/
  index.tsx          -- Main component
  [SubComponent].tsx -- Child components
```

### Behavior
[Describe the user flow step by step:]
1. User does X
2. System responds with Y
3. Data is saved to Z
4. UI updates to show W

### States

| State | Condition | UI |
|---|---|---|
| Default | | |
| Loading | | |
| Empty | | |
| Populated | | |
| Error | | |

---

## Acceptance Criteria

- [ ] AC-1: Specific, testable criterion
- [ ] AC-2: Specific, testable criterion
- [ ] AC-3: Specific, testable criterion

## Edge Cases

- EC-1: What happens when…
- EC-2: What happens when…

## Assets

| Asset | CDN URL | Usage |
|---|---|---|
| [Name] | [URL] | [Where it appears] |

---

## Do NOT

- Do not explore files or patterns outside the scope defined in the RPI Gate above.
- Do not refactor existing components unless explicitly listed in the Plan.
- Do not add libraries, dependencies, or abstractions not specified here.
- Do not continue if context window exceeds 40% fill — compact and restart the session.

[Additional anti-patterns or common mistakes specific to this feature]
