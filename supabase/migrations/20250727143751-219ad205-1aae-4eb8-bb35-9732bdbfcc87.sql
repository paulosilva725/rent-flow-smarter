-- Simplify payment_proofs RLS policy as well
DROP POLICY IF EXISTS "Tenants can upload payment proofs" ON payment_proofs;

CREATE POLICY "Allow payment proof upload" 
ON payment_proofs 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated (both admin and tenant can create)
  auth.uid() IS NOT NULL
);