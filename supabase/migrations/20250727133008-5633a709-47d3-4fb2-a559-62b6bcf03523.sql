-- Criar tabela para configurações dos planos
CREATE TABLE public.plan_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL UNIQUE,
  monthly_amount NUMERIC NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_properties INTEGER NOT NULL DEFAULT 5,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão dos planos
INSERT INTO public.plan_configurations (plan_type, monthly_amount, max_users, max_properties, features) VALUES
('basic', 29.90, 1, 5, '["Dashboard básico", "Gestão de inquilinos", "Comprovantes de pagamento"]'),
('premium', 79.90, 3, 15, '["Dashboard avançado", "Relatórios", "Chat interno", "Gestão de reparos"]'),
('enterprise', 199.90, 10, 50, '["Dashboard completo", "Relatórios avançados", "API access", "Suporte prioritário"]');

-- Habilitar RLS
ALTER TABLE public.plan_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas para plan_configurations
CREATE POLICY "System owners can manage plan configurations" 
ON public.plan_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'system_owner'
));

CREATE POLICY "Everyone can view plan configurations" 
ON public.plan_configurations 
FOR SELECT 
USING (true);

-- Adicionar colunas à tabela system_subscriptions
ALTER TABLE public.system_subscriptions 
ADD COLUMN is_blocked BOOLEAN DEFAULT false,
ADD COLUMN block_reason TEXT,
ADD COLUMN current_users_count INTEGER DEFAULT 0,
ADD COLUMN invoice_url TEXT,
ADD COLUMN invoice_due_date TIMESTAMP WITH TIME ZONE;

-- Criar tabela para faturas/boletos
CREATE TABLE public.system_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.system_subscriptions(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invoice_url TEXT,
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para invoices
ALTER TABLE public.system_invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para system_invoices
CREATE POLICY "System owners can manage all invoices" 
ON public.system_invoices 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'system_owner'
));

CREATE POLICY "Property owners can view their invoices" 
ON public.system_invoices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.id = system_invoices.owner_id
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_plan_configurations_updated_at
BEFORE UPDATE ON public.plan_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_invoices_updated_at
BEFORE UPDATE ON public.system_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();