export type SignalType = 'INTRO' | 'INSIGHT' | 'INVESTMENT' | 'DECISION' | 'CONTEXT' | 'NOISE' | 'MEETING' | 'PHONE_CALL';
export type SignalPriority = 'high' | 'medium' | 'low';
export type SignalStatus = 'Captured' | 'In Progress' | 'Complete';
export type SignalSource = 'linq' | 'gmail' | 'manual' | 'recall' | 'phone';

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
    text: 'text-vanta-accent-teal',
    bg: 'bg-vanta-accent-teal-faint',
    border: 'border-vanta-accent-teal-border',
  },
  INVESTMENT: {
    text: 'text-vanta-accent-amber',
    bg: 'bg-vanta-accent-amber-faint',
    border: 'border-vanta-accent-amber-border',
  },
  DECISION: {
    text: 'text-vanta-accent-violet',
    bg: 'bg-vanta-accent-violet-faint',
    border: 'border-vanta-accent-violet-border',
  },
  CONTEXT: {
    text: 'text-vanta-text-low',
    bg: 'bg-vanta-bg-elevated',
    border: 'border-vanta-border',
  },
  NOISE: {
    text: 'text-vanta-text-muted',
    bg: 'bg-vanta-bg-elevated',
    border: 'border-vanta-border',
  },
  MEETING: {
    text: 'text-vanta-accent-zoom',
    bg: 'bg-vanta-accent-zoom-faint',
    border: 'border-vanta-accent-zoom-border',
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
