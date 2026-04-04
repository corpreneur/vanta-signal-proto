

## Sidebar cleanup: Product Concepts + Platform reorganization

### Current state

```text
Product Concepts (7 flat items)
  Meeting Intelligence, Zoom Demo, Vanta Zoom, Phone FMC Demo, Smart Embed,
  Smart Contacts, Relationship Graph

Platform (10 flat items)
  Context Layer, Noise Filter, Ontology, Architecture,
  iMessage, Phone, Phone FMC, Zoom, Email, Calendar

channelItems[] — defined but NEVER RENDERED
```

Problems: duplicate channel links, no sub-grouping, `channelItems` is dead code, architecture docs mixed with channel sources.

### Proposed structure

```text
Product Concepts
  ├─ Meetings & Calls
  │    Meeting Intelligence, Zoom Demo, Vanta Zoom, Phone FMC Demo, Smart Embed
  └─ People
       Smart Contacts, Relationship Graph

Channels (replaces the orphaned channelItems + Platform channel dupes)
     iMessage, Phone, Zoom, Email, Calendar

Platform (trimmed to architecture/processing only)
     Context Layer, Noise Filter, Ontology, Phone FMC (case study), Architecture
```

### Changes — single file: `src/components/ProductSidebar.tsx`

1. **Delete `channelItems`** array (dead code) and **remove channel entries from `platformItems`** (iMessage, Phone, Zoom, Email, Calendar).

2. **Add a new "Channels" collapsible group** using the existing channel data (iMessage, Phone, Zoom, Email, Calendar). Render it between Product Concepts and Platform.

3. **Keep `platformItems` as architecture-only**: Context Layer, Noise Filter, Ontology, Phone FMC (case study), Architecture.

4. **Split `productItems` into visual sub-labels** inside the collapsible — add a tiny "Meetings & Calls" and "People" label within the menu (similar to how Fab Five has its accent label). No new collapsible nesting, just inline section labels for scannability.

5. **No route or page changes** — only sidebar navigation arrays and rendering.

### Result

- 3 clean collapsible groups instead of 2 bloated ones
- Zero duplicate links
- Dead code removed
- Channel sources get their own scannable section
- Platform becomes a focused architecture/docs section

