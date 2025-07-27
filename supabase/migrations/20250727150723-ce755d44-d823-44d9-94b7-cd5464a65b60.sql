-- Corrigir a inversão dos papéis admin/tenant
-- Primeiro, vamos identificar quem são os verdadeiros proprietários (admins) e inquilinos (tenants)

-- Paulo Silva atualmente é 'admin' mas está como inquilino, deve ser 'tenant'
UPDATE profiles 
SET role = 'tenant' 
WHERE email = 'djdjou2009@hotmail.com';

-- Marcelo Maria atualmente é 'tenant' mas deveria ser o proprietário das propriedades
-- Vamos verificar se ele deveria ser admin baseado na estrutura atual
-- Por enquanto, vou assumir que o João Paulo (system_owner) deveria ser o admin/proprietário

-- Converter o system_owner para admin (proprietário de imóveis)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'djdjou2008@hotmail.com';

-- Criar um novo system_owner ou manter a estrutura
-- Vou criar um usuário específico para system_owner posteriormente se necessário