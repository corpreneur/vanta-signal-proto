
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_error_logs_function_name ON public.error_logs (function_name);
CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
