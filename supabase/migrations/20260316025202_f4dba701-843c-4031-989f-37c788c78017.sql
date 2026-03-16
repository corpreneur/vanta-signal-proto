-- E5.1: Add classification reasoning to signals
ALTER TABLE public.signals ADD COLUMN classification_reasoning text;

-- E2.2: Relationship briefs cache
CREATE TABLE public.relationship_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  brief_text text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.relationship_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read relationship briefs" ON public.relationship_briefs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can insert relationship briefs" ON public.relationship_briefs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update relationship briefs" ON public.relationship_briefs FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- E3.2: Cooling relationship alerts
CREATE TABLE public.relationship_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  alert_type text NOT NULL DEFAULT 'cooling',
  previous_strength integer NOT NULL DEFAULT 0,
  current_strength integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false
);
ALTER TABLE public.relationship_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read relationship alerts" ON public.relationship_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update relationship alerts" ON public.relationship_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role can insert relationship alerts" ON public.relationship_alerts FOR INSERT TO service_role WITH CHECK (true);

-- E6.1: Signal corrections feedback
CREATE TABLE public.signal_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  original_type text NOT NULL,
  corrected_type text,
  original_priority text NOT NULL,
  corrected_priority text,
  corrected_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.signal_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read corrections" ON public.signal_corrections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert corrections" ON public.signal_corrections FOR INSERT TO authenticated WITH CHECK (true);

-- E1.2: Workflows
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage workflows" ON public.workflows FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- E6.2: Custom signal types
CREATE TABLE public.custom_signal_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text NOT NULL UNIQUE,
  description text,
  color_text text NOT NULL DEFAULT 'text-vanta-text-mid',
  color_bg text NOT NULL DEFAULT 'bg-vanta-bg-elevated',
  color_border text NOT NULL DEFAULT 'border-vanta-border',
  training_examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_signal_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage custom types" ON public.custom_signal_types FOR ALL TO authenticated USING (true) WITH CHECK (true);