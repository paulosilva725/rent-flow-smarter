-- Criar funções similares para repair_requests
CREATE OR REPLACE FUNCTION public.can_insert_repair_request(p_tenant_id UUID)
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.can_view_repair_request(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se é admin ou o próprio inquilino
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR id = p_tenant_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO 'public';

-- Recriar políticas para repair_requests
DROP POLICY IF EXISTS "Tenants can create their own repair requests" ON repair_requests;
DROP POLICY IF EXISTS "Tenants can view their own repair requests" ON repair_requests;

CREATE POLICY "Tenants can create their own repair requests" 
ON repair_requests 
FOR INSERT 
WITH CHECK (can_insert_repair_request(tenant_id));

CREATE POLICY "Tenants can view their own repair requests" 
ON repair_requests 
FOR SELECT 
USING (can_view_repair_request(tenant_id));