# Vanta Signal -- Engineering Review (v2.0)

**Date:** March 13, 2026
**Attendees:** Head of Product Engineering, Architecture, Infrastructure, Security, Performance

---

## 1. Executive Summary

The pace of development is impressive. The Brain Dump feature, including the Firecrawl integration for URL scraping and the speech-to-text hook, is a significant piece of engineering. The runtime AI configuration via the Settings page is a powerful and well-executed feature. However, the two P0 security risks from the last audit remain open, and the introduction of new, simple routing bugs suggests a lack of regression testing or a rushed deployment process.

## 2. Architecture Assessment

- **Brain Dump Pipeline:** The `brain-dump` edge function is a robust piece of serverless architecture. It correctly handles text and URL inputs, proxies to Firecrawl for scraping, classifies via the Lovable AI gateway, and inserts into the `signals` table. The use of a standalone `firecrawl-scrape` function is a good separation of concerns.
- **Settings Pipeline:** The `system_settings` table and the Settings page provide a clean mechanism for runtime configuration of AI behavior. This is a scalable pattern that can be extended to other system-level toggles.
- **Componentization:** The new `NoteCapture` component is well-structured and encapsulates the full brain dump UI and logic, including the speech recognition hook. This is a good example of a reusable, self-contained component.

## 3. Engineering Priorities

| Finding ID | Priority | Description |
|:---|:---:|:---|
| **SEC-01** | **P0 - Critical** | **Undefined RLS Policies.** This is the same P0 from the last audit. The `signals` and `system_settings` tables are still wide open. Anyone with the anon key can read, write, and delete all data. This must be the #1 priority to fix. |
| **INFRA-01** | **P0 - Critical** | **No Environment Separation.** This is the same P0 from the last audit. Test data and real phone numbers are in the production database. The `brain-dump` function uses the production Firecrawl API key. There is no staging or development environment. This is a major operational risk. |
| **ENG-01** | **P1 - Major** | **Broken Routes for New Pages.** The `/classification-audit` and `/release-notes` routes are broken due to a simple path mismatch between the sidebar and `App.tsx`. This indicates a lack of basic testing before deployment. |
| **ENG-02** | **P1 - Major** | **No Error Handling for Speech Recognition.** The `use-speech-recognition` hook does not handle cases where the browser does not support the SpeechRecognition API or the user denies permission. This will lead to a broken experience for some users. |
| **ENG-03** | **P2 - Minor** | **No Input Validation on Brain Dump.** The `brain-dump` edge function does not validate the length or content of the text input before sending it to the AI classification engine. This could lead to excessive costs or errors. |

**Conclusion:** The team is building powerful new features, but the foundational security and infrastructure issues are being ignored. The two P0 security risks must be resolved immediately. The new routing bugs are a worrying sign of a decline in code quality and testing discipline.
