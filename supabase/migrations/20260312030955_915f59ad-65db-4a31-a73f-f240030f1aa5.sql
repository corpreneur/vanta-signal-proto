CREATE POLICY "Allow public status updates on signals"
ON public.signals
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);