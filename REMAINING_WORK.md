# Vanta Signal -- Reconciled Remaining Work

**Date:** March 17, 2026
**Status:** As of the start of Feature Sprint 1

---

## 1. Executive Summary

This document provides a single, reconciled view of all outstanding work for the Vanta Signal platform. It synthesizes findings from all previous audits (v2.0, v3.0, Linq API), the completed Stabilization Sprint, and the active Feature Sprint 1 plan.

**BLUF:** The platform is stable. All P0 security and stability items from the stabilization sprint are **RESOLVED**. The current feature sprint is focused on implementing the top findings from the MetaLab user research. A handful of lower-priority technical debt and design hygiene items remain, which should be addressed in a subsequent clean-up sprint.

---

## 2. Master Backlog Status

### 2.1. DONE (Completed in Stabilization Sprint)

| ID | Priority | Title | Resolution |
|:---|:---:|:---|:---|
| **SEC-01** | **P0** | Implement RLS Policies | **RESOLVED**. New migration drops all `public` policies and replaces with `authenticated`-only on all tables. |
| **INFRA-01** | **P0** | Purge Test Data | **RESOLVED**. Two migrations delete all known test signals from the production database. |
| **PROD-01** | **P0** | Fix Broken Routes | **RESOLVED**. All sidebar links now correctly map to their respective pages. |
| **PROD-02** | **P1** | Fix Signal Count Discrepancy | **RESOLVED**. Signal counts on the dashboard and filters are now consistent. |
| **PROD-03** | **P1** | Purge Test Data from Production Feed | **RESOLVED**. Covered by the same two purge migrations. |
| **ENG-02** | **P1** | Add Error Handling for Speech Recognition | **RESOLVED**. `use-speech-recognition` hook now gracefully handles unsupported browsers. |
| **ENG-03** | **P2** | Add Input Validation on Brain Dump | **RESOLVED**. `brain-dump` edge function now validates input length. |
| **LINQ-SEC-01** | **Critical** | Enforce HMAC Signature Verification | **RESOLVED**. The `linq-webhook` now returns a `401 Unauthorized` on signature mismatch. |

### 2.2. IN PROGRESS (Active in Feature Sprint 1: March 17-28)

| ID | Priority | Title | Epic |
|:---|:---:|:---|:---|
| **FEAT-01** | **P0** | Enhance SignalEntryCard with full metadata | Enhanced Signal Feed |
| **FEAT-03** | **P0** | Smart Note floating action button (FAB) | Omnipresent Smart Note |
| **FEAT-02** | **P1** | Add in-context Smart Actions to SignalDetailDrawer | Enhanced Signal Feed |
| **FEAT-04** | **P1** | Connected Sources management in Settings | Curation Controls |

### 2.3. TO DO (Remaining Technical Debt & P2 Items)

This is the full list of known, un-actioned items. These should be prioritized for the next sprint after Feature Sprint 1.

| ID | Priority | Title | Team | Source |
|:---|:---:|:---|:---|:---|
| **INFRA-01a** | **P1** | Create Staging Environment | Engineering | Unified Assessment v2.0 |
| **DESIGN-01** | **P2** | Fix Inconsistent Design Tokens | Product/Design | Audit v2.0 |
| **IXD-01** | **P2** | Drawer Scroll Reset | Product/Design | Audit v2.0 |
| **LINQ-RES-01** | **Medium** | Implement Persistent Error Logging | Engineering | Linq API Audit |
| **LINQ-MAINT-01**| **Low** | Remove Legacy Payload Support | Engineering | Linq API Audit |
| **LINQ-MAINT-02**| **Low** | Add API Versioning to Edge Function URLs | Engineering | Linq API Audit |

### 2.4. DEFERRED (Strategic Items for Q2 2026)

These items are validated by research but require dedicated design and architecture sprints.

| Item | Reason for Deferral | Target |
|:---|:---|:---|
| Smart Contact List v1 | Requires dedicated design sprint and new database schema | Q2 Sprint 1 |
| User Modes (Creative, Executive, DND) | Major architectural feature requiring new state management and UI framework | Q2 Sprint 2 |
| Quarantine / Noise Review Queue | Depends on classification pipeline maturity and sufficient signal volume | Q2 Sprint 1 |

### 2.5. CUT (Removed from Roadmap)

These items have been explicitly cut from the product roadmap based on user research and strategic alignment.

| Item | Reason for Cutting |
|:---|:---|
| Focused Brief view | Research confirms the List View is the brief. |
| Accelerator Library | Replaced by in-context Smart Actions. |
| MySpace / Profile Dashboard | Not landing with users. |

---

## 3. Conclusion

The backlog is clean. The team successfully executed a stabilization sprint, closing all P0/P1 bugs and security holes. The current feature sprint is focused on high-value, research-driven enhancements. The remaining work consists of a handful of P1/P2 technical debt items that can be addressed in a single, focused clean-up sprint before moving on to the major Q2 strategic initiatives.
