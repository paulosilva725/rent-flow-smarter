-- Ajustar as assinaturas após a correção dos papéis
-- Mover a assinatura do Paulo Silva (agora tenant) para João Paulo (agora admin)

-- Primeiro, obter os IDs
-- João Paulo (djdjou2008@hotmail.com) agora é admin
-- Paulo Silva (djdjou2009@hotmail.com) agora é tenant

-- Atualizar a assinatura para o novo admin
UPDATE system_subscriptions 
SET owner_id = (SELECT id FROM profiles WHERE email = 'djdjou2008@hotmail.com')
WHERE owner_id = (SELECT id FROM profiles WHERE email = 'djdjou2009@hotmail.com');

-- Criar role system_owner para poder gerenciar o sistema
-- Vou usar um approach diferente: manter João Paulo como admin E system_owner
UPDATE profiles 
SET role = 'system_owner' 
WHERE email = 'djdjou2008@hotmail.com';