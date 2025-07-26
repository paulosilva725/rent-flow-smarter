-- Adicionar configuração de taxa de atraso na tabela admin_settings
ALTER TABLE public.admin_settings 
ADD COLUMN late_fee_percentage numeric DEFAULT 2.0,
ADD COLUMN late_fee_grace_days integer DEFAULT 5;

-- Adicionar campo de caução na tabela properties
ALTER TABLE public.properties 
ADD COLUMN security_deposit numeric DEFAULT 0;

-- Criar tabela para histórico de taxas de atraso
CREATE TABLE public.late_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.profiles(id),
  property_id uuid REFERENCES public.properties(id),
  payment_month text NOT NULL,
  original_amount numeric NOT NULL,
  late_fee_amount numeric NOT NULL,
  days_late integer NOT NULL,
  fee_percentage numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.late_fees ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para late_fees
CREATE POLICY "Admins can manage late fees" 
ON public.late_fees 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

CREATE POLICY "Tenants can view their late fees" 
ON public.late_fees 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.id = late_fees.tenant_id
));

-- Trigger para updated_at
CREATE TRIGGER update_late_fees_updated_at
BEFORE UPDATE ON public.late_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();