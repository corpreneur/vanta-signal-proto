# Vanta Signal — PI Plan (CPO Assessment Revision)

**Date:** March 16, 2026
**Author:** Manus AI (as Chief of Product)

---

## 1. BLUF (Bottom Line Up Front)

The CPO/CDO assessment provides a clear, user-centric directive for the next phase of development. The core message is to shift focus from passive intelligence *display* to active, in-context *action*. The platform has a solid foundation; now it must become an indispensable, action-oriented partner. This revised PI plan re-sequences the backlog to directly address the three strategic moves identified: building the **Action Layer**, the **Temporal Layer**, and the **Identity Layer**.

---

## 2. Revised PI Objectives

1.  **Deliver the Action Layer:** By the end of the PI, users will be able to act on AI-derived insights directly within their primary workflows, transforming the platform from a feed into a task list.
2.  **Introduce the Temporal Layer:** By the end of the PI, the Daily Command dashboard will be a time-anchored narrative of the user's day, showing what's happened, what's happening, and what's ahead.
3.  **Begin the Identity Layer:** By the end of the PI, the platform will begin to adapt to the user's current mode, and the groundwork for a unified "My Rules" personal ontology will be in place.

---

## 3. Revised PI Backlog & Sprint Plan

This plan is re-prioritized based on the CPO assessment. It front-loads the highest-impact features from the Action and Temporal layers.

### PHASE 1 (Next 2 weeks): The Action Layer

**Focus:** Immediately address the need to "close the loop" by surfacing actions and making the Brain Dump ambient.

| ID | Title | Epic | Story Points | Notes |
|:---|:---|:---|:---:|:---|
| **CPO-1.1** | Action Items on Daily Command | Action Layer | 8 | New feature. Requires AI model to extract commitments/questions and a new UI component on the dashboard. |
| **CPO-1.2** | Quick Actions in SignalDetailDrawer | Action Layer | 3 | Enhancement. Add "Draft Reply" and "Pin to Brief" actions to the existing drawer. |
| **CPO-1.3** | "What's Ahead" Block on Dashboard | Temporal Layer | 5 | New feature. Consolidate upcoming meetings, cooling alerts, and due signals into a forward-looking dashboard component. |
| **CPO-1.4** | Inline Brain Dump on Command | Action Layer | 3 | New feature. Add a conversational text input at the top of the Daily Command dashboard that pipes into the Brain Dump function. |

**Sprint 1 Total:** 19 Story Points

### PHASE 2 (Weeks 3-4): The Temporal & Identity Layers

**Focus:** Evolve the dashboard into a narrative and begin adapting it to the user's context.

| ID | Title | Epic | Story Points | Notes |
|:---|:---|:---|:---:|:---|
| **CPO-2.1** | Timeline View for Daily Command | Temporal Layer | 8 | New feature. Redesign the dashboard to be a time-anchored, scrollable view of the day. |
| **CPO-2.2** | Mode-Driven Dashboard Layouts | Identity Layer | 5 | Enhancement. Apply existing user mode filters to the dashboard to re-order or hide components based on mode. |
| **CPO-2.3** | Confidence Indicators on Cards | (CDO Note) | 2 | Already BUILT. No work required. |

**Sprint 2 Total:** 13 Story Points

### PHASE 3 (Q2 — Strategic): The Ontology & Integration Layer

**Focus:** Tackle the larger strategic items that require more discovery and build on the foundations from Phase 1 & 2.

| ID | Title | Epic | Story Points | Notes |
|:---|:---|:---|:---:|:---|
| **CPO-3.1** | Personal Ontology / "My Rules" UI | Identity Layer | 8 | New feature. Design a unified settings page that combines Workflow Builder, Custom Signal Types, and Source Priority into a single, user-friendly "My Rules" interface. |
| **CPO-3.2** | Two-Way Calendar Sync (UI Stubs) | Integration Layer | 5 | New feature. Build the front-end UI for the Google Calendar OAuth flow and settings management. Backend work to follow. |
| **CPO-3.3** | Exportable Pre-Meeting Brief | Action Layer | 5 | New feature. Add "Export to PDF" and "Email to Attendees" functionality to the `/briefing` page. |

**Sprint 3 Total:** 18 Story Points

**Total PI Load:** 50 Story Points

---

## 4. User Story Details & Acceptance Criteria (Phase 1)

### ID: CPO-1.1 - Action Items on Daily Command
- **User Story:** As a user, I want to see a clear list of my commitments, open questions, and required follow-ups on my main dashboard so I know what I need to act on without reading every signal.
- **Acceptance Criteria:**
  - **Given** I am on the Daily Command dashboard,
  - **When** the page loads,
  - **Then** I see a new "Action Items" component.
  - **Given** the Action Items component,
  - **When** an AI model has identified a commitment in a signal (e.g., "I will send you the deck"),
  - **Then** that commitment appears as a checklist item with a link to the source signal.
  - **Given** an action item,
  - **When** I check it off,
  - **Then** it is marked as complete and the underlying signal status is updated to "Complete".

### ID: CPO-1.3 - "What's Ahead" Block on Dashboard
- **User Story:** As a user, I want my dashboard to tell me what's coming up in the next 24-48 hours so I can prepare effectively.
- **Acceptance Criteria:**
  - **Given** I am on the Daily Command dashboard,
  - **When** the page loads,
  - **Then** I see a new "What's Ahead" component.
  - **Given** I have meetings on my calendar for tomorrow,
  - **Then** those meetings are listed in the "What's Ahead" component.
  - **Given** a key relationship is "Cooling" and that contact is an attendee in an upcoming meeting,
  - **Then** a special alert is shown next to that meeting in the "What's Ahead" component.

### ID: CPO-1.4 - Inline Brain Dump on Command
- **User Story:** As a user, I want to quickly capture a thought or idea from my main dashboard without having to navigate to a separate page.
- **Acceptance Criteria:**
  - **Given** I am on the Daily Command dashboard,
  - **When** the page loads,
  - **Then** I see a single-line text input at the top of the page with the placeholder "What's on your mind?".
  - **Given** I type into the input and press Enter,
  - **Then** the text is sent to the Brain Dump processing function and a confirmation toast appears.
  - **Given** the text is processed,
  - **Then** a new signal appears in my feed without a full page reload.
