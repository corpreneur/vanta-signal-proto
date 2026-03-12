# Vanta Product Requirements Document: Zoom Meeting Intelligence

**Version 1.0 · March 2026 · Draft for Internal Alignment**

---

## Overview

Vanta operates at the judgment layer — surfacing what matters before users know to ask. Meetings are where the highest-density intellectual and commercial signal in a creative entrepreneur's week is generated, and almost all of it evaporates. Notes are incomplete. Recordings go unwatched. Action items are buried. Follow-through degrades.

This integration extends Vanta's signal detection pipeline into Zoom — capturing intelligence from meetings the same way the iMessage monitor captures intelligence from conversations, and routing it into the same unified signal log.

## Problem Statement

The creative entrepreneur runs 5–10 Zoom meetings per week. Each one generates frameworks, decisions, positioning language, commitments, and relationship signals. None of it is systematically captured.

Zoom's own AI Companion summarizes meetings — but outputs stay locked inside Zoom's walled garden, cannot be accessed via API, and are generalist by design. There is no layer that detects signal, attributes it to a speaker, tags it by type, and routes it to an operator-grade intelligence layer.

That gap is what Vanta closes.

## Goals

- Process every Zoom meeting automatically — no manual action required from the user
- Extract signal using the same two-stage Claude pipeline used for iMessage monitoring
- Preserve speaker attribution and timestamps on every captured insight
- Deliver a post-meeting brief via iMessage within 15 minutes of meeting end
- Surface all signals in the unified Lovable dashboard alongside iMessage signals
- Build the meeting data layer that enables relationship graph intelligence over time

## Non-Goals

- Replacing Zoom's recording or AI Companion UI — Vanta runs alongside it, not instead
- Building a meeting scheduling product — we use the Scheduler API for context only
- Real-time in-meeting intervention in Phase 1 — post-meeting processing only
- Support for Google Meet or Teams in Phase 1 — Zoom only, expand in Phase 2

---

## Zoom API Surface

Four of the six distinct API layers are in scope for Vanta.

| API Layer | Vanta Relevance |
| :--- | :--- |
| **Meetings API** | Create, read participant lists, join/leave timestamps, chat logs, attendance duration. Relationship graph data. |
| **Recording + Transcript API** | Post-meeting VTT transcript and MP4. Primary signal source for Phase 1. |
| **Scheduler API** | Bookable schedules and calendar context. Powers pre-meeting intelligence briefings. |
| **Webhooks** | Full event surface: `meeting.started`, `meeting.ended`, `participant join/leave`, `recording.completed`, `transcript.completed`, `sharing events`. |
| **RTMS (Real-Time Media Streams)** | Live WebSocket stream of audio, transcript, and participant events. Phase 2 architecture. App approval takes 4–6 weeks. |
| **AI Companion APIs** | Zoom does not expose AI Companion outputs via API. Meeting summaries stay locked inside Zoom Hub. Not a dependency. |

---

## Technical Architecture

### Phase 1 — Post-Meeting (Weeks 1–6)

**Stack:** Recall.ai + Claude + Notion + Linq Blue (iMessage delivery)

Recall.ai is used instead of native Zoom Cloud Recording API for Phase 1. It eliminates the primary friction points of the native API: host-account requirements, paid plan dependency, manual settings enablement, and processing lag. Recall.ai returns a structured JSON transcript with speaker labels — significantly easier to process downstream than Zoom's VTT format.

| Step | What Happens |
| :--- | :--- |
| 1 | **Meeting ends** | Recall.ai bot (joined at meeting start) processes the recording |
| 2 | **Webhook fires** | Recall.ai sends structured JSON transcript to Vanta webhook endpoint |
| 3 | **Triage** | Claude Haiku evaluates each speaker turn for signal density (fast, cheap) |
| 4 | **Detection** | Claude Sonnet runs full signal evaluation on turns that pass triage |
| 5 | **Capture** | Detected signals written to Notion with speaker, timestamp, tags, insight, relevance note |
| 6 | **Delivery** | iMessage summary ping sent to user within 15 minutes of meeting end |
| 7 | **Dashboard** | Signals surface in Lovable feed alongside iMessage signals |

### Phase 2 — Live Detection (Month 2+)

**Stack:** Zoom RTMS (native) + Claude + Notion + Linq Blue

RTMS replaces Recall.ai once the Zoom General App is approved and RTMS is provisioned. The pipeline becomes live — signals are detected mid-meeting, not after. By the time the call ends, the intelligence report is already populated. No bot visible to attendees. Native Zoom integration.

**Prerequisite:** Zoom General App submission and approval (4–6 weeks). Begin submission in parallel with Phase 1 build.

---

## Signal Taxonomy — Meeting Extensions

The existing iMessage signal taxonomy is extended with four meeting-specific types:

| Tag | Definition |
| :--- | :--- |
| `quote` | Attributable statement worth preserving or publishing |
| `framework` | Mental model, decision heuristic, or structured thinking |
| `product_idea` | Feature, product, workflow, or platform concept |
| `positioning` | Market narrative or category framing language |
| `market_insight` | Observation about timing, behavior, or competitive structure |
| `provocation` | Challenge to conventional thinking worth sitting with |
| `content_seed` | Raw material for a post, essay, thread, or talk |
| `investment_lens` | Angle relevant to capital or platform thesis |
| `decision` ✦ | A choice made or agreed upon in the meeting |
| `action_item` ✦ | A commitment with an owner — explicit or implied |
| `commitment` ✦ | A promise made to another party in the meeting |
| `open_question` ✦ | A question raised but not resolved — requires follow-up |

*✦ Meeting-specific additions to the base taxonomy*

---

## Product Features

### Meeting Intake
- Connect Zoom account via OAuth (scopes: `recording:read`, `meeting:read`, `user:read`)
- Recall.ai bot auto-joins meetings from connected calendar
- Webhook listener processes transcript on meeting end

### Signal Processing
- Haiku triage pass on every speaker turn — filters noise before Sonnet sees it
- Sonnet full detection on turns that pass triage
- Speaker attribution preserved on every signal card
- Timestamp preserved — links back to moment in recording

### Pre-Meeting Intelligence (Scheduler API)
- Five minutes before a meeting, Vanta looks up attendees against signal history
- Surfaces relevant prior signals from iMessage threads or past meetings with those contacts
- Delivers a pre-meeting brief via iMessage: who is this person, what matters

### Post-Meeting Delivery
- iMessage summary ping within 15 minutes of meeting end
- Notion log entry per meeting with full structured signal breakdown
- Timestamped recording deep-links per signal card

### Dashboard (Lovable)
- Meeting cards in unified feed alongside iMessage signal cards
- Each card: meeting title, attendees, signal count by type, expandable detail
- Speaker attribution shown on every signal
- Click signal → jump to timestamp in recording
- Filter by meeting, speaker, signal type, date range

---

## Phased Delivery Plan

| Workstream | Phase 1 (Wk 1–6) | Phase 2 (Mo 2–3) | Phase 3 (Mo 4+) |
| :--- | :--- | :--- | :--- |
| **Transcript** | Recall.ai post-meeting JSON | RTMS live stream | RTMS + multi-platform |
| **Signal Pipeline** | Haiku + Sonnet, meeting tags | Live detection mid-meeting | Cross-meeting pattern analysis |
| **Delivery** | iMessage ping post-meeting | Real-time signal cards | Daily meeting intelligence digest |
| **Dashboard** | Meeting cards in Lovable feed | Live session view | Relationship graph view |
| **Pre-Meeting Prep** | Not in scope | Scheduler API briefing | Predictive agenda |
| **Relationship Graph Data** | Not in scope | Participant frequency scoring | Relationship health scoring |

---

## Open Questions

### Product
- Auto-join all meetings or user-selects per meeting?
- How do we handle meetings where the user is a participant, not the host?
- What is the right latency SLA for post-meeting processing?

### Engineering
- Confirm Recall.ai vs. native Zoom for Phase 1 — decision gates the entire build
- How do we handle meetings longer than 3 hours without degrading signal quality?
- Begin Zoom General App submission immediately — 4–6 week approval clock starts now

### Design
- How does the meeting card integrate with the iMessage signal feed in Lovable?
- What does the Zoom OAuth onboarding flow look like inside Vanta?
- Recording playback: embedded in dashboard or links out to Zoom?

---

## Risks

| Risk | Mitigation |
| :--- | :--- |
| **Zoom restricts third-party bot access** | Build toward RTMS (native) in Phase 2. Recall.ai is a bridge, not the destination. |
| **RTMS app approval delayed beyond 6 weeks** | Phase 1 Recall.ai architecture is production-viable. No hard dependency on RTMS timeline. |
| **AI Companion API remains closed** | Vanta's value is signal detection + portability. AI Companion staying closed is a positioning advantage, not a risk. |
| **Signal quality degradation on long meetings** | Implement chunking logic in the detection pipeline. Process in 30-minute windows. |
| **Recall.ai cost at scale** | Usage-based pricing. Monitor per-meeting cost. Migrate to native RTMS to reduce third-party dependency as volume grows. |

---

## Decisions Required

1.  **Recall.ai vs. native Zoom** — must be decided before engineering begins.
    - **Recommendation:** Recall.ai for Phase 1.
2.  **Submit Zoom General App now** — the 4–6 week approval clock is the longest lead time in the project. Begin immediately regardless of Phase 1 decision.
3.  **Signal taxonomy sign-off** — confirm the four meeting-specific tag additions before the detection prompt is written.
4.  **Auto-join vs. opt-in** — product call that affects both the Recall.ai configuration and the onboarding UX.

*Vanta · Zoom Meeting Intelligence PRD · v1.0 · March 2026 · Internal Draft*
