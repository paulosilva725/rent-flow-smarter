-- Create some admin users for testing the edit functionality
-- First, let's update one of the tenants to admin for testing
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'djdjou2009@hotmail.com';

-- Create subscription for this admin if it doesn't exist
INSERT INTO system_subscriptions (
  owner_id,
  plan_type,
  status,
  monthly_amount,
  trial_start_date,
  trial_end_date
) 
SELECT 
  p.id,
  'basic',
  'trial',
  29.90,
  now(),
  now() + interval '7 days'
FROM profiles p 
WHERE p.email = 'djdjou2009@hotmail.com' 
AND NOT EXISTS (
  SELECT 1 FROM system_subscriptions ss WHERE ss.owner_id = p.id
);