-- Adicionar política de DELETE para profiles
-- Apenas admins podem deletar perfis
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);