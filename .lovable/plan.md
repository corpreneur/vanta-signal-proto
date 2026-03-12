

# UI Evolution Plan

## Current State

The app has grown into a substantial product with rich content, but the UI architecture hasn't kept pace:

- **Fragmented navigation**: The homepage uses a custom `Nav` + hamburger + `NavDrawer`. The product pages use a `ProductLayout` with a sidebar. Signals, Graph, Ontology, and PhoneFMC each have their own inline navbars with different link sets. There's no unified shell.
- **Two navigation paradigms**: Old pages (Index, Signals, Graph, PhoneFMC, Ontology) have a top-bar-only nav with a hamburger drawer. Product pages have a collapsible sidebar. Users moving between these experiences get a jarring context switch.
- **Duplicated nav markup**: Graph, PhoneFMC, and Ontology each hardcode their own `<nav>` with inconsistent link sets.
- **Homepage underweight**: The Index page shows case study cards and a hero, but doesn't surface the product section, signal stats, or the ontology. It feels disconnected from the depth that now exists.

## Proposed Evolution

### 1. Unify all pages under the ProductLayout sidebar

Every page (Index, Signals, Graph, PhoneFMC, Ontology, Product pages) should render inside `ProductLayout`. This gives a single, persistent navigation experience with the collapsible sidebar. The old `Nav`, `NavDrawer`, and `Overlay` components become obsolete for page-level navigation.

**Changes:**
- Wrap `Index`, `Signals`, `Graph`, `PhoneFMC`, and `Ontology` pages in `<ProductLayout>` and remove their inline `<nav>`, `<NavDrawer>`, and `<Overlay>` code.
- Add a "Cases" section to the `ProductSidebar` listing each case study.
- Remove the old `Nav` component usage from these pages.

### 2. Redesign the Homepage as a Dashboard

Transform Index from a case-card grid into a product dashboard that surfaces the depth of the system:

- **Signal pulse strip**: Live count of signals captured, high-priority count, pipeline status (pulled from the same query as Signals page).
- **Channel grid**: A compact 5-channel visual (iMessage, Phone, Zoom, Email, Calendar) linking to their product pages, with live signal counts per channel.
- **Recent signals**: Last 5 captured signals as a compact list, linking to the full feed.
- **Case studies** remain as a secondary section below.

### 3. Sidebar Enhancements

- Add an **active indicator** animation (a small lime dot) next to the current route.
- Add a **"Dashboard"** label for the Home link instead of generic "Home".
- Group the sidebar into three clear sections: **Dashboard** (top), **Product** (signal types), **Platform** (Signal Feed, Graph, Ontology, Phone FMC).

### 4. Page-level Polish

- **Signals page**: Remove its own Nav/NavDrawer/Overlay/footer. The sidebar handles navigation. Keep the header, stats strip, tag browser, filters, and feed.
- **Graph page**: Remove inline nav. Add the sidebar. Keep the graph visualization.
- **PhoneFMC page**: Remove inline nav. Add the sidebar. Keep the case study content.
- **Ontology page**: Remove inline nav. Add the sidebar. Keep the architecture content.

### 5. Cross-page Consistency

- All pages use `max-w-[960px] mx-auto` for content width (currently varies between 720px, 1200px, 4xl).
- All pages share the same sticky header bar from `ProductLayout` showing breadcrumb-style context (e.g., "Product > Native Phone" or "Platform > Signal Feed").

## Implementation Scope

```text
Files to modify:
  src/pages/Index.tsx          — Wrap in ProductLayout, add dashboard sections
  src/pages/Signals.tsx        — Wrap in ProductLayout, remove Nav/NavDrawer/Overlay
  src/pages/Graph.tsx          — Wrap in ProductLayout, remove inline nav
  src/pages/PhoneFMC.tsx       — Wrap in ProductLayout, remove inline nav
  src/pages/Ontology.tsx       — Wrap in ProductLayout, remove inline nav
  src/components/ProductSidebar.tsx — Add Dashboard label, Cases group
  src/components/ProductLayout.tsx  — Add breadcrumb context to header

Files potentially removable after migration:
  src/components/Nav.tsx        — No longer needed
  src/components/NavDrawer.tsx  — No longer needed
  src/components/Overlay.tsx    — No longer needed (sidebar handles its own)
```

## Execution Order

1. Update `ProductSidebar` with Dashboard label and Cases section
2. Update `ProductLayout` header with breadcrumb context
3. Migrate each page (Signals, Graph, PhoneFMC, Ontology) into ProductLayout
4. Redesign Index as a dashboard inside ProductLayout
5. Clean up unused Nav/NavDrawer/Overlay imports

This is approximately 5 implementation steps, each independently verifiable.

