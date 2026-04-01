# ADR-0001: Supabase as default backend

## Status

Accepted

## Date

2026-03-30

## Context

The portfolio (DotCo Studio, Vanta Signal, Signal OS, SoloLab, SkillGraph, IdeaNeXus) needs a consistent backend across all projects for auth, database, storage, and edge functions. Managing separate infrastructure per project creates drift and maintenance burden.

## Decision

Use Supabase (via Lovable Cloud) as the default backend for all projects. All data models must have row-level security (RLS) enabled from the start. Auth, storage, and serverless functions route through Supabase.

## Consequences

- Consistent auth and RLS patterns across all projects
- Edge functions handle server-side logic (payments, emails, AI calls)
- Vendor lock-in to Supabase/PostgreSQL (acceptable given ecosystem maturity)
- All API calls routed through dedicated service files, never inline in components

## Alternatives Considered

- **Firebase**: Rejected — NoSQL model doesn't fit relational data needs, weaker RLS story
- **Custom Node.js backend**: Rejected — too much infrastructure overhead for the team size
- **Serverless-only (AWS Lambda)**: Rejected — no integrated auth/storage, higher operational complexity
