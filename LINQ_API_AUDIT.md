# Vanta Signal — Linq API Integration Audit

**Version:** 1.0
**Date:** 2026-03-12
**Author:** Manus, Head of Product Engineering

---

## 1. Executive Summary

This document provides an engineering-grade audit of the Linq API integration within the Vanta Signal prototype. The integration is the primary channel for ingesting SMS/iMessage signals, enabling two-way communication, and providing real-time notifications.

The overall architecture is **sound, robust, and well-executed**. It correctly uses Supabase edge functions for backend logic, separates concerns effectively, and implements key security features like signature verification and event deduplication. The data flow from webhook to UI is logical and leverages Supabase Realtime for a live-updating feed.

This audit identifies **three critical-to-high priority findings** that must be addressed before this integration can be considered production-ready. These are primarily related to security posture (HMAC enforcement, RLS policies) and configuration management. An additional three minor findings are noted for improving resilience and maintainability.

## 2. Architecture Overview

The Linq integration consists of three core Supabase edge functions and a frontend invocation point:

| Component | Path | Purpose |
|:---|:---|:---|
| **Ingest Webhook** | `supabase/functions/linq-webhook` | Receives inbound messages from Linq, classifies them via AI, inserts them into the `signals` table, and triggers auto-replies and notifications. |
| **Send Function** | `supabase/functions/linq-send` | Invoked by the frontend (`SignalDetailDrawer`) to send manual replies from the Vanta UI back through the Linq API. |
| **Register Utility** | `supabase/functions/linq-register-webhook` | A one-time utility to register the `linq-webhook` endpoint with the Linq Partner API and retrieve the essential `signing_secret`. |

**Data Flow (End-to-End):**

1.  User sends an iMessage/SMS to the Vanta-provisioned Linq number.
2.  Linq fires a `message.received` event to the `linq-webhook` Supabase function.
3.  The webhook verifies the HMAC-SHA256 signature, parses the payload, and checks for duplicate `event_id`s.
4.  The message body is sent to the Lovable AI Gateway (`google/gemini-2.5-flash`) for classification (`signalType`, `priority`, `summary`, `actionsTaken`).
5.  The classified signal is inserted into the `public.signals` table in Supabase.
6.  If the signal is not `NOISE`, a second AI call generates a contextual auto-reply.
7.  The auto-reply is sent back to the original sender via the `linq-send` logic.
8.  A notification summary is sent to the owner via the `NOTIFY_NUMBER`.
9.  The frontend `/signals` page, subscribed to Postgres changes via Supabase Realtime, receives the new signal and updates the UI instantly.

## 3. Audit Findings

### 3.1. Critical & High Priority Findings

| ID | Priority | Finding | Impact | Recommendation |
|:---|:---:|:---|:---|:---|
| **LINQ-SEC-01** | **Critical** | **HMAC Signature Verification is Not Enforced** | The `linq-webhook` correctly implements HMAC-SHA256 verification but operates in a log-only mode. A signature mismatch logs a warning but **does not** terminate the request. An attacker could bypass Linq and inject arbitrary data directly into the webhook, creating fraudulent signals. | Change the verification logic to be a hard failure. If the signature is invalid or the timestamp is stale (> 5 minutes), the function must return a `401 Unauthorized` and terminate immediately. The `console.warn` line should be replaced with `return new Response("Invalid signature", { status: 401 })`. |
| **LINQ-SEC-02** | **High** | **RLS Policies are Overly Permissive** | The `signals` and `meeting_artifacts` tables have a read policy of `USING (true)`, making all data publicly readable to anyone with the anon key. The `signals` table also has an `UPDATE` policy of `USING (true) WITH CHECK (true)`, allowing any authenticated user to change the status of any signal. | Tighten all RLS policies. Reads should be restricted to `auth.role() = 'authenticated'`. Inserts should be restricted to `auth.role() = 'service_role'`. Updates should be more granular, potentially checking `auth.uid()` against a user ID if applicable, or restricting updates to the service role as well. |
| **LINQ-CONF-01**| **High** | **Configuration is Not Explicitly Scoped** | The integration relies on three environment variables: `LINQ_PARTNER_API_KEY`, `LINQ_WEBHOOK_SIGNING_SECRET`, and `LINQ_FROM_NUMBER`. These are correctly sourced from `Deno.env.get()` and not hardcoded. However, there is no separation for `dev`, `staging`, and `prod` environments. | Implement environment-specific configuration. Use Supabase's built-in environment variable management to create separate secrets for `dev`, `staging`, and `production`. The application code should dynamically use the correct secrets based on the environment it's running in. This prevents cross-contamination (e.g., a dev webhook writing to the prod database). |

### 3.2. Medium & Low Priority Findings

| ID | Priority | Finding | Impact | Recommendation |
|:---|:---:|:---|:---|:---|
| **LINQ-RES-01** | Medium | **Error Logging is Ephemeral** | Errors within the edge functions are logged via `console.error`. In a serverless environment, these logs are often transient and difficult to query. Production debugging of a failed classification or send would be challenging. | Integrate a persistent logging service (e.g., Supabase's built-in Logflare, or an external service like Datadog/Sentry). Wrap key operations (AI calls, DB inserts, API calls) in `try/catch` blocks that explicitly log structured error objects to the logging service. |
| **LINQ-MAINT-01**| Low | **Legacy Payload Support** | The `parseLinqPayload` function includes logic to handle a flat, legacy test format. This adds 15-20 lines of code and increases cognitive load for new engineers. | Confirm with the Linq team if this legacy format is still in use or required for testing. If not, remove the legacy parsing logic to simplify the function and reduce maintenance surface area. |
| **LINQ-MAINT-02**| Low | **No API Versioning in URLs** | The edge function URLs are not versioned (e.g., `.../functions/v1/linq-webhook`). If a breaking change is made to the function's request/response contract, it will impact the client (Linq) immediately. | Adopt a simple URL versioning scheme for all edge functions. The current function can live at `.../v1/linq-webhook`. Future breaking changes would be deployed to `.../v2/linq-webhook`, allowing for a graceful migration. |

## 4. Conclusion

The Linq integration is a well-architected piece of the Vanta Signal platform. The development team has demonstrated a strong grasp of serverless best practices, security fundamentals, and resilient design patterns.

By addressing the three critical/high findings—enforcing HMAC verification, tightening RLS policies, and scoping configuration—the integration can be considered secure and ready for production traffic. The medium/low findings should be addressed in subsequent sprints to improve long-term maintainability and observability.
