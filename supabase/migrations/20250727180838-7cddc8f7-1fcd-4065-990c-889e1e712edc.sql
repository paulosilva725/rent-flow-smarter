-- Remover a policy conflitante que está causando problemas de leitura
DROP POLICY IF EXISTS "Allow system dashboard access" ON public.system_subscriptions;

-- Simplificar as policies - manter apenas as essenciais
DROP POLICY IF EXISTS "Property owners can view their own subscription" ON public.system_subscriptions;

CREATE POLICY "Users can view related subscriptions" 
ON public.system_subscriptions 
FOR SELECT 
USING (
  public.is_system_owner() 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = system_subscriptions.owner_id
  )
);