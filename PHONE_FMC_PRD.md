# Vanta Product Requirements Document: Native Phone + Fixed Mobile Convergence

**Version 1.0 · March 2026 · Draft for Internal Alignment**

---

## Strategic Position

Most Connectivity OS products are software layers sitting on top of someone else's pipe. Vanta is the pipe. The combination of an operational MVNO and Amdocs ConnectX as the BSS/OSS foundation changes the nature of this product entirely. Vanta doesn't integrate with telephony infrastructure — it owns it. That distinction is the moat.

This PRD defines how Vanta extends its native infrastructure to deliver Fixed Mobile Convergence as a first-party product feature, and how the phone call — the highest-density, most systematically ignored communication channel in a creative entrepreneur's day — becomes a primary source of captured signal.

## Problem Statement

The creative entrepreneur makes and receives calls all day. Client conversations, partner calls, investor discussions, deal negotiations, coaching sessions. Every one of these generates frameworks, decisions, commitments, and insights that have real commercial and intellectual value.

Almost none of it is captured. Notes are partial. Memory degrades. Follow-through is inconsistent. The conventional answer is an app — but apps require behavioral change, create friction, and are forgotten under pressure.

The right answer is infrastructure that captures at the network level, requiring zero behavioral change from the user. When Vanta owns the SIM and the call routing, that becomes possible.

---

## What Vanta Already Has

Vanta is a licensed MVNO operating on Amdocs ConnectX — a cloud-native, AI-capable BSS/OSS platform built on AWS and TM Forum Open APIs. This is not a vendor integration. It is owned infrastructure.

| ConnectX Capability | Vanta Relevance |
| :--- | :--- |
| **Subscriber Management** | Full SIM and eSIM provisioning — Vanta controls the subscriber record |
| **Service Provisioning + Activation** | Every number assigned by Vanta is a fully managed network endpoint |
| **Online Charging System** | Real-time usage tracking across voice, data, and SMS |
| **Call Detail Records (CDRs)** | Every call — originating number, destination, duration, timestamp — is a Vanta-owned data event |
| **TM Forum Open APIs** | Build proprietary functionality directly on top without platform customization |
| **eSIM Management** | Vanta can provision subscribers without a physical SIM card — frictionless onboarding |
| **AI-Native Architecture** | ConnectX supports generative AI and agentic AI natively at the platform level |

---

## FMC Architecture — How It Works

Fixed Mobile Convergence, in Vanta's context, means: a creative entrepreneur uses their smartphone's native dialer for all business calls. No app. No VoIP client. No behavioral change. Vanta's network handles call routing, recording, and intelligence capture invisibly at the infrastructure layer.

### The Flow

| Step | What Happens |
| :--- | :--- |
| 1 | **Onboarding** | User is provisioned a Vanta SIM or eSIM via ConnectX. Their number is registered as a native endpoint on Vanta's network. |
| 2 | **Call placed or received** | User calls from their native iPhone or Android dialer — no Vanta app involved. The call transits Vanta's network. |
| 3 | **CDR generated** | ConnectX records the call event: parties, duration, timestamp. This is the trigger for signal processing. |
| 4 | **Audio capture** | Call audio is routed through Vanta's recording layer at the SIP level. Transcript is generated via Whisper or equivalent. |
| 5 | **Signal detection** | Transcript is passed through the two-stage pipeline: Haiku triage, Sonnet detection. Signal is extracted, tagged, and scored. |
| 6 | **Capture** | Detected signals written to Notion with speaker attribution, call timestamp, tags, extracted insight, and relevance note. |
| 7 | **Delivery** | iMessage summary ping sent to user within 10 minutes of call end. |
| 8 | **Dashboard** | Signals surface in the Lovable feed alongside iMessage and Zoom signals — unified intelligence layer across all channels. |

### Critical Technical Question

ConnectX owns the subscriber record and CDR. The open question for engineering is where audio interception happens.

- **Option A — Native ConnectX audio access:** If ConnectX exposes a real-time audio stream or webhook on call events natively via its TM Forum Open APIs, the recording and transcription layer can be built entirely within Vanta's infrastructure. No additional vendors. Fully proprietary.
- **Option B — SIP-level interception:** If native audio access is not available through ConnectX, Vanta inserts a recording layer at the SIP interface between ConnectX and the carrier interconnect. This is standard practice and adds one infrastructure component, not a vendor dependency.

Engineering must answer this before Phase 1 architecture is finalized. The answer determines whether the moat is absolute or has one seam.

---

## Why Native FMC Beats Every Alternative

| Approach | Why Vanta's Native FMC Wins |
| :--- | :--- |
| **Zoom Phone FMC** | Zoom-controlled infrastructure. AI Companion outputs locked in Zoom Hub, not API-accessible. User is on Zoom's platform, not Vanta's. |
| **Recall.ai / Bot-based** | Works for Zoom meetings. Does not work for phone calls. Requires a meeting context. Cannot intercept native dialer calls. |
| **Tango Networks / Third-party MVNE** | Vanta already owns what Tango provides. Adding this layer introduces cost and dependency Vanta doesn't need. |
| **App-based VoIP (RingCentral, etc.)** | Requires user to change calling behavior. Adoption fails under pressure. Misses calls made from the native dialer. |
| **Vanta Native FMC** | Invisible to the user. No behavior change. Captures every call. Intelligence is fully proprietary. Moat compounds with scale. |

---

## Signal Taxonomy — Phone Call Extensions

The existing taxonomy (quote, framework, product_idea, positioning, market_insight, provocation, content_seed, investment_lens) is extended with phone-specific types:

| Tag | Definition |
| :--- | :--- |
| `commitment` ✦ | A promise made or received during the call — explicit or implied |
| `decision` ✦ | A choice made or agreed upon during the conversation |
| `open_question` ✦ | An unresolved question that requires follow-up |
| `relationship_signal` ✦ | A data point about the nature or health of this relationship — tone, access, trust level, urgency |
| `deal_signal` ✦ | Language, terms, or indicators relevant to a commercial outcome |

*✦ Phone-specific additions. Relationship and deal signals are unique to call context — they do not surface naturally in text or meeting transcripts.*

---

## Phased Delivery Plan

| Workstream | Phase 1 (Wk 1–4) | Phase 2 (Mo 2–3) | Phase 3 (Mo 4+) |
| :--- | :--- | :--- | :--- |
| **SIM Provisioning** | eSIM onboarding via ConnectX for pilot users | Full SIM + eSIM self-serve flow | Scale to full subscriber base |
| **Call Capture** | CDR + SIP-level recording layer | Real-time audio stream if ConnectX native | Multi-device, multi-number support |
| **Transcription** | Whisper or equivalent post-call | Lower-latency pipeline | Speaker diarization across contacts |
| **Signal Detection** | Haiku triage + Sonnet, phone taxonomy | Live signal cards during call | Cross-call pattern analysis |
| **Delivery** | iMessage ping post-call within 10 min | Real-time call summary | Daily intelligence digest across all channels |
| **Dashboard** | Phone signal cards in Lovable feed | Relationship graph view | Deal tracking and commitment follow-up |

---

## Second-Order: The Relationship Graph

Every phone call Vanta captures is a data point in a relationship network. Who you called. How long you talked. How often. The CDR is natively structured for graph analysis.

- **Contact frequency** — surface contacts you haven't spoken to in 30+ days
- **Call depth** — duration as a proxy for relationship intensity and deal progression
- **Network adjacency** — who talks to whom, and what signals surface in those conversations
- **Commitment tracking** — open commitments made in calls, surfaced until marked resolved

This is not a feature that can be bolted onto a third-party telephony integration. It requires owning the CDR. Vanta owns it.

---

## Decisions Required

1.  **Engineering audit of ConnectX audio access** — does the platform natively expose a real-time audio stream or call event webhook? Answer gates Phase 1 architecture.
2.  **Pilot cohort definition** — which users or team members get Vanta SIMs first? Recommendation: internal team, then 5–10 high-trust creative entrepreneur users.
3.  **Consent and disclosure framework** — users must understand calls are recorded and processed for intelligence. Define the disclosure language and opt-in/opt-out mechanics before any pilot.
4.  **Transcription vendor** — Whisper (self-hosted), Deepgram, or AssemblyAI for Phase 1? Evaluate on latency, accuracy on phone-quality audio, and cost per minute at scale.
5.  **Signal taxonomy sign-off** — confirm the five phone-specific tag additions before the detection prompt is written.

---

## Risks

| Risk | Mitigation |
| :--- | :--- |
| **ConnectX does not expose native audio stream** | SIP-level interception is standard practice and fully viable. Adds one infrastructure component, not a blocker. |
| **Call recording consent and compliance** | Two-party consent in some U.S. states (CA, IL, FL, others). Define disclosure framework before pilot. Legal review required. |
| **Audio quality on mobile networks degrades transcription** | Evaluate transcription vendors on phone-quality audio specifically, not lab conditions. Whisper performs well on degraded audio. |
| **User adoption resistance to SIM swap** | eSIM eliminates physical friction entirely. Position as a connectivity upgrade, not a behavioral ask. |
| **Signal quality on short or personal calls** | Haiku triage handles this. Low-signal calls are silently logged, not surfaced. No noise in the feed. |

*Vanta · Native Phone + FMC PRD · v1.0 · March 2026 · Internal Draft*
