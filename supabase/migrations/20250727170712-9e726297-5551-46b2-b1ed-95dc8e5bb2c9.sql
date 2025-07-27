-- Adicionar coluna para status de pagamento na tabela properties
ALTER TABLE public.properties ADD COLUMN payment_status text DEFAULT 'pending';

-- Criar constraint para validar os valores
ALTER TABLE public.properties ADD CONSTRAINT payment_status_check 
CHECK (payment_status IN ('paid', 'pending', 'overdue'));