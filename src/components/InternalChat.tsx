import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, User, Shield } from "lucide-react";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'tenant';
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface InternalChatProps {
  userType: "admin" | "tenant";
  currentUserId: string;
  currentUserName: string;
  messages: ChatMessage[];
  onSendMessage?: (message: string) => void;
  onMarkAsRead?: (messageId: string) => void;
}

export const InternalChat = ({ 
  userType, 
  currentUserId, 
  currentUserName, 
  messages, 
  onSendMessage,
  onMarkAsRead 
}: InternalChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    onSendMessage?.(newMessage.trim());
    setNewMessage("");
    
    toast({
      title: "Mensagem enviada!",
      description: "Sua mensagem foi enviada com sucesso."
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const unreadCount = messages.filter(msg => 
    !msg.isRead && msg.senderId !== currentUserId
  ).length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Chat Interno
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} nova{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {userType === "admin" 
            ? "Comunicação direta com inquilinos"
            : "Comunicação direta com o administrador"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Inicie uma conversa!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className="flex-shrink-0">
                      {message.senderType === 'admin' ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">
                          {isOwnMessage ? 'Você' : message.senderName}
                        </span>
                        {message.senderType === 'admin' && (
                          <Badge variant="outline" className="text-xs py-0 px-1">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${
                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {!isOwnMessage && !message.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[40px] max-h-[100px] p-2 border rounded-md resize-none"
              rows={1}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pressione Enter para enviar, Shift+Enter para quebrar linha
          </p>
        </div>
      </CardContent>
    </Card>
  );
};