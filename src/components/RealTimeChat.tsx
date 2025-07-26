import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Shield, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  receiver: {
    id: string;
    name: string;
    role: string;
  };
}

interface RealTimeChatProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  otherUser?: {
    id: string;
    name: string;
    role: string;
  };
}

const RealTimeChat = ({ currentUser, otherUser }: RealTimeChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState(otherUser);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [selectedUser, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUser.id);

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setUsers(data || []);
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        *,
        sender:profiles!chat_messages_sender_id_fkey(id, name, role),
        receiver:profiles!chat_messages_receiver_id_fkey(id, name, role)
      `)
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
    markMessagesAsRead();
  };

  const setupRealtimeSubscription = () => {
    if (!selectedUser) return;

    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as any;
            if (
              (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedUser.id) ||
              (newMsg.sender_id === selectedUser.id && newMsg.receiver_id === currentUser.id)
            ) {
              fetchMessages();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser) return;

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("sender_id", selectedUser.id)
      .eq("receiver_id", currentUser.id)
      .eq("is_read", false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: newMessage.trim(),
      });

    if (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const unreadCount = messages.filter(
    (msg) => !msg.is_read && msg.sender.id !== currentUser.id
  ).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>Chat Interno</span>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} não lidas</Badge>
          )}
        </CardTitle>
        
        {!otherUser && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Conversar com:</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user = users.find(u => u.id === e.target.value);
                setSelectedUser(user);
              }}
            >
              <option value="">Selecione um usuário</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role === "admin" ? "Admin" : "Inquilino"})
                </option>
              ))}
            </select>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender.id === currentUser.id ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {message.sender.role === "admin" ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] ${
                    message.sender.id === currentUser.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  } rounded-lg p-3`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.sender.name}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.message}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTimestamp(message.created_at)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {selectedUser && (
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="resize-none"
                rows={2}
              />
              <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeChat;