-- Corrigir a estrutura de usuários conforme explicado
-- João Paulo deve ser admin (proprietário), não system owner

-- Primeiro, vamos criar um system owner real
INSERT INTO profiles (user_id, name, email, role, status)
VALUES (
  gen_random_uuid(),
  'Sistema Owner',
  'owner@sistema.com', 
  'system_owner',
  'active'
);

-- Agora vamos converter João Paulo para admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'joaopaulo@example.com';

-- Transferir a assinatura do João Paulo (que era system_owner) para ele como admin
-- E criar uma nova assinatura de teste para ele
UPDATE system_subscriptions 
SET 
  plan_type = 'premium',
  status = 'active',
  monthly_amount = 79.90
WHERE owner_id = (SELECT id FROM profiles WHERE email = 'joaopaulo@example.com');