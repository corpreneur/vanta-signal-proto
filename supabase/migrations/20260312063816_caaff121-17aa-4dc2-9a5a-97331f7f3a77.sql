
-- Table for upcoming meetings (manually populated for now, calendar integration later)
CREATE TABLE IF NOT EXISTS public.upcoming_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  zoom_meeting_id TEXT,
  calendar_event_id TEXT,
  briefed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.upcoming_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upcoming meetings are publicly readable"
  ON public.upcoming_meetings FOR SELECT TO public USING (true);

CREATE POLICY "Public can insert upcoming meetings"
  ON public.upcoming_meetings FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can update upcoming meetings"
  ON public.upcoming_meetings FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Table for generated pre-meeting briefs
CREATE TABLE IF NOT EXISTS public.pre_meeting_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meeting_id UUID NOT NULL REFERENCES public.upcoming_meetings(id) ON DELETE CASCADE,
  brief_text TEXT NOT NULL,
  matched_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  attendee_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_dashboard BOOLEAN NOT NULL DEFAULT false,
  delivered_linq BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.pre_meeting_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Briefs are publicly readable"
  ON public.pre_meeting_briefs FOR SELECT TO public USING (true);

CREATE POLICY "Only service role can insert briefs"
  ON public.pre_meeting_briefs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Public can update briefs"
  ON public.pre_meeting_briefs FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Enable realtime for briefs
ALTER PUBLICATION supabase_realtime ADD TABLE public.pre_meeting_briefs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upcoming_meetings;
