-- Criar função segura para verificar se o usuário pode inserir comprovantes de pagamento
CREATE OR REPLACE FUNCTION public.can_insert_payment_proof(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário autenticado tem um perfil que corresponde ao tenant_id
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND id = p_tenant_id 
    AND role = 'tenant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recriar a política de inserção usando a função
DROP POLICY IF EXISTS "Tenants can create their own payment proofs" ON payment_proofs;

CREATE POLICY "Tenants can create their own payment proofs" 
ON payment_proofs 
FOR INSERT 
WITH CHECK (can_insert_payment_proof(tenant_id));

-- Criar função segura para verificar visualização
CREATE OR REPLACE FUNCTION public.can_view_payment_proof(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se é admin ou o próprio inquilino
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR id = p_tenant_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recriar a política de visualização usando a função
DROP POLICY IF EXISTS "Tenants can view their own payment proofs" ON payment_proofs;

CREATE POLICY "Tenants can view their own payment proofs" 
ON payment_proofs 
FOR SELECT 
USING (can_view_payment_proof(tenant_id));