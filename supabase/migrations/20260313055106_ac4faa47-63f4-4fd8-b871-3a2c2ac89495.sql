-- Tighten signals RLS
DROP POLICY IF EXISTS "Signals are publicly readable" ON public.signals;
CREATE POLICY "Signals readable by authenticated users" ON public.signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public status updates on signals" ON public.signals;
CREATE POLICY "Authenticated users can update signals" ON public.signals
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Tighten system_settings RLS
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.system_settings;
CREATE POLICY "Settings readable by authenticated users" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Settings are publicly updatable" ON public.system_settings;
CREATE POLICY "Authenticated users can update settings" ON public.system_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Tighten meeting_artifacts RLS
DROP POLICY IF EXISTS "Meeting artifacts are publicly readable" ON public.meeting_artifacts;
CREATE POLICY "Meeting artifacts readable by authenticated users" ON public.meeting_artifacts
  FOR SELECT TO authenticated USING (true);

-- Tighten pre_meeting_briefs RLS
DROP POLICY IF EXISTS "Briefs are publicly readable" ON public.pre_meeting_briefs;
CREATE POLICY "Briefs readable by authenticated users" ON public.pre_meeting_briefs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can update briefs" ON public.pre_meeting_briefs;
CREATE POLICY "Authenticated users can update briefs" ON public.pre_meeting_briefs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Tighten upcoming_meetings RLS
DROP POLICY IF EXISTS "Upcoming meetings are publicly readable" ON public.upcoming_meetings;
CREATE POLICY "Meetings readable by authenticated users" ON public.upcoming_meetings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can insert upcoming meetings" ON public.upcoming_meetings;
CREATE POLICY "Authenticated users can insert meetings" ON public.upcoming_meetings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update upcoming meetings" ON public.upcoming_meetings;
CREATE POLICY "Authenticated users can update meetings" ON public.upcoming_meetings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);