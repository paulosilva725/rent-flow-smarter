-- Primeiro, inserir um usuário na tabela auth.users (simulando signup)
-- Depois, inserir o perfil correspondente

-- Inserir perfil de inquilino de teste
INSERT INTO public.profiles (user_id, name, email, role, cpf, phone, status) VALUES 
('11111111-1111-1111-1111-111111111111', 'Inquilino Teste', 'inquilino.teste@email.com', 'tenant', '12345678900', '11999999999', 'active')
ON CONFLICT (user_id) DO NOTHING;