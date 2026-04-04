ALTER TABLE public.upcoming_meetings ADD COLUMN IF NOT EXISTS rtms_stream_id text;
ALTER TABLE public.upcoming_meetings ADD COLUMN IF NOT EXISTS rtms_status text NOT NULL DEFAULT 'idle';