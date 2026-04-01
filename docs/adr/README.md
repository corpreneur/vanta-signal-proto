# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for significant technical decisions in this project.

## What is an ADR?

An ADR captures a single architectural decision along with its context, rationale, and consequences. ADRs serve as **executable constraints for AI agents** — they tell agents WHY decisions were made and WHAT NOT to change.

## Adding New ADRs

1. Create a new file: `NNNN-short-title.md` (increment the number)
2. Use the template in `0000-adr-template.md`
3. Set status to `Proposed`
4. After team review, update status to `Accepted`

## Status Values

| Status | Meaning |
|--------|---------|
| **Proposed** | Under consideration — not yet binding |
| **Accepted** | Mandatory requirement — agents and humans must follow |
| **Deprecated** | No longer applies — do not follow |
| **Superseded** | Replaced by a newer ADR (link to it) |

## For AI Agents

Before proposing architectural changes, check existing ADRs. An accepted ADR is a constraint you must not violate. If you believe an ADR should change, propose a new ADR that supersedes it — do not silently contradict it.
