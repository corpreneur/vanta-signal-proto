-- Allow authenticated users to insert manual signals (contact context, notes, etc.)
CREATE POLICY "Authenticated users can insert manual signals"
ON public.signals
FOR INSERT
TO authenticated
WITH CHECK (source = 'manual');
