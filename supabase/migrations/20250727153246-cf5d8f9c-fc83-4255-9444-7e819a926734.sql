-- Ajustar estrutura com usuários existentes:
-- João Paulo como system_owner
-- Marcelo como admin (já que Paulo Silva não existe no auth.users)

-- Fazer João Paulo virar system_owner
UPDATE profiles 
SET role = 'system_owner'
WHERE email = 'joaopaulo@example.com';

-- Fazer Marcelo virar admin (property owner que vai pagar)
UPDATE profiles 
SET role = 'admin'
WHERE name = 'Marcelo Maria';

-- Criar assinatura para Marcelo (o admin que vai pagar pelo sistema)
INSERT INTO system_subscriptions (
  owner_id,
  plan_type,
  monthly_amount,
  status,
  trial_start_date,
  trial_end_date
) VALUES (
  (SELECT id FROM profiles WHERE name = 'Marcelo Maria'),
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
AND email != 'joaopaulo@example.com' 
AND name != 'Marcelo Maria';