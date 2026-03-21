
-- Sprint items table: stores AI-generated sprint tasks from feedback
CREATE TABLE public.sprint_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_entry_id UUID REFERENCES public.feedback_entries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  effort TEXT NOT NULL DEFAULT 'medium',
  sprint_phase INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'backlog',
  ai_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sprint_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read sprint items"
  ON public.sprint_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can insert sprint items"
  ON public.sprint_items FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sprint items"
  ON public.sprint_items FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sprint items"
  ON public.sprint_items FOR DELETE TO authenticated
  USING (true);

-- Track which feedback entries have been processed
ALTER TABLE public.feedback_entries ADD COLUMN sprint_processed BOOLEAN NOT NULL DEFAULT false;
