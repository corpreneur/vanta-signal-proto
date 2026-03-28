
CREATE TABLE public.contact_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text,
  photo_url text,
  title text,
  company text,
  email text,
  phone text,
  relationship_type text NOT NULL DEFAULT 'personal',
  how_we_met text,
  source_tag text NOT NULL DEFAULT 'manual',
  private_notes text,
  pinned boolean NOT NULL DEFAULT false,
  pinned_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contact profiles"
  ON public.contact_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
