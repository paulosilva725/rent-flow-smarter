-- Fix RLS policies for repair requests to allow tenant creation with tenant_id
DROP POLICY IF EXISTS "Tenants can create repair requests" ON repair_requests;

CREATE POLICY "Tenants can create repair requests" 
ON repair_requests 
FOR INSERT 
WITH CHECK (
  -- Allow if user is a tenant and the tenant_id matches their profile id
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = repair_requests.tenant_id 
    AND p.role = 'tenant'
  )
  OR
  -- Allow admins to create repair requests for tenants
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Also fix payment proofs policies
DROP POLICY IF EXISTS "Tenants can upload payment proofs" ON payment_proofs;

CREATE POLICY "Tenants can upload payment proofs" 
ON payment_proofs 
FOR INSERT 
WITH CHECK (
  -- Allow if user is a tenant and the tenant_id matches their profile id
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id = payment_proofs.tenant_id 
    AND p.role = 'tenant'
  )
  OR
  -- Allow admins to upload payment proofs for tenants
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);