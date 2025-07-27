-- Criar um usuário admin separado para o SystemDashboard gerenciar
-- Converter um dos tenants para admin (proprietário de imóveis)

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'marcelo@hotmail.com';

-- Criar assinatura para o novo admin
INSERT INTO system_subscriptions (
  owner_id,
  plan_type,
  status,
  monthly_amount,
  trial_start_date,
  trial_end_date
) 
SELECT 
  p.id,
  'premium',
  'active',
  79.90,
  now() - interval '10 days',
  now() + interval '20 days'
FROM profiles p 
WHERE p.email = 'marcelo@hotmail.com' 
AND NOT EXISTS (
  SELECT 1 FROM system_subscriptions ss WHERE ss.owner_id = p.id
);