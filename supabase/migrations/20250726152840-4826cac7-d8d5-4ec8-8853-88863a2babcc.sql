-- Create payment_proofs storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for payment_proofs bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'payment_proofs');

CREATE POLICY "Users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment_proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their payment proofs" ON storage.objects
FOR UPDATE USING (bucket_id = 'payment_proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete payment proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payment_proofs' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);