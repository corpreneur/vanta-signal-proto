
-- Drop the overly permissive insert policy
DROP POLICY "Service role can insert signals" ON public.signals;

-- Restrict inserts to service role only (edge functions use service role key)
CREATE POLICY "Only service role can insert signals"
  ON public.signals FOR INSERT
  TO service_role
  WITH CHECK (true);
