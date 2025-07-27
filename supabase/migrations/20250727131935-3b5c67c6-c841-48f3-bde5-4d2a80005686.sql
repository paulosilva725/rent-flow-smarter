-- Create system owner profile manually
INSERT INTO public.profiles (user_id, name, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Owner', 
  'admin@sistema.com',
  'system_owner'
);

-- Create a simple login bypass for system owner
CREATE OR REPLACE FUNCTION public.verify_system_owner(input_email TEXT, input_password TEXT)
RETURNS TABLE(user_id UUID, email TEXT, name TEXT, role TEXT) AS $$
BEGIN
  -- Simple hardcoded verification for system owner
  IF input_email = 'admin@sistema.com' AND input_password = 'admin123' THEN
    RETURN QUERY
    SELECT 
      p.user_id,
      p.email,
      p.name,
      p.role
    FROM profiles p 
    WHERE p.email = 'admin@sistema.com' AND p.role = 'system_owner';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';