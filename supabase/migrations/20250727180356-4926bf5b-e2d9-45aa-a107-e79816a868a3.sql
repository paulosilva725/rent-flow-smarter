-- Corrigir policies da tabela credit_transactions para permitir system owners
DROP POLICY IF EXISTS "System owners can manage all credit transactions" ON public.credit_transactions;

CREATE POLICY "System owners can manage all credit transactions" 
ON public.credit_transactions 
FOR ALL 
USING (public.is_system_owner())
WITH CHECK (public.is_system_owner());

-- Criar policy adicional para permitir inserção quando não há autenticação (session do localStorage)
CREATE POLICY "Allow system dashboard credit management" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (true);