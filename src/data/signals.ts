export type SignalType = 'INTRO' | 'INSIGHT' | 'INVESTMENT' | 'DECISION' | 'CONTEXT' | 'NOISE' | 'MEETING' | 'PHONE_CALL';
export type SignalPriority = 'high' | 'medium' | 'low';
export type SignalStatus = 'Captured' | 'In Progress' | 'Complete';
export type SignalSource = 'linq' | 'gmail' | 'manual' | 'recall' | 'phone';
export type SignalRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Signal {
  id: string;
  signalType: SignalType;
  sender: string;
  summary: string;
  sourceMessage: string;
  priority: SignalPriority;
  capturedAt: string; // ISO 8601
  actionsTaken: string[];
  status: SignalStatus;
  source: SignalSource;
  rawPayload?: Record<string, unknown> | null;
  linqMessageId?: string | null;
  emailMetadata?: {
    subject?: string;
    from?: string;
    to?: string;
    cc?: string;
    thread_id?: string;
    date?: string;
  } | null;
  meetingId?: string | null;
  riskLevel?: SignalRiskLevel | null;
  dueDate?: string | null; // ISO date string
  callPointer?: string | null;
  pinned?: boolean;
}

export interface MeetingArtifact {
  id: string;
  signalId: string;
  createdAt: string;
  transcriptJson?: Record<string, unknown>[] | null;
  summaryText?: string | null;
  recordingUrl?: string | null;
  attendees?: Record<string, unknown>[] | null;
}

export const SIGNAL_TYPE_COLORS: Record<SignalType, { text: string; bg: string; border: string }> = {
  INTRO: {
    text: 'text-vanta-accent',
    bg: 'bg-vanta-accent-faint',
    border: 'border-vanta-accent-border',
  },
  INSIGHT: {
    text: 'text-vanta-signal-blue',
    bg: 'bg-vanta-signal-blue-faint',
    border: 'border-vanta-signal-blue-border',
  },
  INVESTMENT: {
    text: 'text-vanta-signal-yellow',
    bg: 'bg-vanta-signal-yellow-faint',
    border: 'border-vanta-signal-yellow-border',
  },
  DECISION: {
    text: 'text-vanta-signal-yellow',
    bg: 'bg-vanta-signal-yellow-faint',
    border: 'border-vanta-signal-yellow-border',
  },
  CONTEXT: {
    text: 'text-vanta-text-low',
    bg: 'bg-vanta-bg-elevated',
    border: 'border-vanta-border',
  },
  NOISE: {
    text: 'text-vanta-text-low',
    bg: 'bg-vanta-accent-faint',
    border: 'border-vanta-accent-border',
  },
  MEETING: {
    text: 'text-vanta-signal-blue',
    bg: 'bg-vanta-signal-blue-faint',
    border: 'border-vanta-signal-blue-border',
  },
  PHONE_CALL: {
    text: 'text-vanta-accent-phone',
    bg: 'bg-vanta-accent-phone-faint',
    border: 'border-vanta-accent-phone-border',
  },
};

export const PHONE_CALL_TAGS = ['commitment', 'decision', 'open_question', 'relationship_signal', 'deal_signal'] as const;
export type PhoneCallTag = typeof PHONE_CALL_TAGS[number];

export const PHONE_TAG_LABELS: Record<PhoneCallTag, string> = {
  commitment: 'Commitment',
  decision: 'Decision',
  open_question: 'Open Question',
  relationship_signal: 'Relationship',
  deal_signal: 'Deal Signal',
};
