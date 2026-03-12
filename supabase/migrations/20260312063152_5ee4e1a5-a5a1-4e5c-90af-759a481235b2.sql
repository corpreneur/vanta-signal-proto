
-- Add 'recall' to signal_source enum
ALTER TYPE signal_source ADD VALUE IF NOT EXISTS 'recall';

-- Add 'MEETING' to signal_type enum
ALTER TYPE signal_type ADD VALUE IF NOT EXISTS 'MEETING';

-- Add meeting_id column to signals
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS meeting_id TEXT;

-- Create meeting_artifacts table
CREATE TABLE IF NOT EXISTS public.meeting_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transcript_json JSONB,
  summary_text TEXT,
  recording_url TEXT,
  attendees JSONB
);

ALTER TABLE public.meeting_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS: publicly readable (matches signals table pattern)
CREATE POLICY "Meeting artifacts are publicly readable"
  ON public.meeting_artifacts
  FOR SELECT
  TO public
  USING (true);

-- RLS: only service role can insert
CREATE POLICY "Only service role can insert meeting artifacts"
  ON public.meeting_artifacts
  FOR INSERT
  TO service_role
  WITH CHECK (true);
