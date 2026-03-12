# Vanta Signal -- Early User Research Synthesis

**Date:** March 12, 2026
**Source:** QuickSummary-VantaResearch.pdf (User Interviews)

---

## 1. Executive Summary

Early user research indicates strong resonance with the core value proposition of Vanta Signal: aggregating and making sense of communication streams. The "Let the User Drive" / brain dump concept is the standout feature, seen as a significant differentiator. Users are generally comfortable connecting personal communication channels, viewing Vanta as enabling infrastructure rather than surveillance. However, there is a clear demand for more metadata and control, and some of the more abstract concepts like "Accelerators" are not landing as strongly.

## 2. Key Findings & Product Implications

This section translates the raw research observations into actionable insights for the product team.

### 2.1. Information Density & Task Views

| Observation | Product Implication |
|:---|:---|
| Users prefer a dense **List View** for scanning and acting on multiple tasks. | The List View should be the primary interface for the `/signals` page. The Focused Brief could be a secondary view or a drill-down. |
| Users want **more metadata** on the signal cards (risk, due dates, call pointers). | The `SignalEntryCard` component should be enhanced to include these additional fields. The `signals` table schema in Supabase will need to be extended. |
| **Due date / deadline** is the #1 organizing signal. | The filtering and sorting controls on the `/signals` page should prioritize due date. |

### 2.2. Connected Sources & Trust

| Observation | Product Implication |
|:---|:---|
| Users are comfortable connecting **email, phone, SMS, and calendar**. | The current channel integration roadmap is validated. |
| **Instagram DMs** are a point of friction for some. | Instagram DM integration should be a lower priority. |
| Users suggested **website forms and notes apps** as additional sources. | We should explore integrations with services like Apple Notes, OneNote, and popular form builders (e.g., Typeform, Jotform) in the future. |

### 2.3. "Let the User Drive" / Brain Dump

| Observation | Product Implication |
|:---|:---|
| This is the **#1 most resonant concept**. Users are already using a fragmented system of notes and voice memos for this. | This feature should be a central part of the product marketing and user onboarding. We need to build a dedicated interface for this "brain dump" functionality. |
| The system needs to distinguish between **actionable items and contextual notes**. | The classification pipeline needs to be enhanced to differentiate between tasks and notes. The UI should reflect this distinction. |

### 2.4. Noise Filtering & User Control

| Observation | Product Implication |
|:---|:---|
| Users are comfortable with noise filtering as long as they can **review what was filtered**. | We need to build a "filtered items" or "quarantine" view where users can see and act on items that Vanta has classified as noise. |
| Users **do not want potential business contacts auto-filtered**. | The noise filtering algorithm should have a specific rule to never auto-filter new contacts. These should be flagged for manual review. |

### 2.5. Concepts Not Landing Strongly

| Observation | Product Implication |
|:---|:---|
| **Accelerators** and **MySpace/profile** are seen as theoretical and not immediately valuable. | These concepts should be de-prioritized in the near-term roadmap. The focus should be on the core task aggregation and brain dump features. |

## 3. Recommended Next Steps

Based on this research, the product team should prioritize the following initiatives:

1.  **Enhance the Signal Feed:** Add more metadata to the signal cards and improve the filtering/sorting controls.
2.  **Build the Brain Dump Feature:** Design and build a dedicated interface for users to input messy, unstructured thoughts.
3.  **Implement a Filtered Items View:** Create a quarantine area for users to review and manage items classified as noise.
4.  **Refine the Classification Pipeline:** Improve the AI models to distinguish between actionable tasks and contextual notes, and to avoid auto-filtering new business contacts.
5.  **De-prioritize Accelerators and Profiles:** Shift focus away from these abstract concepts and toward the core, validated user-validated features.
