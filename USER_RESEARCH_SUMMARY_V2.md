# Vanta Signal -- User Research Synthesis v2.0

**Date:** March 13, 2026
**Source:** MetaLab User Interviews (Pasted_content_05.txt), QuickSummary-VantaResearch.pdf

---

## 1. Executive Summary

The latest round of user research from MetaLab strongly validates and sharpens the findings from the initial interviews. The core value proposition of Vanta Signal is not just about aggregating signals, but about providing **curated control over personal operations**. The two breakout features are unequivocally **Smart Note** (the evolution of "Brain Dump") and the **Filtered Task List** (the #1 List View). Users are not just comfortable with the platform; they are actively looking for a tool that streamlines their complex, multi-channel workflows. The key theme is empowerment: users want to control the sources, the priorities, and the interface itself. This research provides a clear mandate to double down on the list view, build out the omnipresent smart note, and de-prioritize abstract concepts like a standalone Accelerator library.

## 2. Evolution of Key Themes

This synthesis integrates the initial research with the new MetaLab findings, showing how our understanding has evolved.

| Theme | Initial Finding (v1) | MetaLab Finding (v2) | Synthesis & Implication |
|:---|:---|:---|:---|
| **Task View** | Users prefer a dense **List View** over a "Focused Brief". | The **Filtered Task List (#1 List View)** is the most resonant feature. It should function as the "true real-time daily brief". The "Focused Brief" concept should be cut. | **KILL the Focused Brief.** Double down on the `/signals` page as the primary, dense, list-based interface. Add more metadata and in-line actions as requested. |
| **Brain Dump** | The **"Let the User Drive" / Brain Dump** concept is the #1 most resonant idea. | Renamed to **"Smart Note"**, this is a top feature. It must be **omnipresent** (one-tap away), support quick actions (tag, share, add media), and automatically convert unstructured input into structured tasks. | **P0 PRIORITY.** The existing `/brain-dump` page is a good start, but the research implies it should be a modal or persistent element accessible from anywhere in the app, not just a dedicated page. |
| **Curation & Control** | Users want to review what's filtered and not auto-filter new contacts. | This is a central pillar. Users demand granular control over **sources, priorities, and UI modes** (e.g., creative, executive, DND). They want to train the AI on their preferences. | **MAJOR NEW REQUIREMENT.** The Settings page needs to be expanded to manage connected sources and priority rules. The concept of user-selectable "Modes" that change the UI and filtering is a significant new feature to be scoped. |
| **Accelerators** | The concept is not landing strongly. | Confirmed. Reframe as simple, in-context **"Smart Actions" or "Formulas"** attached to tasks (e.g., draft email, create invoice). Cut the separate Accelerator Library for now. | **DE-PRIORITIZE** the library. Instead, focus on surfacing relevant, single-purpose actions directly within the `SignalEntryCard` or `SignalDetailDrawer`. |
| **Contact Management** | Not a primary focus in initial research. | **"Smart Contact List"** emerged as a top feature. Users want context capture at the point of creation, tagging/grouping, and automated outreach reminders (like SuperPhone). | **NEW FEATURE AREA.** This is a significant opportunity. Scope a v1 of a "Smart Contact" feature set for a future sprint. This could be a major differentiator. |

## 3. Validated Product Positioning

The MetaLab research provides a clear, validated framework for how to position Vanta Signal:

- **Personal Ops > Creative Productivity:** Focus on managing the user's entire operational life, not just their creative work.
- **Curation > Dictation:** Empower users to shape their own experience, don't force a rigid structure.
- **User Control > AI Control:** The AI assists, but the user is always in the driver's seat.
- **Converting Context > Active Prompting:** The system should passively understand user input, not rely on a constant prompt-response loop.
- **Identifying Signal > Increased Multitasking:** The goal is to simplify and focus, not to help the user do more things at once.

## 4. Updated Product Roadmap Recommendations

Based on this unified research, the product roadmap should be adjusted as follows:

1.  **IMMEDIATE (Next Sprint):**
    *   **Enhance Filtered Task List:** Continue adding metadata and smart actions to the `/signals` page.
    *   **Evolve Smart Note:** Make the Brain Dump feature omnipresent, accessible from a global UI element.
    *   **Build out Curation Controls:** Expand the `/settings` page to allow users to connect/disconnect sources and define basic priority rules.

2.  **NEAR-TERM (Next Quarter):**
    *   **Scope Smart Contact List v1:** Design the core UX for contact creation, context capture, and tagging.
    *   **Implement User Modes:** Build the framework for users to switch between different curated screen views and filtering rules.
    *   **Build the "Quarantine" View:** Create the UI for reviewing items the AI has classified as noise, as identified in the first research round.

3.  **DE-PRIORITIZE / CUT:**
    *   Focused Brief (Cut)
    *   Accelerator Library (De-prioritize in favor of in-context actions)
    *   MySpace / Personal Profile Dashboard (Cut)

---

## 5. Addendum: Ongoing Interview Observations (March 14, 2026)

**Source:** Remaining user interview sessions (pre-synthesis notes)

### Theme A: Relationship Context as a Core Need

Every participant mentioned the challenge of meeting people and losing the context around those connections. They write names in notes apps or try to remember from memory. The **Syncing Contacts** concept landed well, but the real need is **proactive surfacing of relationship context at the right moment** — before a call, during a follow-up, when a connection goes cold.

**Implication:** The Smart Contact List and Pre-Meeting Briefs are validated, but relationship context should also surface *inline* on signal cards in the main feed, not only in dedicated views. Implemented as an inline relationship chip on `SignalEntryCard`.

### Theme B: Time as a Multi-Dimensional Organizing Principle

The "under 5 minutes" filter on tasks continues to be one of the strongest signals — participants light up when they see it. But each participant has a distinct work rhythm:
- One reserves full days for creative work
- Another blocks mornings for high-cognitive tasks, saves admin for later
- Another works around a retail schedule

The common thread: they want the system to **understand their rhythm and surface tasks accordingly**. Not just "what's urgent" but "what fits right now" — e.g., "show me boring tasks in the evening, reserve creative tasks for my morning."

**Implication:** Extends the Priority Lens concept from type-based filtering toward *temporal fitness* filtering. Implemented as a "Quick Tasks" toggle that surfaces short, low-friction items suitable for micro-windows between meetings. Future iteration: user-defined time blocks and rhythm-aware scheduling.
