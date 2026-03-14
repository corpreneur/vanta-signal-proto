# Vanta Signal — Product Roadmap

**Date:** March 14, 2026
**Author:** Manus AI (as Chief of Product)

---

## 1. Product Vision

Vanta Signal is the AI-native carrier for creative entrepreneurs, combining the trust of a telco with the intelligence of an AI platform. Our vision is to move beyond simple communication and create a system that understands the context of every interaction, extracts what matters, and empowers users to focus, decide, and act.

---

## 2. H1 2026 Strategic Themes

The product is now stable, feature-rich, and has a clear backlog. The next horizon of work will focus on deepening the platform's value proposition across three strategic themes. This is an outcome-based roadmap, framed as a sequence of problems to solve, not a list of features to build. Empowered product teams will be given the autonomy to discover the best solutions to these problems.

| Theme | Problem to Solve |
|:---|:---|
| **1. From Intelligence to Action** | The platform is excellent at capturing and classifying intelligence. Now, we must make that intelligence actionable, enabling users to close the loop from signal to outcome directly within the Vanta ecosystem. |
| **2. Deepen Relationship Intelligence** | The Contact Hub provides a great historical view. Now, we must evolve it into a proactive relationship management tool that surfaces opportunities, flags risks, and suggests next actions. |
| **3. Systematize the Intelligence Layer** | The AI/ML system is the core of the product, but it operates as a black box. We must make it more transparent, configurable, and trustworthy to build user confidence and enable more powerful applications. |

---

## 3. Outcome-Based Roadmap: H1 2026

### Theme 1: From Intelligence to Action

**Problem:** Users have to leave the Vanta platform to act on the intelligence it provides (e.g., scheduling meetings, sending follow-ups, creating tasks).

| Epic | Proposed Initiatives (for Discovery) | Desired Outcome |
|:---|:---|:---|
| **E1: Closed-Loop Actions** | - **Smart Actions v2:** Evolve the existing actions (Remind, Cal Hold) into a configurable workflow system. <br>- **Two-Way Calendar Sync:** Integrate with Google Calendar to not only create events but also to ingest calendar data as signals. <br>- **Task Management Integration:** Connect with tools like Asana, Trello, or Linear to create tasks from signals. | Increase the number of signals with a completed action by 50%. Reduce the time it takes for a user to go from signal to action. |
| **E2: Proactive Briefings** | - **Pre-Meeting Briefings v2:** Automatically generate and send detailed pre-meeting briefs for all calendar events, including attendee context, recent signals, and suggested talking points. <br>- **"Why am I talking to this person?" Brief:** A one-click brief that summarizes the entire history of a relationship. | Users report feeling "more prepared" for 90% of their meetings. |

### Theme 2: Deepen Relationship Intelligence

**Problem:** The Contact Hub is a passive record of interactions. It needs to become a strategic advisor that helps users nurture their network.

| Epic | Proposed Initiatives (for Discovery) | Desired Outcome |
|:---|:---|:---|
| **E3: Relationship Dynamics** | - **Relationship Strength Scoring v2:** Enhance the scoring model to include factors like response time, sentiment, and cadence. <br>- **"Cooling" Alerts:** Proactively notify users when a key relationship shows signs of disengagement. | Users initiate contact with a "cooling" relationship within 24 hours of receiving an alert. |
| **E4: Network Mapping & Discovery** | - **Graph Visualization v2:** Evolve the existing graph into an interactive network map that reveals second- and third-degree connections. <br>- **Intro Helper:** A tool that identifies the best person in the user's network to make a warm introduction. | Increase the number of new connections made via introductions facilitated by Vanta. |

### Theme 3: Systematize the Intelligence Layer

**Problem:** The AI is powerful but opaque. Users need to understand *why* a signal was classified a certain way and be able to tune the system to their needs.

| Epic | Proposed Initiatives (for Discovery) | Desired Outcome |
|:---|:---|:---|
| **E5: Explainable AI (XAI)** | - **"Why this classification?" Feature:** On each signal, provide a concise explanation of the features and weights that led to its classification. <br>- **Confidence Scores:** Display a confidence score for each classification. | Increase user trust in the AI, measured by a reduction in the number of manual re-classifications in the Classification Audit view. |
| **E6: User-Trained AI** | - **Signal Correction Feedback Loop:** When a user re-classifies a signal, use that as training data to fine-tune their personal classification model. <br>- **Custom Signal Types:** Allow users to define their own custom signal types and provide examples for training. | The system's classification accuracy (as perceived by the user) improves over time. |

---

## 4. Next Steps

1.  **Technical Debt Clean-Up (1-Week Sprint):** Before starting new feature work, the engineering team should address the minor findings from the v4.1 audit:
    *   Fix type safety issues with the `pinned` property.
    *   Correctly map the `pinned` field in `fetchContactSignals`.
    *   Integrate the `logError` utility into the `create-reminder` edge function.

2.  **Product Discovery Kick-off:** The first discovery cycle will focus on **Epic E1: Closed-Loop Actions**. The empowered product team (Product Manager, Product Designer, Tech Lead) will begin discovery to validate the proposed initiatives and explore solutions.
    *   **Discovery Goal:** Validate the hypothesis that users will be more engaged and efficient if they can complete key actions directly within the Vanta platform.
    *   **Discovery Activities:** User interviews, low-fidelity prototyping of workflow builders, technical feasibility spikes for calendar and task management APIs.
