-- Adicionar coluna de créditos na tabela system_subscriptions
ALTER TABLE public.system_subscriptions 
ADD COLUMN credits INTEGER DEFAULT 0;

-- Adicionar coluna para rastrear quando os créditos foram atualizados pela última vez
ALTER TABLE public.system_subscriptions 
ADD COLUMN credits_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar tabela para histórico de créditos
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.system_subscriptions(id) ON DELETE CASCADE,
  credit_amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'deduct', 'purchase')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) -- System owner who made the transaction
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_transactions
CREATE POLICY "System owners can manage all credit transactions" 
ON public.credit_transactions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'system_owner'
));

CREATE POLICY "Property owners can view their credit history" 
ON public.credit_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.id = credit_transactions.owner_id
));

-- Trigger para atualizar credits_updated_at quando credits mudar
CREATE OR REPLACE FUNCTION update_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.credits IS DISTINCT FROM NEW.credits THEN
    NEW.credits_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credits_timestamp_trigger
BEFORE UPDATE ON public.system_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_credits_timestamp();