-- Criar policy temporária para permitir acesso total ao system dashboard quando não há auth
CREATE POLICY "System dashboard temp access" 
ON public.system_subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);