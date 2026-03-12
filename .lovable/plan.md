

# Add Left-Border Accent to Channels Group

Single change in `src/components/ProductSidebar.tsx`: Add a left border accent line to the Channels `SidebarGroup` container to visually separate it from adjacent groups.

### Change
- On the Channels `<SidebarGroup>`, add a `border-l-2 border-l-vanta-accent/20 ml-2 pl-1` (or similar subtle styling) so a thin vertical lime-tinted line runs along the left edge of the entire Channels block.
- Alternatively, apply it to the `<SidebarGroupLabel>` for the Channels section only, using `border-l-2 border-l-vanta-accent/30` to create a subtle accent without overwhelming the sidebar's monochrome hierarchy.

### Approach
Apply to the `SidebarGroupLabel` for Channels: add classes `border-l-2 border-l-vanta-accent/25 pl-2` alongside existing classes. This keeps the accent subtle (25% opacity lime) and only marks the Channels group header, creating a clean visual separator.

