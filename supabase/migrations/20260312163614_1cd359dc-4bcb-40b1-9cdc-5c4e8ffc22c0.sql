
-- Add risk_level enum
CREATE TYPE public.signal_risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Add new metadata columns to signals table
ALTER TABLE public.signals
  ADD COLUMN risk_level signal_risk_level DEFAULT NULL,
  ADD COLUMN due_date DATE DEFAULT NULL,
  ADD COLUMN call_pointer TEXT DEFAULT NULL;
