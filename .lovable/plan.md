

# Merge Executive Briefs into a Single PDF

## What we're building

A unified 8–9 page Executive Brief PDF that uses **Doc 2's structured framework** (TOC, exec summary, architecture, strategy, roadmap) as the backbone, enriched with **Doc 1's editorial feature narratives** for v2.0 and v2.1. The result replaces `public/Vanta_Signal_Executive_Brief.pdf`.

## Document structure

```text
Page 1  — Cover (merged stats: 21 releases, 60+ features, 12 edge fns, 16 tables)
Page 2  — Executive Summary (Doc 2's Key Outcomes table + Doc 1's 5 Key Milestones)
Page 3  — Sprint Velocity & Delivery (Doc 2's full release timeline table)
Page 4  — v2.1 Feature Narrative (Doc 1's editorial: Signal Brief, Context Layer, Delivery Prefs)
Page 5  — v2.0 Feature Narrative (Doc 1's editorial: Speaker Memory, Meeting Intelligence)
Page 6  — Architecture & Infrastructure (Doc 2's 16-table + 12-function inventory)
Page 7  — Strategic Positioning (Doc 2's competitive differentiation + platform moat)
Page 8  — Next Horizons: PI-2 Roadmap (Doc 2's themes + success metrics)
```

## Design

Vanta B/W style consistent with existing briefs: black text on white, clean tables with light gray borders, monospace headers, "CONFIDENTIAL" footer with page numbers.

## Technical approach

1. Write a Python/reportlab script to `/tmp/gen_merged_brief.py`
2. Generate the PDF to `/mnt/documents/Vanta_Signal_Executive_Brief.pdf`
3. QA via `pdftoppm` — inspect every page for layout issues
4. Copy final PDF to `public/Vanta_Signal_Executive_Brief.pdf`

The existing in-app download link on the Release Notes page already points to this file, so no UI changes needed.

