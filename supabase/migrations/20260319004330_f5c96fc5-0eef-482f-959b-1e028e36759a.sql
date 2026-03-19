
-- Fix overdue due_dates to be upcoming
UPDATE public.signals
SET due_date = (CURRENT_DATE + (floor(random() * 3) + 1)::int)
WHERE due_date IS NOT NULL
  AND due_date::date < CURRENT_DATE;
