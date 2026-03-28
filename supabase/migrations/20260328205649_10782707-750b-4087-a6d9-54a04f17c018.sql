
-- Update refresh_demo_timestamps to include contact_profiles
CREATE OR REPLACE FUNCTION public.refresh_demo_timestamps()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  max_captured timestamptz;
  time_offset interval;
BEGIN
  SELECT MAX(captured_at) INTO max_captured FROM signals;
  IF max_captured IS NULL THEN RETURN; END IF;
  time_offset := (now() - interval '2 hours') - max_captured;
  IF time_offset < interval '12 hours' THEN RETURN; END IF;

  UPDATE signals SET captured_at = captured_at + time_offset, created_at = created_at + time_offset;
  UPDATE signals SET due_date = (due_date::date + (EXTRACT(EPOCH FROM time_offset)/86400)::int)::text WHERE due_date IS NOT NULL;
  UPDATE meeting_artifacts SET created_at = created_at + time_offset;
  UPDATE upcoming_meetings SET starts_at = starts_at + time_offset, ends_at = CASE WHEN ends_at IS NOT NULL THEN ends_at + time_offset ELSE NULL END, created_at = created_at + time_offset, briefed = false;
  UPDATE pre_meeting_briefs SET created_at = created_at + time_offset;
  UPDATE relationship_alerts SET created_at = created_at + time_offset, dismissed = false;
  UPDATE relationship_briefs SET generated_at = generated_at + time_offset;
  UPDATE engagement_sequences SET created_at = created_at + time_offset, next_due_at = next_due_at + time_offset, last_fired_at = CASE WHEN last_fired_at IS NOT NULL THEN last_fired_at + time_offset ELSE NULL END;
  UPDATE speaker_profiles SET created_at = created_at + time_offset, first_seen_at = first_seen_at + time_offset, last_seen_at = last_seen_at + time_offset;
  UPDATE meeting_speakers SET created_at = created_at + time_offset;
  UPDATE signal_corrections SET corrected_at = corrected_at + time_offset;
  UPDATE contact_tags SET created_at = created_at + time_offset;
  UPDATE custom_signal_types SET created_at = created_at + time_offset;
  UPDATE error_logs SET created_at = created_at + time_offset;
  UPDATE workflows SET created_at = created_at + time_offset;
  UPDATE contact_profiles SET created_at = created_at + time_offset, updated_at = updated_at + time_offset;
END;
$function$;
