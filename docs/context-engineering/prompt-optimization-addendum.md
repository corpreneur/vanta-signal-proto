# Context Engineering — Prompt Optimization Addendum

> Addendum to prompt-optimization.md

## The Dumb Zone

The model's effective accuracy degrades as the context window fills. Empirical data from 100,000+ developer sessions identifies the degradation threshold at approximately 40% context fill [1]. This is not a sharp cliff...it is a curve that begins well before the window is technically full.

```
Output Quality
100% ████████████
     ████████
 80% ████
     ████
 60% ████
     ████
 40% ████████████████
                    ▲ DUMB ZONE begins here
      0%   20%   40%   60%   80%   Context Fill
```

**Rule:** Keep active context below 40% fill before submitting any implementation prompt. If prior conversation has accumulated past this threshold, compact it before continuing.

**Note on degradation curves:** Internal research frames this as "context rot"...a continuous degradation, not a binary state [2]. The 40% threshold is a practical operating heuristic. The actual curve varies by model, task complexity, and context quality. Treat 40% as a hard ceiling, not a comfortable target.

## Intentional Compaction

When a session exceeds the Dumb Zone threshold, do not continue. Compact the context.

### Compaction Protocol

1. Ask the model to produce a `SESSION_SUMMARY.md` covering:
   - What was built in this session
   - Current state of the codebase (what works, what is incomplete, what is broken)
   - Every file touched, with path and summary of changes
   - Open decisions or unresolved questions
   - Next logical implementation step
2. Open a new session.
3. Inject only:
   - System instructions (CLAUDE.md or equivalent)
   - SESSION_SUMMARY.md
   - The specific files relevant to the next task
4. Do not paste raw prior conversation. The summary is the context.

**Why this works:** LLMs activate understanding from compressed representations as effectively as from raw content. A well-structured 400-token summary recovers more usable context than 4,000 tokens of conversation history that has drifted through scope changes, exploratory tangents, and abandoned approaches.

## The RPI Workflow

Research, Plan, Implement. Each phase is a separate context operation with a human review gate before the next phase opens.

| Phase | Details |
|---|---|
| **RESEARCH** | Objective: understand the codebase. No changes. Output: `research.md` — relevant files, patterns, constraints. Human gate: read and approve before proceeding. |
| **PLAN** | Input: research.md only. Objective: step-by-step implementation outline. Output: `plan.md` — ordered steps with file paths, line refs. Human gate: read and approve before proceeding. |
| **IMPLEMENT** | Input: plan.md only. Objective: execute the plan exactly. Constraint: no scope deviation without stopping and flagging. Full tool suite active: Read, Edit, Write, MultiEdit. |

The human review gates are not optional. They are what separates context engineering from vibe coding. The plan is a human-readable artifact, not just AI scaffolding. If the Research output reveals a misunderstanding of the codebase, catch it at the gate...not after 200 lines of code have been written against a false premise.

## Context Quality vs. Context Size

Most practitioners manage context by size (token count). The more useful discipline is managing context by **signal density**.

### High-signal context:
- Explicit file paths with relevant line ranges
- Data model definitions (schema, interfaces)
- Component contracts (props, return types, side effects)
- Architectural constraints and patterns already in the codebase
- Acceptance criteria written as testable conditions

### Low-signal context (compact or remove before submitting):
- Exploratory conversation from prior turns
- Rejected approaches and abandoned implementations
- Verbose error logs without resolution
- Repeated instructions already established in system context
- Full file contents when only a function or interface is relevant

**Target:** The smallest set of high-signal tokens that gives the model a complete and accurate picture of the task. Anything beyond that is degrading output quality, not improving it.

## Session Handoff Protocol

At the end of every meaningful coding session, commit a `CONTEXT.md` to the repo before closing. This is the boundary artifact between sessions.

### CONTEXT.md Structure

```markdown
# Session Context
Date: YYYY-MM-DD
Session focus: [1 sentence]

## State
What works: [list]
What is in progress: [list]
What is broken: [list]

## Files modified this session
- path/to/file.tsx — [what changed]
- path/to/schema.sql — [what changed]

## Open decisions
- [decision pending, options considered]

## Next session start point
[Exactly what to do first in the next session, with file path and function name]
```

This file is the primary input for the Research phase of the next session. It prevents context rot from compounding across sessions and creates a human-readable audit trail of the build.

## Harness Configuration Surfaces

Effective harness engineering requires careful management of six primary configuration surfaces to keep the agent out of the Dumb Zone [3].

### 1. Agentfiles (`CLAUDE.md` / `AGENTS.md`)
These markdown files are deterministically injected into the agent's system prompt. Research indicates that LLM-generated agentfiles often degrade performance by introducing excessive conditional rules and irrelevant context. Best practices dictate that agentfiles should be concise (under 60 lines), universally applicable, and rely on progressive disclosure rather than front-loading instructions.

### 2. MCP Servers and Tools
Connecting too many Model Context Protocol (MCP) servers inflates the context window with irrelevant tool descriptions, rapidly pushing the agent into the Dumb Zone. Every tool description consumes a portion of the agent's instruction budget. If a Command Line Interface (CLI) for a tool already exists in the model's training data (e.g., Git, Docker), the agent should be prompted to use the CLI rather than a custom MCP server, as CLIs offer greater context efficiency and composability.

### 3. Skills for Reusable Knowledge
Skills enable progressive disclosure by providing the agent with specific instructions, knowledge, or tools only when necessary. When a skill is activated, its `SKILL.md` file is loaded into the context window as a user message. This prevents the system prompt from being overwhelmed by instructions for edge cases.

### 4. Sub-Agents for Context Control
Sub-agents act as context firewalls, encapsulating complex tasks so that intermediate noise (such as file reads and search results) does not pollute the primary agent's context window. The parent agent sees only the prompt it issues and the highly condensed final result. This isolation is critical for maintaining coherency across long sessions and mitigating the effects of context rot.

### 5. Hooks for Control Flow
Hooks are user-defined scripts that execute automatically at specific points in the agent's lifecycle. They provide deterministic control flow for tasks such as notifications, approvals, and integrations. For example, a hook can automatically run a type-checker when the agent pauses; if the check passes, the hook remains silent, but if it fails, the hook surfaces the errors and forces the agent to resolve them before proceeding.

### 6. Back-Pressure for Verification
The likelihood of an agent successfully completing a task is strongly correlated with its ability to verify its own work through back-pressure mechanisms. These mechanisms...such as unit tests, type-checks, and UI automation...must be context-efficient. A critical rule for back-pressure is that success is silent, and only failures produce verbose output. Flooding the context window with thousands of lines of passing test results will cause the agent to lose focus and hallucinate.

## Anti-Patterns

| Anti-Pattern | What Happens | Correction |
|---|---|---|
| Continuing past 40% context fill | Output quality degrades silently | Compact before continuing |
| Combining Research, Plan, and Implement in one pass | No human gate; errors compound | Use separate phases with gates |
| Pasting full files when only a function is relevant | Crowds out signal with noise | Reference file:line range only |
| No session handoff artifact | Next session starts blind | CONTEXT.md before closing |
| Asking AI to self-assess its own context quality | Model cannot reliably detect its own degradation | Human monitors the threshold |
| Treating the plan as AI scaffolding | Skips the review that catches premise errors | Treat plan.md as a human deliverable |

## Related Skills

- Context Engineering Discipline — standalone reference covering SPR, multi-agent partitioning, and harness patterns
- Evaluation Frameworks — measuring output quality across sessions
- Fine-Tuning Expert — when context engineering hits architectural limits

## References

[1] HumanLayer. (2025). *12-Factor Agents - Principles for building reliable LLM applications*. GitHub. https://github.com/humanlayer/12-factor-agents
[2] Anthropic. (2025, November 26). *Effective harnesses for long-running agents*. Engineering at Anthropic. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
[3] Kyle. (2026, March 12). *Skill Issue: Harness Engineering for Coding Agents*. HumanLayer Blog. https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents
