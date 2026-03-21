
CREATE TABLE public.feedback_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author text NOT NULL,
  narrative text NOT NULL DEFAULT '',
  chatgpt_links text[] NOT NULL DEFAULT '{}',
  screenshot_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feedback"
  ON public.feedback_entries FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feedback"
  ON public.feedback_entries FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update feedback"
  ON public.feedback_entries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete feedback"
  ON public.feedback_entries FOR DELETE
  TO authenticated USING (true);

-- Storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-screenshots', 'feedback-screenshots', true);

CREATE POLICY "Authenticated users can upload feedback screenshots"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'feedback-screenshots');

CREATE POLICY "Anyone can view feedback screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feedback-screenshots');
