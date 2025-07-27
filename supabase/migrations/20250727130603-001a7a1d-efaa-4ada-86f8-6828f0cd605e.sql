-- Fix security issue: Update function with proper search_path
CREATE OR REPLACE FUNCTION public.create_property_owner_subscription()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Only create subscription for property owners (admins)
  IF NEW.role = 'admin' THEN
    INSERT INTO public.system_subscriptions (
      owner_id,
      plan_type,
      monthly_amount
    ) VALUES (
      NEW.id,
      'basic', -- Default plan
      29.90    -- Basic plan price from landing page
    );
  END IF;
  RETURN NEW;
END;
$$;