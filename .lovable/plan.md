

## Add Otter.ai and Fireflies.ai to Connected Accounts

The SVG logos already exist in `src/components/PartnerLogos.tsx`. They just need integration entries in the `INITIAL_INTEGRATIONS` array in `src/pages/ConnectedAccounts.tsx`.

### Changes

**File: `src/pages/ConnectedAccounts.tsx`**

Add two new entries to the `INITIAL_INTEGRATIONS` array:

- **Fireflies.ai** — `id: "fireflies"`, description about AI meeting transcription and the dedicated webhook endpoint, initially disconnected
- **Otter.ai** — `id: "otter"`, description about real-time meeting transcription and notes, initially disconnected

Both IDs match the keys already in the `PARTNER_LOGOS` map, so the logos will render automatically.

