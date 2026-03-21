
-- Function to check if all sprint items for a feedback entry are done/parked
-- and update the feedback entry status accordingly
CREATE OR REPLACE FUNCTION public.update_feedback_on_sprint_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback_id uuid;
  v_total int;
  v_completed int;
BEGIN
  -- Get the feedback_entry_id from the updated sprint item
  v_feedback_id := COALESCE(NEW.feedback_entry_id, OLD.feedback_entry_id);
  
  -- Skip if no linked feedback entry
  IF v_feedback_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count total and completed sprint items for this feedback entry
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('done', 'parked'))
  INTO v_total, v_completed
  FROM sprint_items
  WHERE feedback_entry_id = v_feedback_id;

  -- If all items are done/parked, mark feedback as done
  IF v_total > 0 AND v_total = v_completed THEN
    UPDATE feedback_entries
    SET status = 'done', updated_at = now()
    WHERE id = v_feedback_id AND status != 'done';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on sprint_items status changes
CREATE TRIGGER trg_sprint_item_status_change
AFTER UPDATE OF status ON public.sprint_items
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.update_feedback_on_sprint_complete();

-- Also trigger on delete (if sprint items are removed)
CREATE TRIGGER trg_sprint_item_deleted
AFTER DELETE ON public.sprint_items
FOR EACH ROW
EXECUTE FUNCTION public.update_feedback_on_sprint_complete();
