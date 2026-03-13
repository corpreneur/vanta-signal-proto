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
