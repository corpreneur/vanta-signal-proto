-- Allow authenticated users to delete signals
CREATE POLICY "Authenticated users can delete signals"
ON public.signals
FOR DELETE
TO authenticated
USING (true);