-- Create some admin users for testing the edit functionality
-- First, let's update one of the tenants to admin for testing
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'djdjou2009@hotmail.com';

-- Create subscription for this admin
INSERT INTO system_subscriptions (
  owner_id,
  plan_type,
  status,
  monthly_amount,
  trial_start_date,
  trial_end_date
) VALUES (
  (SELECT id FROM profiles WHERE email = 'djdjou2009@hotmail.com'),
  'basic',
  'trial',
  29.90,
  now(),
  now() + interval '7 days'
) ON CONFLICT (owner_id) DO NOTHING;