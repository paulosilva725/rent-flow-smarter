-- Ajustar estrutura conforme solicitado:
-- João Paulo como owner (system_owner)
-- Paulo Silva como admin (property owner)
-- Demais como tenants

-- Primeiro, fazer João Paulo virar system_owner
UPDATE profiles 
SET role = 'system_owner'
WHERE email = 'joaopaulo@example.com';

-- Criar Paulo Silva como admin (property owner)
INSERT INTO profiles (user_id, name, email, role, status, cpf, phone)
VALUES (
  gen_random_uuid(),
  'Paulo Silva',
  'paulosilva@example.com',
  'admin',
  'active',
  '12345678901',
  '11987654321'
);

-- Criar assinatura para Paulo Silva (o admin que vai pagar pelo sistema)
INSERT INTO system_subscriptions (
  owner_id,
  plan_type,
  monthly_amount,
  status,
  trial_start_date,
  trial_end_date
) VALUES (
  (SELECT id FROM profiles WHERE email = 'paulosilva@example.com'),
  'basic',
  29.90,
  'trial',
  now(),
  now() + interval '7 days'
);

-- Remover a assinatura do João Paulo (agora ele é system_owner e não paga)
DELETE FROM system_subscriptions 
WHERE owner_id = (SELECT id FROM profiles WHERE email = 'joaopaulo@example.com');

-- Garantir que os demais usuários sejam tenants
UPDATE profiles 
SET role = 'tenant'
WHERE role NOT IN ('system_owner', 'admin') 
AND email NOT IN ('joaopaulo@example.com', 'paulosilva@example.com');