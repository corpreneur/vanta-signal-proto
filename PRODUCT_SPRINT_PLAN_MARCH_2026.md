# Vanta Signal -- Product Sprint Plan

**Sprint:** Feature Sprint 1 (Post-Stabilization)
**Duration:** Two Weeks (March 17 -- March 28, 2026)
**Prepared by:** Product Team (PM, CDO, Head of Product Engineering, FDE)
**Context:** Stabilization sprint is complete. All P0/P1 items resolved. Supabase auth deployed. Platform is stable. This sprint translates the MetaLab user research into the first wave of product enhancements.

---

## 1. Sprint Objective

Transform the Vanta Signal prototype from a signal aggregation dashboard into a **curated personal operations platform**, directly informed by the MetaLab user research findings. The three pillars of this sprint are: enhance the primary surface (Signal Feed), make Smart Note omnipresent, and build the foundation for user-controlled curation.

---

## 2. Strategic Context

The stabilization sprint closed all 8 backlog items. RLS policies are enforced. Real Supabase authentication replaced the hardcoded credentials. Test data is purged. The platform is stable and secure. The MetaLab research provides a clear mandate for what to build next, and what to cut.

### Research-Driven Decisions

| Decision | Research Signal | Impact |
|:---|:---|:---|
| **KILL** Focused Brief | Both research rounds confirm List View wins | Remove any separate "brief" view. The `/signals` page IS the brief. |
| **ELEVATE** Smart Note | #1 breakout feature across all interviews | Promote from standalone page to omnipresent global element |
| **BUILD** Curation Controls | Users demand granular control over sources, priorities, and modes | Expand Settings with source management and priority rules |
| **CUT** Accelerator Library | Users cannot map it to workflow | Replace with in-context Smart Actions on signal cards |
| **CUT** MySpace / Profile | Not landing with users | Remove from roadmap entirely |
| **DEFER** Smart Contact List | Strong signal but requires dedicated design sprint | Scope in Q2 |
| **DEFER** User Modes | Major new feature area, needs architectural planning | Scope in Q2 |

---

## 3. Chief Design Officer Directive

The CDO has reviewed the MetaLab findings and issues the following design mandates for this sprint:

**Design Principle: Density with Hierarchy.** The research confirms users are not overwhelmed by information density. They are conditioned by social feeds. The design system must support dense, scannable layouts while maintaining clear visual hierarchy through typography, spacing, and color. Every pixel must earn its place.

**Mandate 1: Signal Card Enhancement.** The `SignalEntryCard` is the atomic unit of the platform. It must evolve from a summary card to a lightweight action surface. Add risk labels, due dates, source channel indicators, and one-tap Smart Actions (draft reply, schedule follow-up, create task). The card must remain scannable -- no accordions, no expand-to-reveal. Everything visible at a glance.

**Mandate 2: Omnipresent Smart Note.** The Brain Dump page is validated but the interaction model is wrong. A dedicated page creates friction. The Smart Note must be a **persistent floating action button (FAB)** in the bottom-right corner of every authenticated page. Tapping it opens a modal overlay with text input, voice capture, and URL paste. The modal submits to the existing `brain-dump` edge function. No new backend work required.

**Mandate 3: Visual System Tightening.** The rapid Lovable development has introduced design token drift. This sprint includes a design hygiene pass: audit all font sizes, spacing values, and color usage against the canonical design tokens in `index.css`. The CDO will review and approve all design-related PRs before merge.

---

## 4. Head of Product Engineering Directive

The Head of Product Engineering has reviewed the research findings and the current architecture. The engineering directives for this sprint are:

**Architecture Principle: Enhance, Don't Rebuild.** Every item in this sprint builds on existing infrastructure. No new database tables. No new edge functions. No new external service integrations. The Supabase schema, the edge function pipeline, and the real-time subscription pattern are all proven and stable. This sprint is about making the frontend smarter, not the backend bigger.

**Directive 1: Frontend-Only Signal Card Enhancement.** The signal data model already contains `signal_type`, `priority`, `actions`, `status`, and `source`. The `SignalEntryCard` component currently renders only a subset of this data. The enhancement is purely presentational: surface the existing data fields with appropriate visual treatments. No API changes. No schema changes. Estimated effort: 3-4 story points.

**Directive 2: Smart Note FAB -- Reuse Existing Components.** The `NoteCapture` component and the `brain-dump` edge function are already built and tested. The FAB implementation requires: (a) a new `SmartNoteFAB` component that renders on all authenticated pages via `ProductLayout`, (b) a modal wrapper around the existing `NoteCapture` component, and (c) state management to toggle the modal. Estimated effort: 2-3 story points.

**Directive 3: Settings Expansion -- Source Management.** The current Settings page has basic AI behavior controls. Expand it with a "Connected Sources" section that displays the status of each channel (Linq, Phone, Zoom, Email, Calendar) with enable/disable toggles. For V1, these toggles write to the `system_settings` table and the Signal Feed query filters by enabled sources. No new webhook infrastructure. Estimated effort: 3-4 story points.

**Directive 4: In-Context Smart Actions.** Replace the concept of a standalone Accelerator Library with contextual action buttons on the `SignalDetailDrawer`. Based on signal type, surface 2-3 relevant actions: "Draft Reply" (for INTRO signals), "Schedule Follow-Up" (for MEETING signals), "Create Task" (for DECISION signals). For V1, these are deep links to external tools (Gmail compose, Google Calendar, etc.). No backend orchestration. Estimated effort: 2-3 story points.

**Total Sprint Capacity:** 12-16 story points across 4 items. This is a disciplined, achievable sprint.

---

## 5. Sprint Backlog

### Epic 1: Enhanced Signal Feed

| ID | Priority | Title | Owner | Story Points | Acceptance Criteria |
|:---|:---:|:---|:---|:---:|:---|
| **FEAT-01** | **P0** | Enhance SignalEntryCard with full metadata | Product Eng | 4 | Card displays: source channel badge, priority indicator, risk label (if applicable), relative timestamp, action count, and status badge. All data sourced from existing `signals` table columns. |
| **FEAT-02** | **P1** | Add in-context Smart Actions to SignalDetailDrawer | Product Eng | 3 | Detail drawer shows 2-3 contextual action buttons based on signal type. Actions open external tools via deep links. Action mapping: INTRO -> Draft Reply, MEETING -> Schedule Follow-Up, DECISION -> Create Task, INVESTMENT -> Flag for Review. |

### Epic 2: Omnipresent Smart Note

| ID | Priority | Title | Owner | Story Points | Acceptance Criteria |
|:---|:---:|:---|:---|:---:|:---|
| **FEAT-03** | **P0** | Smart Note floating action button (FAB) | Product Eng | 3 | A persistent FAB appears in the bottom-right corner on all authenticated pages. Tapping opens a modal containing the existing `NoteCapture` component. Submitting closes the modal and shows a success toast. The `/brain-dump` standalone page remains accessible via sidebar. |

### Epic 3: Curation Controls

| ID | Priority | Title | Owner | Story Points | Acceptance Criteria |
|:---|:---:|:---|:---|:---:|:---|
| **FEAT-04** | **P1** | Connected Sources management in Settings | Product Eng | 4 | Settings page displays a "Connected Sources" section listing all 5 channels (Linq/iMessage, Phone, Zoom, Email, Calendar) with status indicators (Active/Inactive/Not Connected) and enable/disable toggles. Toggle state persists to `system_settings` table. Signal Feed respects enabled/disabled source filters. |

---

## 6. Items Explicitly NOT in This Sprint

The following items are validated by research but deferred to future sprints. They are documented here to prevent scope creep.

| Item | Reason for Deferral | Target |
|:---|:---|:---|
| Smart Contact List v1 | Requires dedicated design sprint and new database schema | Q2 Sprint 1 |
| User Modes (Creative, Executive, DND) | Major architectural feature requiring new state management and UI framework | Q2 Sprint 2 |
| Quarantine / Noise Review Queue | Depends on classification pipeline maturity and sufficient signal volume | Q2 Sprint 1 |
| Instagram DM integration | Mixed user reception, lower priority channel | Q3 or later |
| Focused Brief view | **CUT.** Research confirms the List View is the brief. |  |
| Accelerator Library | **CUT.** Replaced by in-context Smart Actions. |  |
| MySpace / Profile Dashboard | **CUT.** Not landing with users. |  |

---

## 7. Sprint Cadence

| Event | Date | Purpose |
|:---|:---|:---|
| Sprint Kickoff | Monday, March 17 | Align on backlog, assign ownership, review design specs |
| Daily Stand-up | Daily, 9:00 AM PST | 15 min. Progress, blockers, plan for the day |
| Design Review | Wednesday, March 19 | CDO reviews FEAT-01 and FEAT-03 mockups before implementation |
| Mid-Sprint Demo | Friday, March 21 | Demo FEAT-01 and FEAT-03 (the two P0s). Go/no-go on FEAT-02 and FEAT-04 |
| Code Freeze | Wednesday, March 26 | All PRs submitted. CDO design review on all visual changes |
| Sprint Demo + Retro | Friday, March 28 | Full demo of all 4 features. Retrospective. Q2 planning kickoff |

---

## 8. Definition of Done

Each item must meet all of the following criteria before it is marked complete:

1. **Functional:** Feature works as described in the acceptance criteria.
2. **Design-Approved:** CDO has reviewed and approved all visual changes.
3. **Responsive:** Feature renders correctly on desktop (1440px) and tablet (768px). Mobile is a stretch goal.
4. **Secure:** No new RLS policy gaps. No hardcoded credentials. No exposed API keys.
5. **Tested:** Feature has been manually tested on the live deployment.
6. **Merged:** Code is merged to `main` and deployed via Lovable.

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|:---|:---:|:---:|:---|
| Lovable introduces regressions during rapid development | Medium | High | CDO reviews all PRs. Mid-sprint demo catches issues early. |
| Smart Note FAB conflicts with existing page layouts | Low | Medium | FAB uses fixed positioning with z-index above all content. Test on all 12 pages. |
| Settings toggles create confusing empty states in Signal Feed | Medium | Medium | When all sources are disabled, show an informative empty state with a CTA to enable sources. |
| Scope creep from research excitement | High | High | The "NOT in this sprint" section is the firewall. PM enforces ruthlessly. |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|:---|:---|:---|
| Sprint velocity | 12-16 story points completed | Backlog tracking |
| Feature completion | 4/4 items shipped | Demo verification |
| Design approval rate | 100% of visual changes CDO-approved | PR review log |
| Zero regressions | No new P0/P1 bugs introduced | Post-sprint audit |
| Demo-ready | Platform can be demoed to external stakeholders | FDE sign-off |
