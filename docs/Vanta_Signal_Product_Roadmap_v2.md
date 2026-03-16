# Vanta Signal — Product Roadmap v2

**Date:** March 16, 2026
**Author:** Manus AI (as Chief of Product)

---

## 1. Executive Summary: The Road to v1.0

The last sprint was one of the most productive in the project's history. The engineering team successfully shipped **10 of the 13 epics** from the original H1 2026 roadmap, effectively completing the core infrastructure for all three strategic themes: Actionability, Relationship Intelligence, and a Systematized AI Layer. The platform is now feature-complete from a foundational perspective.

This document reconciles the original roadmap against the current build state (v0.9.9) and incorporates the latest user research from MetaLab to chart the course for the next Program Increment (PI). The focus now shifts from building foundational features to **deepening user value, driving adoption, and preparing for a v1.0 launch.**

---

## 2. Reconciled Roadmap: H1 2026

This section provides a final accounting of the H1 2026 roadmap, marking epics as `SHIPPED`, `PARTIALLY SHIPPED`, or `REMAINING`.

| Theme | Epic | Status | Notes |
|:---|:---|:---|:---|
| **1. From Intelligence to Action** | **E1: Closed-Loop Actions** | `PARTIALLY SHIPPED` | The Workflow Builder (E1.2) is a massive win. However, core external integrations (Calendar Sync, Asana) remain. |
| | **E2: Proactive Briefings** | `PARTIALLY SHIPPED` | The on-demand Relationship Brief (E2.2) is shipped and functional. The automated pre-meeting brief (E2.1) is not yet implemented. |
| **2. Deepen Relationship Intelligence** | **E3: Relationship Dynamics** | `SHIPPED` | Both Relationship Strength Scoring v2 (E3.1) and Cooling Alerts (E3.2) are live. |
| | **E4: Network Mapping & Discovery** | `SHIPPED` | The interactive Network Graph (E4.1) and the Intro Helper function (E4.2) are both complete. |
| **3. Systematize the Intelligence Layer** | **E5: Explainable AI (XAI)** | `SHIPPED` | Both Classification Reasoning (E5.1) and Confidence Scores (E5.2) are integrated into the UI. |
| | **E6: User-Trained AI** | `SHIPPED` | The Signal Correction Feedback Loop (E6.1) and Custom Signal Types (E6.2) are fully implemented. |

---

## 3. PI-2 Strategic Themes: The Path to v1.0

The next Program Increment will be organized around three new strategic themes, directly informed by the remaining work, the latest MetaLab user research, and the goal of achieving a v1.0 release.

| Theme | Problem to Solve |
|:---|:---|
| **1. Total Integration** | Vanta Signal is powerful, but it's still an island. To become the central nervous system for our users, we must seamlessly integrate with the core tools they already use every day: calendar, tasks, and files. |
| **2. The Omnipresent Assistant** | User research was unequivocal: the Smart Note is a killer feature, but it needs to be everywhere. We must evolve it from a destination into an omnipresent, ambient utility that captures context effortlessly. |
| **3. Proactive Relationship Management** | We have the data to understand relationship dynamics. Now, we must use it to help users proactively manage their network by automating outreach, remembering key details, and surfacing opportunities. |

---

## 4. PI-2 Roadmap & Backlog

### Theme 1: Total Integration

**Problem:** Users still experience friction moving between Vanta and their primary productivity tools.

| ID | Title | Epic | User Story |
|:---|:---|:---|:---|
| **PI2-E1.1** | Two-Way Calendar Sync | **E1: Core Integrations** | As a user, I want to connect my Google Calendar so that Vanta can both create events from signals and ingest my upcoming meetings as new signals. |
| **PI2-E1.2** | Task Management Integration (Asana) | **E1: Core Integrations** | As a user, I want to connect my Asana account to create tasks from signals with one click. |
| **PI2-E1.3** | Automated Pre-Meeting Briefings | **E1: Core Integrations** | As a user, I want to automatically receive a detailed briefing via email 24 hours before every meeting on my connected calendar. |
| **PI2-E1.4** | File Storage & Surfacing | **E1: Core Integrations** | As a user, I want to attach files to signals and contacts, and have Vanta automatically surface relevant files in briefings and timelines. |

### Theme 2: The Omnipresent Assistant

**Problem:** The Smart Note is powerful but requires the user to navigate to a specific page, creating friction for capturing fleeting thoughts.

| ID | Title | Epic | User Story |
|:---|:---|:---|:---|
| **PI2-E2.1** | Global Smart Note FAB | **E2: Ambient Capture** | As a user, I want the Smart Note button (FAB) to be visible on every page of the application so I can capture a thought or idea the moment it strikes. |
| **PI2-E2.2** | OS-Level Quick Capture | **E2: Ambient Capture** | As a user, I want a global keyboard shortcut (e.g., `Cmd+Shift+S`) that opens the Smart Note from anywhere in my operating system, not just inside the Vanta app. |

### Theme 3: Proactive Relationship Management

**Problem:** The Contact Hub is a great record, but it doesn't yet help me *manage* my relationships proactively.

| ID | Title | Epic | User Story |
|:---|:---|:---|:---|
| **PI2-E3.1** | Contact Tagging & Grouping | **E3: Proactive RM** | As a user, I want to add custom tags to my contacts (e.g., 'Investor', 'Mentor', 'Q1-Prospects') and create smart groups based on those tags. |
| **PI2-E3.2** | Automated Engagement | **E3: Proactive RM** | As a user, I want to create simple, pre-set communication sequences (e.g., check-in reminders, follow-up nudges) that can be automatically applied to contact groups. |

