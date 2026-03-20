
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to refresh all timestamps so data always looks recent
-- Calculates offset between now() and the newest signal, then shifts everything forward
CREATE OR REPLACE FUNCTION public.refresh_demo_timestamps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_captured timestamptz;
  time_offset interval;
BEGIN
  -- Find the most recent signal timestamp
  SELECT MAX(captured_at) INTO max_captured FROM signals;
  
  -- If no signals, nothing to do
  IF max_captured IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate how far we need to shift (make newest signal ~2 hours ago)
  time_offset := (now() - interval '2 hours') - max_captured;
  
  -- If the offset is less than 12 hours, data is still fresh enough
  IF time_offset < interval '12 hours' THEN
    RETURN;
  END IF;
  
  -- Shift all signal timestamps
  UPDATE signals SET
    captured_at = captured_at + time_offset,
    created_at = created_at + time_offset;
  
  -- Shift due_date on signals (date column)
  UPDATE signals SET
    due_date = (due_date::date + (EXTRACT(EPOCH FROM time_offset)/86400)::int)::text
  WHERE due_date IS NOT NULL;
  
  -- Shift meeting artifacts
  UPDATE meeting_artifacts SET
    created_at = created_at + time_offset;
  
  -- Shift upcoming meetings (keep them in the future relative to now)
  UPDATE upcoming_meetings SET
    starts_at = starts_at + time_offset,
    ends_at = CASE WHEN ends_at IS NOT NULL THEN ends_at + time_offset ELSE NULL END,
    created_at = created_at + time_offset,
    briefed = false;
  
  -- Shift pre-meeting briefs
  UPDATE pre_meeting_briefs SET
    created_at = created_at + time_offset;
  
  -- Shift relationship alerts
  UPDATE relationship_alerts SET
    created_at = created_at + time_offset,
    dismissed = false;
  
  -- Shift relationship briefs
  UPDATE relationship_briefs SET
    generated_at = generated_at + time_offset;
  
  -- Shift engagement sequences
  UPDATE engagement_sequences SET
    created_at = created_at + time_offset,
    next_due_at = next_due_at + time_offset,
    last_fired_at = CASE WHEN last_fired_at IS NOT NULL THEN last_fired_at + time_offset ELSE NULL END;
  
  -- Shift speaker profiles
  UPDATE speaker_profiles SET
    created_at = created_at + time_offset,
    first_seen_at = first_seen_at + time_offset,
    last_seen_at = last_seen_at + time_offset;
  
  -- Shift meeting speakers
  UPDATE meeting_speakers SET
    created_at = created_at + time_offset;
  
  -- Shift signal corrections
  UPDATE signal_corrections SET
    corrected_at = corrected_at + time_offset;
  
  -- Shift contact tags
  UPDATE contact_tags SET
    created_at = created_at + time_offset;
  
  -- Shift custom signal types
  UPDATE custom_signal_types SET
    created_at = created_at + time_offset;
  
  -- Shift error logs
  UPDATE error_logs SET
    created_at = created_at + time_offset;
  
  -- Shift workflows
  UPDATE workflows SET
    created_at = created_at + time_offset;
END;
$$;
