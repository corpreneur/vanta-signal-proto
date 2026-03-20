
-- Speaker profiles for cross-meeting speaker memory
CREATE TABLE public.speaker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  aliases text[] NOT NULL DEFAULT '{}',
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  meeting_count integer NOT NULL DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique on email when present
CREATE UNIQUE INDEX idx_speaker_profiles_email ON public.speaker_profiles (email) WHERE email IS NOT NULL;
CREATE INDEX idx_speaker_profiles_name ON public.speaker_profiles USING gin (to_tsvector('english', name));

ALTER TABLE public.speaker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read speaker profiles"
  ON public.speaker_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage speaker profiles"
  ON public.speaker_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Junction table linking speakers to meeting signals
CREATE TABLE public.meeting_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  speaker_profile_id uuid NOT NULL REFERENCES public.speaker_profiles(id) ON DELETE CASCADE,
  turn_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (signal_id, speaker_profile_id)
);

ALTER TABLE public.meeting_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read meeting speakers"
  ON public.meeting_speakers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage meeting speakers"
  ON public.meeting_speakers FOR ALL TO service_role USING (true) WITH CHECK (true);
