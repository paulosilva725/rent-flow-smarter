-- Verificar o trigger que pode estar causando problema
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'system_subscriptions';

-- Testar update direto para verificar se funciona
UPDATE system_subscriptions 
SET credits = 5, credits_updated_at = now()
WHERE id = 'a1835444-67fa-48a8-9b8e-bf30f9a789d7';