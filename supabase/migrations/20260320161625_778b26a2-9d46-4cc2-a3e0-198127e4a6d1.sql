
-- User contexts table (migrated from localStorage)
CREATE TABLE public.user_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  context_type text NOT NULL DEFAULT 'client',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contexts"
  ON public.user_contexts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User preferences table (delivery prefs, active context, setup status)
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  context_setup_complete boolean NOT NULL DEFAULT false,
  active_context_id uuid REFERENCES public.user_contexts(id) ON DELETE SET NULL,
  delivery_push boolean NOT NULL DEFAULT false,
  delivery_sms boolean NOT NULL DEFAULT false,
  delivery_email boolean NOT NULL DEFAULT false,
  delivery_email_address text DEFAULT '',
  delivery_time text NOT NULL DEFAULT '06:30',
  delivery_timezone text NOT NULL DEFAULT 'America/New_York',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Signal briefs table (for dynamic brief generation)
CREATE TABLE public.signal_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_id uuid REFERENCES public.user_contexts(id) ON DELETE CASCADE,
  headline text NOT NULL,
  summary text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own briefs"
  ON public.signal_briefs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert briefs"
  ON public.signal_briefs FOR INSERT TO service_role
  WITH CHECK (true);
