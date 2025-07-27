-- Corrigir as funções para incluir SET search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO 'public';

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO 'public';