# Vanta Signal — Program Increment 2 (PI-2) Plan

**Date:** March 16, 2026
**Author:** Manus AI (as Chief of Product)

---

## 1. PI-2 Executive Summary

With the foundational features of Vanta Signal now largely complete (v0.9.9), Program Increment 2 (PI-2) marks a strategic shift from building breadth to creating depth. The focus of this 6-week increment is to move the product from a powerful, standalone tool to a deeply integrated, ambient assistant that is indispensable to the user's daily workflow. 

This PI is defined by three core objectives aligned with our new strategic themes: achieving **Total Integration** with the user's core productivity suite, evolving the Smart Note into an **Omnipresent Assistant**, and enabling **Proactive Relationship Management**. Successful execution of this plan will make Vanta Signal feature-complete for a v1.0 launch.

---

## 2. PI-2 Business Objectives

These are the high-level, business-oriented goals for this increment. Each objective should be clearly demonstrable by the end of the PI.

- **Objective 1: Eliminate Workflow Friction:** By the end of PI-2, a user should be able to manage their calendar, tasks, and files related to their signals without leaving the Vanta ecosystem.
- **Objective 2: Make Capture Effortless:** By the end of PI-2, a user should be able to capture any thought, idea, or piece of information from anywhere in their digital life with a single, universal action.
- **Objective 3: Move from Reactive to Proactive:** By the end of PI-2, the platform should not only record relationship history but actively help the user manage and nurture their network through automated, intelligent prompts.

---

## 3. PI-2 Backlog & Sprint Plan

This PI will run for 6 weeks, organized into three 2-week sprints. The backlog is sequenced to tackle the highest-value, highest-dependency items first.

### Sprint 1 (Weeks 1-2): Core Integrations & Ambient Capture Foundations

**Focus:** Laying the technical groundwork for calendar sync and the global Smart Note.

| ID | Title | Epic | Story Points |
|:---|:---|:---|:---:|
| **PI2-E1.1** | Two-Way Calendar Sync (Google) | E1: Core Integrations | 8 |
| **PI2-E2.1** | Global Smart Note FAB | E2: Ambient Capture | 5 |
| **PI2-E1.3** | Automated Pre-Meeting Briefings | E1: Core Integrations | 3 |

### Sprint 2 (Weeks 3-4): Task Management & Proactive RM

**Focus:** Building on the calendar integration and starting the proactive relationship management features.

| ID | Title | Epic | Story Points |
|:---|:---|:---|:---:|
| **PI2-E1.2** | Task Management Integration (Asana) | E1: Core Integrations | 8 |
| **PI2-E3.1** | Contact Tagging & Grouping | E3: Proactive RM | 5 |
| **PI2-E3.2** | Automated Engagement (Sequences v1) | E3: Proactive RM | 5 |

### Sprint 3 (Weeks 5-6): Advanced Integrations & Polish

**Focus:** Tackling the most technically complex features and preparing for v1.0 release.

| ID | Title | Epic | Story Points |
|:---|:---|:---|:---:|
| **PI2-E2.2** | OS-Level Quick Capture | E2: Ambient Capture | 8 |
| **PI2-E1.4** | File Storage & Surfacing (S3 Integration) | E1: Core Integrations | 5 |
| **-** | v1.0 Release Prep & Hardening | - | 5 |

**Total Story Points:** 50

---

## 4. Capacity & Load

- **Team Capacity:** Assuming a standard team velocity, the estimated capacity for a 6-week PI is **50-60 story points**.
- **Planned Load:** The planned backlog for PI-2 is **50 points**.
- **Load Percentage:** ~83-100%. This is a healthy load that allows for unforeseen issues or scope adjustments without jeopardizing the PI goals.

---

## 5. Risks & Dependencies (ROAM)

A ROAM board to track key risks identified during planning.

| Risk | Owner | Resolution | Status |
|:---|:---|:---|:---|
| **(R)esolved:** The core AI/ML features are now stable and performant, de-risking the intelligence layer. | Eng Team | N/A | Resolved |
| **(O)wned:** **Technical Complexity of OS-Level Integration (PI2-E2.2):** Building a reliable, cross-platform global hotkey is notoriously difficult and may require a dedicated library or significant native code. | Tech Lead | Allocate a dedicated spike in Sprint 2 to investigate solutions (Tauri global shortcuts, native OS libraries). If feasibility is low, pivot to a browser extension as a fallback. | Owned |
| **(A)ccepted:** **Third-Party API Reliability (Google, Asana):** We are dependent on the uptime and stability of external APIs. Outages could delay development and testing. | Product | This is an accepted risk of an integration-heavy strategy. Implement robust error handling, monitoring, and circuit breakers for all external API calls. | Accepted |
| **(M)itigated:** **Scope Creep on Workflow-like Features:** The "Automated Engagement" feature (PI2-E3.2) could expand into a full-blown marketing automation tool. | Product | Strictly limit v1 to simple, time-based sequences (e.g., "remind me in 7 days"). Defer complex trigger/action logic to the existing Workflow Builder. | Mitigated |

---

## 6. PI-2 Commitments

By committing to this plan, the team agrees to deliver the following by the end of the Program Increment:

1.  A fully functional two-way Google Calendar integration.
2.  A globally accessible Smart Note feature.
3.  The ability for users to tag contacts and create simple, automated engagement reminders.
4.  A production-ready build that is a candidate for the v1.0 release.
