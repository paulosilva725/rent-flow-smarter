-- Corrigir políticas RLS para payment_proofs
DROP POLICY IF EXISTS "Users can view related payment proofs" ON payment_proofs;
DROP POLICY IF EXISTS "Tenants can upload payment proofs" ON payment_proofs;

-- Nova política para visualização - inquilinos podem ver seus próprios comprovantes
CREATE POLICY "Tenants can view their own payment proofs" 
ON payment_proofs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = payment_proofs.tenant_id
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Nova política para inserção - inquilinos podem criar seus próprios comprovantes
CREATE POLICY "Tenants can create their own payment proofs" 
ON payment_proofs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = payment_proofs.tenant_id
  )
);

-- Corrigir políticas RLS para repair_requests
DROP POLICY IF EXISTS "Users can view related repair requests" ON repair_requests;
DROP POLICY IF EXISTS "Tenants can create repair requests" ON repair_requests;

-- Nova política para visualização - inquilinos podem ver seus próprios reparos
CREATE POLICY "Tenants can view their own repair requests" 
ON repair_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = repair_requests.tenant_id
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Nova política para inserção - inquilinos podem criar seus próprios reparos
CREATE POLICY "Tenants can create their own repair requests" 
ON repair_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = repair_requests.tenant_id
  )
);