-- Fix RLS policy to allow admin creating repair requests without tenant restrictions
DROP POLICY IF EXISTS "Tenants can create repair requests" ON repair_requests;

CREATE POLICY "Allow repair request creation" 
ON repair_requests 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated (both admin and tenant can create)
  auth.uid() IS NOT NULL
);