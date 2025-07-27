-- Create system owner subscriptions table to manage property owners
CREATE TABLE public.system_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  monthly_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for system subscriptions
CREATE POLICY "System owners can manage all subscriptions" ON public.system_subscriptions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'system_owner'
));

CREATE POLICY "Property owners can view their own subscription" ON public.system_subscriptions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.id = system_subscriptions.owner_id
));

-- Create trigger for updated_at
CREATE TRIGGER update_system_subscriptions_updated_at
BEFORE UPDATE ON public.system_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to include system_owner role
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'tenant', 'system_owner'));

-- Create default system owner account
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES (
  gen_random_uuid(),
  'admin@sistema.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "System Owner"}',
  false,
  'authenticated'
);

-- Get the created user ID and create profile
INSERT INTO public.profiles (user_id, name, email, role)
SELECT 
  id,
  'System Owner',
  'admin@sistema.com',
  'system_owner'
FROM auth.users 
WHERE email = 'admin@sistema.com';

-- Create function to automatically create subscription when property owner is created
CREATE OR REPLACE FUNCTION public.create_property_owner_subscription()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic subscription creation
CREATE TRIGGER create_subscription_on_admin_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_property_owner_subscription();