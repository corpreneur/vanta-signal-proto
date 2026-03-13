

# Add Classification Audit Tab to Settings

## Changes

### 1. `src/pages/Settings.tsx`
- Import `ClassificationAudit` component
- Add `audit` to `TAB_MAP`
- Add a new `TabsTrigger` with `ShieldCheck` icon labeled "Classification Audit"
- Add a new `TabsContent` rendering `<ClassificationAudit />`

### 2. `src/pages/ClassificationAudit.tsx`
- Remove the outer wrapper `div` with `max-w-6xl mx-auto px-4 py-8` and header section (icon + title + description) so it embeds cleanly inside the Settings tab container, similar to how NoiseQueue and UserModes were adapted

### 3. `src/App.tsx`
- Change `/audit` route to redirect to `/settings?tab=audit` (same pattern as noise-queue and user-modes)
- Remove the direct `ClassificationAudit` import if no longer needed standalone

### 4. `src/components/ProductSidebar.tsx`
- Remove "Classification Audit" from sidebar nav if present (consolidating into Settings)

All data fetching and inline-edit logic in ClassificationAudit stays unchanged -- only the outer chrome is removed so it nests inside the Settings tab layout.

