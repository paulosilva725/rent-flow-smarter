-- Add observation field to payment_proofs table
ALTER TABLE public.payment_proofs 
ADD COLUMN observation TEXT;