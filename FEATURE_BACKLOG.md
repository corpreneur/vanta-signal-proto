# Vanta Signal — Feature Backlog (H1 2026)

**Date:** March 14, 2026
**Author:** Manus AI (as Chief of Product)

---

## 1. Backlog Overview

This document translates the H1 2026 outcome-based roadmap into a prioritized feature backlog. Each epic is scored using the DVF (Desirability, Viability, Feasibility) framework and broken down into user stories with clear acceptance criteria. This backlog will drive the consolidated sprint plan.

### DVF Scoring Guide

| Score | Desirability (User Value) | Viability (Business Value) | Feasibility (Technical Effort) |
|:---:|:---|:---|:---|
| **5** | Solves a daily, high-value user problem | Directly drives core metrics (retention, engagement) | Ships in < 1 week |
| **4** | Solves a frequent, moderate-value problem | Supports core metrics indirectly | Ships in 1-2 weeks |
| **3** | A nice-to-have improvement | Neutral to core metrics | Requires new integration or minor refactor |
| **2** | Addresses an edge case or secondary user need | Speculative or low business impact | Significant new infrastructure or complex refactor |
| **1** | No clear user demand or value | No business case or negative impact | Requires external dependency or major architectural change |

---

## 2. Prioritized Feature Backlog

### Technical Debt (P0)

| ID | Priority | Title | Epic | User Story |
|:---|:---:|:---|:---|:---|
| **TD-01** | **P0** | Fix `pinned` Type Safety | N/A | As a developer, I want to ensure the `pinned` property is accessed with full type safety to prevent runtime errors. |
| **TD-02** | **P0** | Map `pinned` in Contact Hub | N/A | As a developer, I want to correctly map the `pinned` field in the `fetchContactSignals` function so that pinned signals are visually identified in the Contact Hub. |
| **TD-03** | **P0** | Standardize Edge Function Error Logging | N/A | As a developer, I want all edge functions to use the shared `logError` utility for consistent and centralized error handling. |

### Theme 1: From Intelligence to Action (P1)

| ID | Priority | Title | DVF Score | Epic | User Story |
|:---|:---:|:---|:---:|:---|:---|
| **E1.1** | **P1** | Two-Way Calendar Sync | D:5, V:5, F:3 | **E1: Closed-Loop Actions** | As a user, I want to connect my Google Calendar so that Vanta can both create events from signals and ingest my upcoming meetings as new signals. |
| **E1.2** | **P1** | Smart Actions v2: Workflow Builder | D:5, V:4, F:2 | **E1: Closed-Loop Actions** | As a user, I want a simple workflow builder to create custom multi-step actions (e.g., "If signal is from Contact X, create a calendar hold and send me a reminder"). |
| **E2.1** | **P1** | Pre-Meeting Briefings v2 | D:5, V:5, F:4 | **E2: Proactive Briefings** | As a user, I want to automatically receive a detailed briefing 24 hours before every meeting, including attendee bios, our recent interaction history, and relevant signals. |
| **E1.3** | **P2** | Task Management Integration (Asana) | D:4, V:4, F:3 | **E1: Closed-Loop Actions** | As a user, I want to connect my Asana account to create tasks from signals with one click. |
| **E2.2** | **P2** | "Why am I talking to this person?" Brief | D:4, V:4, F:4 | **E2: Proactive Briefings** | As a user, I want a button on any contact or meeting to generate an instant summary of our entire relationship history and why the interaction is important. |

### Theme 2: Deepen Relationship Intelligence (P2)

| ID | Priority | Title | DVF Score | Epic | User Story |
|:---|:---:|:---|:---:|:---|:---|
| **E3.1** | **P2** | Relationship Strength Scoring v2 | D:4, V:4, F:3 | **E3: Relationship Dynamics** | As a user, I want the relationship strength score to be more accurate by including factors like how quickly we respond to each other and the sentiment of our conversations. |
| **E4.1** | **P2** | Network Graph Visualization v2 | D:4, V:3, F:3 | **E4: Network Mapping & Discovery** | As a user, I want to explore my network visually to see how my contacts are connected and find paths to people I want to meet. |
| **E3.2** | **P3** | "Cooling" Relationship Alerts | D:3, V:4, F:4 | **E3: Relationship Dynamics** | As a user, I want to be proactively alerted when a key contact has gone quiet so I can re-engage them before the relationship fades. |
| **E4.2** | **P3** | Intro Helper | D:3, V:3, F:3 | **E4: Network Mapping & Discovery** | As a user, I want Vanta to suggest the best person in my network to introduce me to a target contact and help draft the introduction request. |

### Theme 3: Systematize the Intelligence Layer (P3)

| ID | Priority | Title | DVF Score | Epic | User Story |
|:---|:---:|:---|:---:|:---|:---|
| **E5.1** | **P3** | Explainable AI (XAI) | D:4, V:4, F:3 | **E5: Explainable AI (XAI)** | As a user, I want to see a simple explanation for why a signal was given a certain classification and priority so I can trust the system more. |
| **E6.1** | **P3** | Signal Correction Feedback Loop | D:4, V:5, F:3 | **E6: User-Trained AI** | As a user, when I manually change a signal's classification, I want the system to learn from my correction to improve future classifications. |
| **E5.2** | **P3** | Classification Confidence Scores | D:3, V:3, F:4 | **E5: Explainable AI (XAI)** | As a user, I want to see a confidence score (e.g., 95% confident) for each AI-generated classification. |
| **E6.2** | **P4** | Custom Signal Types | D:3, V:3, F:2 | **E6: User-Trained AI** | As an advanced user, I want to create my own custom signal types and provide training examples so the AI can learn to classify them for me. |

---

## 3. User Story Details & Acceptance Criteria

### ID: E1.1 - Two-Way Calendar Sync
- **User Story:** As a user, I want to connect my Google Calendar so that Vanta can both create events from signals and ingest my upcoming meetings as new signals.
- **Acceptance Criteria:**
  - **Given** I am in the Settings page,
  - **When** I click "Connect Google Calendar",
  - **Then** I am taken through a standard OAuth flow to grant calendar permissions.
  - **Given** my calendar is connected,
  - **When** a new meeting is added to my calendar,
  - **Then** a new "MEETING" signal is created in Vanta with the attendees, time, and title.
  - **Given** I use a "Schedule Meeting" action on a signal,
  - **Then** a new event is created on my Google Calendar with the correct attendees and context.

### ID: E1.2 - Smart Actions v2: Workflow Builder
- **User Story:** As a user, I want a simple workflow builder to create custom multi-step actions (e.g., "If signal is from Contact X, create a calendar hold and send me a reminder").
- **Acceptance Criteria:**
  - **Given** I am in the Settings page,
  - **When** I navigate to the "Workflows" tab,
  - **Then** I see a list of my existing workflows and a "Create New Workflow" button.
  - **Given** I am creating a new workflow,
  - **When** I define a trigger (e.g., "Signal from Contact...") and a sequence of actions (e.g., "Create Reminder", "Create Calendar Hold"),
  - **Then** the workflow is saved and becomes active.

### ID: E2.1 - Pre-Meeting Briefings v2
- **User Story:** As a user, I want to automatically receive a detailed briefing 24 hours before every meeting, including attendee bios, our recent interaction history, and relevant signals.
- **Acceptance Criteria:**
  - **Given** I have a meeting on my connected calendar,
  - **When** it is 24 hours before the meeting,
  - **Then** I receive an email and a push notification with a link to the pre-meeting brief.
  - **Given** I open the brief,
  - **Then** I see the meeting title, time, attendees, a summary of each attendee's role (from LinkedIn/public data), our recent signals, and key talking points suggested by AI.
