import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Crown, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const switchToOwner = () => {
    // Logout atual
    supabase.auth.signOut();
    localStorage.clear();
    // Redirecionar para login de system owner
    navigate("/auth");
    setIsOpen(false);
    toast({
      title: "Alternando para System Owner",
      description: "Redirecionando para login de sistema...",
    });
  };

  const switchToAdmin = async () => {
    // Logout atual
    await supabase.auth.signOut();
    localStorage.clear();
    
    // Login automático como admin (usuário de teste)
    const { error } = await supabase.auth.signInWithPassword({
      email: "djdjou2008@hotmail.com", // Email do admin existente
      password: "123456" // Você pode definir uma senha padrão
    });

    if (error) {
      // Se der erro, redirecionar para auth normal
      navigate("/auth");
      toast({
        title: "Erro no login automático",
        description: "Redirecionando para página de login...",
        variant: "destructive"
      });
    } else {
      navigate("/dashboard");
      toast({
        title: "Logado como Admin",
        description: "Bem-vindo à área administrativa!",
      });
    }
    setIsOpen(false);
  };

  const switchToTenant = () => {
    // Logout atual
    supabase.auth.signOut();
    localStorage.clear();
    // Redirecionar para auth normal (pode logar como inquilino)
    navigate("/auth");
    setIsOpen(false);
    toast({
      title: "Alternando para Inquilino",
      description: "Redirecionando para login...",
    });
  };

  const switchToLogin = () => {
    // Logout atual e ir para login por CPF
    supabase.auth.signOut();
    localStorage.clear();
    navigate("/login");
    setIsOpen(false);
    toast({
      title: "Alternando para Login CPF",
      description: "Redirecionando para login por CPF...",
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Alternar Usuário
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-center">Alternar Tipo de Usuário</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={switchToOwner}
              >
                <Crown className="h-4 w-4" />
                System Owner (Dono do Sistema)
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={switchToAdmin}
              >
                <Shield className="h-4 w-4" />
                Admin (Proprietário)
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={switchToTenant}
              >
                <User className="h-4 w-4" />
                Inquilino (Email/Senha)
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={switchToLogin}
              >
                <User className="h-4 w-4" />
                Inquilino (Login CPF)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              🧪 Botão para testes - facilita alternar entre usuários
            </p>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}