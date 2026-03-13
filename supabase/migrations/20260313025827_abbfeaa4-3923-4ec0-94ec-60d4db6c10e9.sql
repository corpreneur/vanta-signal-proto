
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'true'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Readable by anyone (anon key can read settings)
CREATE POLICY "Settings are publicly readable"
  ON public.system_settings FOR SELECT
  TO public
  USING (true);

-- Updatable by anyone (single-user prototype)
CREATE POLICY "Settings are publicly updatable"
  ON public.system_settings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Seed the group auto-reply toggle (default: disabled)
INSERT INTO public.system_settings (key, value) VALUES
  ('group_autoreply_enabled', 'false'::jsonb);
