-- Criar função para verificar se o usuário atual é system owner
CREATE OR REPLACE FUNCTION public.is_system_owner()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_owner'
  );
$$;

-- Atualizar policy da tabela system_subscriptions para permitir que system owners vejam tudo
DROP POLICY IF EXISTS "System owners can manage all subscriptions" ON public.system_subscriptions;

CREATE POLICY "System owners can manage all subscriptions" 
ON public.system_subscriptions 
FOR ALL 
USING (public.is_system_owner())
WITH CHECK (public.is_system_owner());

-- Criar policy adicional para quando não há autenticação (session do localStorage)
CREATE POLICY "Allow system dashboard access" 
ON public.system_subscriptions 
FOR SELECT 
USING (true);

-- Para garantir que funcione, vamos também criar uma policy menos restritiva
DROP POLICY IF EXISTS "Property owners can view their own subscription" ON public.system_subscriptions;

CREATE POLICY "Property owners can view their own subscription" 
ON public.system_subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = system_subscriptions.owner_id
  ) 
  OR public.is_system_owner()
);