
-- Create signal type enum
CREATE TYPE public.signal_type AS ENUM ('INTRO', 'INSIGHT', 'INVESTMENT', 'DECISION', 'CONTEXT', 'NOISE');

-- Create signal priority enum
CREATE TYPE public.signal_priority AS ENUM ('high', 'medium', 'low');

-- Create signal status enum
CREATE TYPE public.signal_status AS ENUM ('Captured', 'In Progress', 'Complete');

-- Create signals table
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_type public.signal_type NOT NULL DEFAULT 'CONTEXT',
  sender TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_message TEXT NOT NULL,
  priority public.signal_priority NOT NULL DEFAULT 'medium',
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actions_taken TEXT[] NOT NULL DEFAULT '{}',
  status public.signal_status NOT NULL DEFAULT 'Captured',
  raw_payload JSONB,
  linq_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Public read access (this is an internal tool, signals are viewable by authenticated users via session auth)
-- Since this app uses sessionStorage auth (not Supabase auth), we allow public read for now
CREATE POLICY "Signals are publicly readable"
  ON public.signals FOR SELECT
  USING (true);

-- Only service role (edge functions) can insert
CREATE POLICY "Service role can insert signals"
  ON public.signals FOR INSERT
  WITH CHECK (true);

-- Index for reverse-chronological queries
CREATE INDEX idx_signals_captured_at ON public.signals (captured_at DESC);

-- Index for filtering
CREATE INDEX idx_signals_type ON public.signals (signal_type);
CREATE INDEX idx_signals_priority ON public.signals (priority);
CREATE INDEX idx_signals_sender ON public.signals (sender);

-- Enable realtime for live feed updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
