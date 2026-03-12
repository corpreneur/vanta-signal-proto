import type { Signal } from './signals';

export const mockSignals: Signal[] = [
  {
    id: 'sig_001',
    signalType: 'INTRO',
    sender: 'Steve Stoute',
    summary:
      'Introduction to Kristina Windham, Head of Business Development at Maximum Effort. Steve framed William as CBO and "spirit animal." High-value BD contact being evaluated for partnerships team.',
    sourceMessage:
      'William pls meet Kristina Windham.. Kristina as discussed William is our Chief Business Officer and my spirit animal',
    priority: 'high',
    capturedAt: '2026-03-11T07:16:00Z',
    actionsTaken: ['BIO_RESEARCH', 'MEETING_PREP', 'EMAIL_DRAFT', 'AGENT_BUILD'],
    status: 'Complete',
    source: 'linq',
  },
  {
    id: 'sig_002',
    signalType: 'INSIGHT',
    sender: 'John Greene',
    summary:
      'Akio Morita product philosophy surfaced in late-night thread. Core insight: anticipation as product strategy, not customer feedback. Mapped to five abstraction layers.',
    sourceMessage:
      "We don't ask consumers what they want. They don't know. Instead we apply our brain power to what they need.",
    priority: 'high',
    capturedAt: '2026-03-10T23:41:00Z',
    actionsTaken: ['FRAMEWORK_EXTRACT', 'NOTION_LOG'],
    status: 'Complete',
    source: 'linq',
  },
  {
    id: 'sig_003',
    signalType: 'INVESTMENT',
    sender: 'John Greene',
    summary:
      'a16z 13-question investment framework shared. Vanta ran full thesis stress test against all 13 questions. Investment deck language generated.',
    sourceMessage:
      'As I dip out for my nightly deluge of dance/dinner drama, look at it this way.',
    priority: 'high',
    capturedAt: '2026-03-10T21:03:00Z',
    actionsTaken: ['THESIS_ANALYSIS', 'NOTION_LOG'],
    status: 'Complete',
    source: 'linq',
  },
  {
    id: 'sig_004',
    signalType: 'DECISION',
    sender: 'Julian',
    summary:
      'Strategic input requested on partner communication approach. Julian flagged misalignment between what was shared and what was communicated externally.',
    sourceMessage:
      'What we told them was clear IMO. And not representative of what they shared.',
    priority: 'medium',
    capturedAt: '2026-03-10T20:47:00Z',
    actionsTaken: ['NOTION_LOG'],
    status: 'Captured',
    source: 'linq',
  },
  {
    id: 'sig_005',
    signalType: 'INTRO',
    sender: 'Steve Stoute',
    summary:
      'Introduction to Marcus Thompson, Head of Strategy at Def Jam. Potential partnership discussion around artist intelligence infrastructure.',
    sourceMessage:
      'William meet Marcus Thompson. Marcus, William runs intelligence for us. You two should connect on the data side.',
    priority: 'high',
    capturedAt: '2026-03-09T14:22:00Z',
    actionsTaken: ['BIO_RESEARCH', 'MEETING_PREP', 'EMAIL_DRAFT', 'AGENT_BUILD'],
    status: 'Complete',
    source: 'linq',
  },
  {
    id: 'sig_006',
    signalType: 'CONTEXT',
    sender: 'John Greene',
    summary:
      'Follow-up context on the Morita thread. Additional reference to Clayton Christensen disruption framework as supporting evidence for anticipation model.',
    sourceMessage:
      'The Christensen angle maps here too. Disruption is not about better products, it is about better questions.',
    priority: 'low',
    capturedAt: '2026-03-09T08:15:00Z',
    actionsTaken: ['NOTION_LOG'],
    status: 'Complete',
    source: 'linq',
  },
  {
    id: 'sig_007',
    signalType: 'INVESTMENT',
    sender: 'Steve Stoute',
    summary:
      'Signal about potential Series A interest from a strategic investor. Mentioned conversation with NEA partner about Vanta positioning.',
    sourceMessage:
      'Had a good conversation with the NEA team yesterday. They are watching what we are building closely.',
    priority: 'high',
    capturedAt: '2026-03-08T16:30:00Z',
    actionsTaken: ['THESIS_ANALYSIS', 'NOTION_LOG'],
    status: 'In Progress',
    source: 'linq',
  },
  {
    id: 'sig_008',
    signalType: 'INSIGHT',
    sender: 'Julian',
    summary:
      'Product architecture insight. Julian identified a pattern in how the orchestration layer could be abstracted into a reusable primitive for third-party integrations.',
    sourceMessage:
      'If we abstract the orchestration router, every action pipeline becomes a plugin. That is the platform play.',
    priority: 'medium',
    capturedAt: '2026-03-08T11:05:00Z',
    actionsTaken: ['FRAMEWORK_EXTRACT', 'NOTION_LOG'],
    status: 'Complete',
    source: 'linq',
  },
];
