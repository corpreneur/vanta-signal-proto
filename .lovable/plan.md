

# H1 2026 Feature Backlog — Implementation Plan

This plan maps all 13 backlog items across the three phases to concrete implementation work, noting what already exists and what needs to be built.

---

## Current State Assessment

| Backlog Item | Status |
|---|---|
| E3.1 Relationship Strength Scoring | **Partially built** — v1 exists in `contactStrength.ts` with freq/recency/priority. v2 needs response-time and sentiment factors. |
| E3.2 "Cooling" Alerts | **Partially built** — strength labels exist, but no proactive alert system. |
| E2.1 Pre-Meeting Briefings v2 | **Partially built** — v1 exists with attendee matching. v2 needs 24h trigger, attendee bios, richer context. |
| E5.2 Classification Confidence | **Not built** — AI pipeline exists but doesn't return confidence scores. |
| All others | **Not built** |

---

## Phase 1: Foundations and Core Integrations (Items: E1.1, E1.3, E5.2)

### E5.2 — Classification Confidence Scores (S, P3)

Smallest item, no external dependencies.

- **Database**: Add `confidence_score` (float, nullable, default null) column to `signals` table
- **Edge functions**: Update `brain-dump`, `linq-webhook`, `recall-webhook`, `gmail-poll`, `phone-call-webhook` AI classification prompts to return a `confidence` field (0.0-1.0)
- **Frontend**: Show confidence badge on `SignalEntryCard` and `SignalDetailDrawer` — e.g., "95% confident" chip next to the signal type tag, color-coded (green >0.85, amber >0.6, red below)

### E1.1 — Two-Way Calendar Sync (L, P1)

This requires Google OAuth which cannot be fully implemented in Lovable (no server-side OAuth token exchange). We can build the **UI and data layer** and stub the integration.

- **Database**: Create `calendar_connections` table (id, user_id, provider, access_token_encrypted, refresh_token_encrypted, connected_at, status)
- **Settings UI**: Add "Connect Google Calendar" button in Settings > Connected Sources with OAuth redirect flow placeholder
- **Edge function**: `google-calendar-sync` — stub that accepts calendar webhook events and creates MEETING signals; stub that creates calendar events from signal actions
- **Frontend**: Add "Schedule Meeting" action in `SignalDetailDrawer` that calls the edge function with signal context
- **Note**: Full OAuth token exchange requires a Google Cloud project. We build the complete flow minus the actual Google credentials.

### E1.3 — Task Management Integration / Asana (M, P2)

Same OAuth constraint applies. Build UI + data layer.

- **Database**: Create `task_integrations` table (id, user_id, provider, access_token_encrypted, workspace_id, connected_at)
- **Settings UI**: Add "Connect Asana" option in Connected Sources
- **Edge function**: `create-external-task` — accepts signal ID + target provider, creates task via Asana API
- **Frontend**: Add "Create Asana Task" action button in `SignalDetailDrawer` for all signal types (alongside existing type-specific actions)

---

## Phase 2: Building on Foundation (Items: E2.1, E3.1, E2.2, E5.1, E3.2)

### E3.1 — Relationship Strength Scoring v2 (M, P2)

Enhance the existing `computeStrength` in `contactStrength.ts`.

- Add **response time** factor: measure average time between a contact's signal and the next action taken on it (from `actions_taken` timestamps). Contributes up to 15 points.
- Add **sentiment** factor: use the existing AI classification to infer sentiment from signal types (INTRO = positive, DECISION = neutral, NOISE = negative). Contributes up to 10 points.
- Rebalance weights: frequency 30, recency 25, priority 15, response time 15, sentiment 10, interaction diversity 5
- Update `ContactTimeline` header and `Contacts` page to show the v2 breakdown as a small stacked bar or tooltip

### E2.1 — Pre-Meeting Briefings v2 (L, P1)

Enhance the existing briefing system.

- **Edge function**: Update `daily-digest` or create `briefing-scheduler` that runs on a cron, checks `upcoming_meetings` for meetings 24h out, generates briefs with richer context
- **AI prompt enhancement**: Include attendee role inference (from signal history patterns), relationship strength score, key talking points derived from recent high-priority signals
- **Frontend**: Enhance `Briefing.tsx` to show attendee relationship strength bars, "Why this matters" section, and recent signal timeline per attendee
- **Notification**: Leverage existing iMessage delivery via Linq for 24h-ahead alerts

### E2.2 — "Why Am I Talking To This Person?" Brief (M, P2)

- **Edge function**: `relationship-brief` — accepts a contact name, fetches all their signals, calls AI to generate a narrative summary of the relationship (how you met, key topics, recent context, why they matter)
- **Frontend**: Add a "Why?" button on `ContactTimeline` header and in `SignalDetailDrawer` contact chip. Opens a modal/drawer with the AI-generated narrative.
- **Database**: Cache generated briefs in a new `relationship_briefs` table (id, contact_name, brief_text, generated_at) to avoid re-generating

### E5.1 — Explainable AI / XAI (M, P3)

- **AI prompt update**: All classification prompts return a `reasoning` field explaining why the signal was classified this way
- **Database**: Add `classification_reasoning` (text, nullable) column to `signals`
- **Frontend**: Show reasoning in `SignalDetailDrawer` as a collapsible "Why this classification?" section below the signal type badge

### E3.2 — "Cooling" Relationship Alerts (M, P3)

- **Edge function**: `cooling-alerts` — cron job that runs daily, computes strength for all contacts, identifies those that dropped below 25 (Cold) in the last 7 days, creates a system notification
- **Database**: Create `relationship_alerts` table (id, contact_name, alert_type, previous_strength, current_strength, created_at, dismissed)
- **Frontend**: Show cooling alerts as a special card type in the Signal Feed (or Morning Context section on the dashboard) with a "Reach Out" action

---

## Phase 3: Advanced Workflows and Future-Facing (Items: E1.2, E4.1, E6.1, E4.2, E6.2)

### E4.1 — Network Graph Visualization v2 (L, P2)

Enhance the existing `RelationshipGraph.tsx`.

- Replace the static orbital layout with an interactive force-directed graph (using d3-force or a lightweight canvas library)
- Add **edges between contacts** who appear in the same signals (co-mentioned, same meeting attendees)
- Add cluster detection: group contacts by shared signal types or tags
- Add zoom, pan, and click-to-focus interactions
- Show mini contact card on hover with strength score and last interaction

### E6.1 — Signal Correction Feedback Loop (L, P3)

- **Database**: Create `signal_corrections` table (id, signal_id, original_type, corrected_type, original_priority, corrected_priority, corrected_at)
- **Frontend**: In `SignalDetailDrawer`, make the signal type and priority editable. When changed, record the correction.
- **Edge function**: `apply-corrections` — periodically aggregates corrections and generates a "user preference profile" stored in `system_settings`, which is injected into future AI classification prompts as few-shot examples

### E1.2 — Smart Actions v2: Workflow Builder (XL, P1)

The largest item. Build a simple rule-based workflow engine.

- **Database**: Create `workflows` table (id, user_id, name, trigger_config JSON, action_steps JSON, enabled, created_at)
- **Settings UI**: New "Workflows" tab in Settings with list view and a visual workflow builder
- **Trigger types**: "Signal from contact...", "Signal type is...", "Priority is...", "New meeting with..."
- **Action types**: "Create reminder", "Create calendar hold", "Send notification", "Pin signal", "Auto-reply"
- **Edge function**: `workflow-engine` — triggered by signal insertion (via database trigger/webhook), evaluates all active workflows against the new signal, executes matching actions
- **Frontend**: Step-by-step builder with trigger selector, condition editor, and action chain. Each step is a card with dropdowns.

### E4.2 — Intro Helper (L, P3)

- **Frontend**: New "Find Connection" button on the Network Graph. User enters a target person's name; system searches for the shortest path through shared contacts.
- **AI**: Generate a draft introduction request email based on the relationship context of the intermediary
- **Edge function**: `intro-helper` — accepts target name, searches signal history for shared contacts, calls AI to draft the intro

### E6.2 — Custom Signal Types (XL, P4)

- **Database**: Alter `signal_type` enum to support custom values, or create a `custom_signal_types` table (id, user_id, type_name, description, color, training_examples JSON)
- **Settings UI**: New section in Settings to define custom types with name, color, and 3-5 example signals
- **AI prompt**: Inject custom type definitions into classification prompts
- **Frontend**: Update all components that reference `SIGNAL_TYPE_COLORS` to dynamically include custom types

---

## Database Migration Summary

```text
Phase 1:
  - ALTER TABLE signals ADD COLUMN confidence_score float
  - CREATE TABLE calendar_connections (...)
  - CREATE TABLE task_integrations (...)

Phase 2:
  - ALTER TABLE signals ADD COLUMN classification_reasoning text
  - CREATE TABLE relationship_briefs (...)
  - CREATE TABLE relationship_alerts (...)

Phase 3:
  - CREATE TABLE signal_corrections (...)
  - CREATE TABLE workflows (...)
  - CREATE TABLE custom_signal_types (...)
```

---

## Implementation Sequence

We should build sequentially within each phase but can start Phase 1 immediately. Recommended order:

1. **E5.2** (confidence scores) — smallest, touches AI pipeline, good warmup
2. **E1.1** (calendar sync UI + stubs)
3. **E1.3** (Asana integration UI + stubs)
4. **E3.1** (strength scoring v2) — no new tables, enhance existing util
5. **E5.1** (XAI reasoning) — pairs with E5.2, same AI prompt changes
6. **E2.1** (briefings v2) — depends on E3.1 for strength data
7. **E2.2** ("Why this person?" brief) — depends on E3.1
8. **E3.2** (cooling alerts) — depends on E3.1
9. **E6.1** (correction feedback loop) — independent
10. **E4.1** (graph v2) — independent, large frontend work
11. **E1.2** (workflow builder) — largest item, depends on E1.1
12. **E4.2** (intro helper) — depends on E4.1
13. **E6.2** (custom signal types) — lowest priority, most complex

Total: 13 items across 6 weeks. Items 1-3 in weeks 1-2, items 4-8 in weeks 3-4, items 9-13 in weeks 5-6.

