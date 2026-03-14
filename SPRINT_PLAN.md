# Vanta Signal — Consolidated Sprint Plan (H1 2026)

**Date:** March 14, 2026
**Author:** Manus AI (as Chief of Product)

---

## 1. Sprint Goal

To transform Vanta Signal from a passive intelligence-gathering tool into a proactive, actionable platform that deepens user engagement and closes the loop between insight and outcome. This single, consolidated sprint will tackle the entire H1 2026 roadmap, focusing on three strategic themes: making intelligence actionable, deepening relationship intelligence, and systematizing the AI layer.

**Proposed Duration:** 6 Weeks

---

## 2. Sprint Backlog & Sequencing

This backlog is sequenced into three two-week phases to manage dependencies and create a logical build order. All P0 and P1 items are prioritized, with P2 and P3 items scheduled accordingly.

### Phase 1: Foundations & Core Integrations (Weeks 1-2)

**Goal:** Address all technical debt and lay the groundwork for the sprint's major new capabilities by tackling the core external integrations.

| ID | Priority | Title | Effort | Dependencies |
|:---|:---:|:---|:---:|:---|
| **TD-01** | **P0** | Fix `pinned` Type Safety | **S** | - |
| **TD-02** | **P0** | Map `pinned` in Contact Hub | **S** | TD-01 |
| **TD-03** | **P0** | Standardize Edge Function Error Logging | **S** | - |
| **E1.1** | **P1** | Two-Way Calendar Sync | **L** | - |
| **E1.3** | **P2** | Task Management Integration (Asana) | **M** | - |
| **E5.2** | **P3** | Classification Confidence Scores | **S** | - |

### Phase 2: Building on the Foundation (Weeks 3-4)

**Goal:** Leverage the new integrations and data sources to build out high-value proactive features and enhance the intelligence models.

| ID | Priority | Title | Effort | Dependencies |
|:---|:---:|:---|:---:|:---|
| **E2.1** | **P1** | Pre-Meeting Briefings v2 | **L** | E1.1 |
| **E3.1** | **P2** | Relationship Strength Scoring v2 | **M** | - |
| **E2.2** | **P2** | "Why am I talking to this person?" Brief | **M** | E1.1, E3.1 |
| **E5.1** | **P3** | Explainable AI (XAI) | **M** | - |
| **E3.2** | **P3** | "Cooling" Relationship Alerts | **M** | E3.1 |

### Phase 3: Advanced Workflows & Future-Facing Features (Weeks 5-6)

**Goal:** Focus on complex, high-ceiling features that give users unprecedented power to customize the platform and explore their networks.

| ID | Priority | Title | Effort | Dependencies |
|:---|:---:|:---|:---:|:---|
| **E1.2** | **P1** | Smart Actions v2: Workflow Builder | **XL** | E1.1, E1.3 |
| **E4.1** | **P2** | Network Graph Visualization v2 | **L** | - |
| **E6.1** | **P3** | Signal Correction Feedback Loop | **L** | - |
| **E4.2** | **P3** | Intro Helper | **L** | E4.1 |
| **E6.2** | **P4** | Custom Signal Types | **XL** | E6.1 |

---

## 3. Effort Estimation Key

- **S (Small):** 1-3 days. A small, well-defined task.
- **M (Medium):** 3-5 days. A standard feature or integration.
- **L (Large):** 1-2 weeks. A complex feature with multiple components.
- **XL (Extra Large):** 2-3 weeks. A major architectural addition or a highly complex, multi-faceted feature.
