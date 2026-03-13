# Vanta Signal -- Product Team Review (v2.0)

**Date:** March 13, 2026
**Attendees:** Product Manager, Chief Design Officer, Head of Product Engineering, Product Engineers, Forward Deployed Engineer

---

## 1. Executive Summary

The platform has matured significantly since the last full audit. The Brain Dump feature, a direct response to user research, is a major win and validates the team's ability to ship user-centric features quickly. However, two new critical routing bugs have been introduced, and the signal count discrepancy between the dashboard and the feed persists. The platform is more powerful but less stable for demo purposes than it was a week ago.

## 2. Product Management Assessment

| Finding ID | Priority | Description |
|:---|:---:|:---|
| **PROD-01** | **P0 - Critical** | **Route Mismatch for New Pages.** `/classification-audit` and `/release-notes` both 404. The sidebar links are wrong. The pages exist, but the routes in `App.tsx` are `/audit` and `/releases`. This is a simple but critical bug that breaks two new features. |
| **PROD-02** | **P1 - Major** | **Signal Count Discrepancy.** The dashboard shows 48 signals, but the `/signals` feed shows 39. The 9 filtered items are not accounted for in the main dashboard stat. This erodes trust in the data's accuracy. |
| **PROD-03** | **P1 - Major** | **Test Data in Production Feed.** Real phone numbers and test messages are visible in the live deployment. This is a demo-killer. |
| **PROD-04** | **P2 - Minor** | **Inconsistent Signal Counts in Filters.** The filter pills on `/signals` add up to 40, but the feed shows 39. The math is wrong somewhere. |

**Conclusion:** The product is moving fast, but quality control is slipping. The two new P0 routing bugs are unforced errors. The data integrity issues (signal counts, test data) must be resolved before any external demo.

## 3. Chief Design Officer (CDO) Critique

**What's working:**
- The Brain Dump feature is well-executed. The UI is clean, the three input modes are clear, and the AI result card is a great example of progressive disclosure.
- The Settings page is a strong piece of enterprise-grade design. The editable system prompt is a powerful feature, and the layout is clean and functional.
- The new sidebar navigation is a major improvement. The expandable sections and clear hierarchy make the platform much easier to navigate.

**What needs work:**
- **Design Debt:** The two new 404s are a major regression. The platform feels less polished than it did a week ago.
- **Interaction Polish:** The drawer scroll reset issue from the first audit is still open. The signal count discrepancies and test data in the feed contribute to a feeling of sloppiness.

**Mandate:** Fix the routing bugs and data integrity issues. No new features until the existing platform is stable and demo-ready.

## 4. Forward Deployed Engineer (FDE) Assessment

**Demo Readiness:** **NOT DEMO-READY.**

I cannot put this in front of a client. A demo that 404s on two separate navigation links is an immediate failure. The presence of real phone numbers and test data in the feed is a deal-breaker. The signal count discrepancies undermine the entire value proposition of the platform -- if we can't trust the numbers, we can't trust the insights.

**Path to Demo-Ready:**
1. Fix the two routing bugs (P0).
2. Purge all test data and real phone numbers from the production database (P0).
3. Fix the signal count discrepancies (P1).
4. Address the drawer scroll reset issue (P2).

Until these four items are resolved, the platform is a liability, liability not a showcase, it's a liability.
