-- Criar bucket para comprovantes de pagamento
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment_proofs', 'payment_proofs', false);

-- Política para permitir upload de comprovantes pelos inquilinos
CREATE POLICY "Tenants can upload payment proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'payment_proofs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'tenant'
  )
);

-- Política para permitir visualização dos próprios comprovantes
CREATE POLICY "Users can view their own payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment_proofs' 
  AND (
    -- Inquilino pode ver seus próprios comprovantes
    (auth.uid()::text = (storage.foldername(name))[1])
    OR
    -- Admin pode ver todos os comprovantes
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Política para permitir atualização de comprovantes
CREATE POLICY "Users can update their own payment proofs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'payment_proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir exclusão de comprovantes
CREATE POLICY "Users can delete their own payment proofs" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'payment_proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);