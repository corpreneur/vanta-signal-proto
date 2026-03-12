-- Add source type enum
CREATE TYPE public.signal_source AS ENUM ('linq', 'gmail', 'manual');

-- Add source column with default 'linq' so existing records are preserved
ALTER TABLE public.signals ADD COLUMN source public.signal_source NOT NULL DEFAULT 'linq';

-- Add email-specific metadata column for subject, from, cc, etc.
ALTER TABLE public.signals ADD COLUMN email_metadata jsonb DEFAULT NULL;

-- Add index for source filtering
CREATE INDEX idx_signals_source ON public.signals (source);