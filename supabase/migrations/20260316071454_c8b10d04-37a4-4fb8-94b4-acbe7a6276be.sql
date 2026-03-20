
-- Contact Tags table for tagging and grouping contacts
CREATE TABLE public.contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  tag text NOT NULL,
  color text NOT NULL DEFAULT 'bg-vanta-accent/10',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(contact_name, tag)
);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contact tags"
  ON public.contact_tags FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Engagement Sequences table for automated outreach reminders
CREATE TABLE public.engagement_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  sequence_type text NOT NULL DEFAULT 'reminder',
  interval_days integer NOT NULL DEFAULT 7,
  next_due_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  last_fired_at timestamp with time zone,
  enabled boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.engagement_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage engagement sequences"
  ON public.engagement_sequences FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Storage bucket for signal attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('signal-attachments', 'signal-attachments', true);

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signal-attachments');

CREATE POLICY "Anyone can view attachments"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'signal-attachments');

CREATE POLICY "Authenticated users can delete own attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'signal-attachments');
