-- Atualizar políticas RLS para chat exclusivo admin-inquilino
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update message read status" ON chat_messages;

-- Criar nova política para envio de mensagens (apenas admin e tenant)
CREATE POLICY "Only admins and tenants can send messages" 
ON chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.id = chat_messages.sender_id
    AND p.role IN ('admin', 'tenant')
  )
  AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = chat_messages.receiver_id
    AND p.role IN ('admin', 'tenant')
  )
  AND
  -- Garantir que admin só conversa com tenant e vice-versa
  (
    (
      EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin' AND id = chat_messages.sender_id)
      AND
      EXISTS (SELECT 1 FROM profiles WHERE role = 'tenant' AND id = chat_messages.receiver_id)
    )
    OR
    (
      EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'tenant' AND id = chat_messages.sender_id)
      AND
      EXISTS (SELECT 1 FROM profiles WHERE role = 'admin' AND id = chat_messages.receiver_id)
    )
  )
);

-- Criar política para visualização de mensagens (apenas participantes da conversa)
CREATE POLICY "Users can view messages in admin-tenant conversations" 
ON chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND (p.id = chat_messages.sender_id OR p.id = chat_messages.receiver_id)
    AND p.role IN ('admin', 'tenant')
  )
  AND
  -- Garantir que a conversa é entre admin e tenant
  (
    (
      EXISTS (SELECT 1 FROM profiles WHERE role = 'admin' AND id = chat_messages.sender_id)
      AND
      EXISTS (SELECT 1 FROM profiles WHERE role = 'tenant' AND id = chat_messages.receiver_id)
    )
    OR
    (
      EXISTS (SELECT 1 FROM profiles WHERE role = 'tenant' AND id = chat_messages.sender_id)
      AND
      EXISTS (SELECT 1 FROM profiles WHERE role = 'admin' AND id = chat_messages.receiver_id)
    )
  )
);

-- Criar política para marcar mensagens como lidas
CREATE POLICY "Users can update message read status" 
ON chat_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.id = chat_messages.receiver_id
    AND p.role IN ('admin', 'tenant')
  )
);