-- Criar política para que admins possam inserir perfis de inquilinos
CREATE POLICY "Admins can insert tenant profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
  OR auth.uid() = user_id
);