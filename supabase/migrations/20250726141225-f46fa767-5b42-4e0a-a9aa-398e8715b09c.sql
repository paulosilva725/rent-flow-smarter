-- Adicionar campos para datas de contrato nas propriedades
ALTER TABLE public.properties 
ADD COLUMN contract_start_date DATE,
ADD COLUMN contract_end_date DATE;

-- Adicionar campo CPF na tabela profiles para inquilinos
ALTER TABLE public.profiles 
ADD COLUMN status TEXT DEFAULT 'active';

-- Criar tabela para contratos (para armazenar arquivos PDF)
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for contracts
CREATE POLICY "Users can view related contracts" 
ON public.contracts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND (p.id = contracts.tenant_id OR p.role = 'admin')
));

CREATE POLICY "Admins can manage contracts" 
ON public.contracts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'
));

-- Add trigger for contracts updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_contracts_property_id ON public.contracts(property_id);
CREATE INDEX idx_contracts_tenant_id ON public.contracts(tenant_id);

-- Create storage bucket for contracts if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for contracts
CREATE POLICY "Admins can upload contracts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contracts' AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'
));

CREATE POLICY "Users can view related contract files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contracts' AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND (p.role = 'admin' OR p.id::text = (storage.foldername(name))[1])
));