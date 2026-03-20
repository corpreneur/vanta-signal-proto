import type { Signal } from './signals';

/**
 * Static fallback data used when the database is empty.
 * Dates use relative offsets from "now" so they never go stale.
 */

const h = (hoursAgo: number) =>
  new Date(Date.now() - hoursAgo * 3_600_000).toISOString();

export const mockSignals: Signal[] = [
  {
    id: 'sig_001',
    signalType: 'INTRO',
    sender: 'Steve Stoute',
    summary:
      'Introduction to Kenji Nakamura, SVP Product at SoftBank Vision Fund. Steve positioned the intro as high priority for infrastructure partnership.',
    sourceMessage:
      'William meet Kenji. He runs product for SVF and is interested in what you guys are building on the intelligence layer.',
    priority: 'high',
    capturedAt: h(1),
    actionsTaken: ['BIO_RESEARCH', 'MEETING_PREP'],
    status: 'Captured',
    source: 'linq',
  },
  {
    id: 'sig_002',
    signalType: 'INSIGHT',
    sender: 'John Greene',
    summary:
      'Late-night thread on attention economics. Greene mapped Herbert Simon\'s scarcity framework to the current AI noise landscape — direct implications for Signal filtering UX.',
    sourceMessage:
      'The wealth of information creates a poverty of attention. Simon said it in 1971 and we still haven\'t solved it.',
    priority: 'high',
    capturedAt: h(3),
    actionsTaken: ['FRAMEWORK_EXTRACT', 'NOTION_LOG'],
    status: 'Captured',
    source: 'linq',
  },
  {
    id: 'sig_003',
    signalType: 'INVESTMENT',
    sender: 'Elena Ruiz',
    summary:
      'Series B term sheet comparison from Northstar vs. Foundry. Elena highlighted key differences in liquidation preferences and board composition that need legal review.',
    sourceMessage:
      'The Northstar sheet has a 2x participating preferred that differs from Foundry standard. Flagging for review.',
    priority: 'high',
    capturedAt: h(6),
    actionsTaken: ['THESIS_ANALYSIS', 'NOTION_LOG'],
    status: 'Captured',
    source: 'linq',
    riskLevel: 'critical',
    dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0],
  },
  {
    id: 'sig_004',
    signalType: 'DECISION',
    sender: 'Julian',
    summary:
      'Finalize GTM positioning for enterprise pilot. Julian flagged that the current pitch deck undersells the orchestration layer — needs reframe before Thursday partner call.',
    sourceMessage:
      'We need to decide: are we selling intelligence or infrastructure? The deck tries to do both and lands neither.',
    priority: 'high',
    capturedAt: h(5),
    actionsTaken: ['NOTION_LOG'],
    status: 'Captured',
    source: 'linq',
    riskLevel: 'high',
    dueDate: new Date(Date.now() + 86_400_000).toISOString().split('T')[0],
  },
  {
    id: 'sig_005',
    signalType: 'INTRO',
    sender: 'Marcus Webb',
    summary:
      'Warm intro to the CTO of Arcline Systems who is exploring AI infrastructure partnerships. Decision-maker mapping included.',
    sourceMessage:
      'William meet Raj. He runs infra for Arcline and is looking for exactly what Vanta is building.',
    priority: 'high',
    capturedAt: h(10),
    actionsTaken: ['BIO_RESEARCH', 'MEETING_PREP', 'EMAIL_DRAFT'],
    status: 'Captured',
    source: 'linq',
  },
  {
    id: 'sig_006',
    signalType: 'CONTEXT',
    sender: 'Marcus Webb',
    summary:
      'Background context on the Arcline Systems partnership discussion. Shared internal org chart and decision-maker mapping for the infrastructure team.',
    sourceMessage:
      'Here is the Arcline org structure. The CTO reports to a new COO who joined from Palantir last quarter. That context matters.',
    priority: 'low',
    capturedAt: h(9),
    actionsTaken: ['NOTION_LOG'],
    status: 'Captured',
    source: 'linq',
  },
  {
    id: 'sig_007',
    signalType: 'DECISION',
    sender: 'Stephen Chen',
    summary:
      'Telco flow diagram needed for discussion in the weekly status meeting. Team needs to review infrastructure dependencies before the partner demo.',
    sourceMessage:
      'Stephen needs to create a telco flow diagram by end of week for discussion in the weekly status meeting.',
    priority: 'high',
    capturedAt: h(24),
    actionsTaken: [],
    status: 'Captured',
    source: 'linq',
    riskLevel: 'high',
    dueDate: new Date(Date.now() + 86_400_000).toISOString().split('T')[0],
  },
  {
    id: 'sig_008',
    signalType: 'DECISION',
    sender: 'Mike Torres',
    summary:
      'Quarterly investor update draft needs final review before sending to 47 LPs on Friday. Financials and narrative need sign-off.',
    sourceMessage:
      'The Q1 update draft is ready for final eyes. Need sign-off on the ARR narrative and the market size framing before Friday send.',
    priority: 'high',
    capturedAt: h(30),
    actionsTaken: ['NOTION_LOG'],
    status: 'Captured',
    source: 'linq',
    riskLevel: 'medium',
    dueDate: new Date(Date.now() + 2 * 86_400_000).toISOString().split('T')[0],
  },
];
