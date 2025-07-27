-- Corrigir função is_system_owner para usar search_path seguro
DROP FUNCTION IF EXISTS public.is_system_owner();

CREATE OR REPLACE FUNCTION public.is_system_owner()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_owner'
  );
$$;