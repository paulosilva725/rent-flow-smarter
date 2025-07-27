-- Create system owner profile and fix RLS policies
-- First, create a system owner role for the current admin user
UPDATE profiles 
SET role = 'system_owner' 
WHERE email = 'djdjou2008@hotmail.com' AND role = 'admin';

-- Update RLS policies to allow system owners to manage subscriptions
DROP POLICY IF EXISTS "System owners can manage all subscriptions" ON system_subscriptions;
CREATE POLICY "System owners can manage all subscriptions" 
ON system_subscriptions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'system_owner'
  )
);

-- Update RLS policies to allow system owners to manage invoices  
DROP POLICY IF EXISTS "System owners can manage all invoices" ON system_invoices;
CREATE POLICY "System owners can manage all invoices"
ON system_invoices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'system_owner'
  )
);