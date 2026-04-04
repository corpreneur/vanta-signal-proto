

# Plan: Vanta Zoom Product Concept Page

## What We're Building

A dedicated product concept page at `/product/zoom` that articulates the vision for Vanta's native Zoom meeting experience, built on the Zoom Video SDK (iOS). This follows the existing `ProductSignalPage` pattern used for iMessage, Phone, Email, Calendar, etc. -- and gets wired into the sidebar under the existing "Platform" or "Channels" nav groups.

## Why Video SDK, Not Meeting SDK

The Zoom Video SDK is fundamentally different from the standard Zoom client integration:
- **Session-based** (not meeting-based) -- no Zoom account required for participants
- **Full UI control** -- Vanta owns the entire video experience, no Zoom chrome
- **Raw data access** -- direct audio/video streams for real-time AI processing
- **RTMS built-in** -- live transcription, speaker diarization, command channel
- **Up to 5,000 participants** per session
- **iOS native** via Swift/Obj-C with Metal renderer support

This means Vanta can build a fully branded, intelligence-first meeting experience where signal capture is architectural, not bolted on.

## Implementation Steps

### 1. Add "zoom-sdk" product definition to `ProductSignalPage.tsx`

Add a new entry to the `PRODUCTS` record with key `"zoom-sdk"`:

- **type**: `MEETING`
- **label**: "Vanta Zoom"
- **icon**: `Video`
- **tagline**: "Your meetings, your intelligence layer... a fully native Zoom experience inside Vanta."
- **channels**: `["Zoom Video SDK (iOS)", "RTMS Live Transcription", "Command Channel"]`
- **narrative**: 3 paragraphs covering:
  - Why a native SDK integration matters vs. just joining Zoom links
  - Session-based architecture: no Zoom accounts needed for guests, Vanta owns the UI
  - Real-time intelligence: RTMS streams feed live transcription into the signal pipeline, signals are detected during the call not after
- **howItWorks**: 5 steps:
  1. Session Creation -- Vanta backend generates a Video SDK JWT and creates a session
  2. Native Launch -- iOS app joins the session via Zoom Video SDK with custom Vanta UI
  3. RTMS Stream -- Live audio/video routed through RTMS for real-time transcription with speaker attribution
  4. Live Signal Detection -- Transcript chunks classified in real-time: decisions, commitments, action items surfaced during the call
  5. Post-Session Intelligence -- Full transcript processed through deep analysis pipeline, meeting artifact stored with signals linked to attendee profiles
- **signalExamples**: 3 examples showing live in-call signal detection
- **whyItMatters**: Quote about owning the video layer = owning the intelligence layer

### 2. Add route entry

The existing route `<Route path="product/:signalType" element={<ProductSignalPage />} />` already handles dynamic product pages. The key `"zoom-sdk"` will resolve automatically at `/product/zoom-sdk`.

### 3. Add sidebar navigation entry

Add `{ title: "Vanta Zoom", url: "/product/zoom-sdk", icon: Video }` to the `channelItems` or `platformItems` array in `ProductSidebar.tsx`. Place it alongside the existing Zoom entry or replace it, since this represents the evolved product concept.

### 4. Add iOS-specific feature callouts

Extend the product definition with additional detail about iOS Video SDK capabilities:
- HD video with virtual backgrounds
- Multiple camera support
- Screen sharing with annotation
- Whiteboard collaboration
- Cloud recording
- Live streaming via RTMP
- Apple Metal renderer for optimized iOS performance
- Apple Vision Pro support (visionOS)

These will render naturally through the existing `howItWorks` and `signalExamples` sections.

## Technical Notes

- No new files needed -- this extends the existing `PRODUCTS` record in `ProductSignalPage.tsx` and adds a nav link in `ProductSidebar.tsx`
- The `MEETING` signal type already has color tokens defined in `SIGNAL_TYPE_COLORS`
- The page follows the exact same rendering pattern as all other product concept pages (narrative, how-it-works steps, signal examples, why-it-matters quote)
- iOS-only positioning is captured in the narrative and channels, not as a separate UI element

