import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [tenantLoginData, setTenantLoginData] = useState({
    cpf: ""
  });


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Buscar perfil pelo CPF
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', tenantLoginData.cpf)
        .eq('role', 'tenant')
        .single();

      if (profileError || !profile) {
        throw new Error('CPF não encontrado ou não é de um inquilino');
      }

      // Para login simplificado com CPF, criar sessão simulada
      localStorage.setItem('tenant_cpf', tenantLoginData.cpf);
      localStorage.setItem('tenant_profile', JSON.stringify(profile));
      localStorage.setItem('userType', 'tenant');
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sistema de Gerenciamento
          </CardTitle>
          <CardDescription className="text-center">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="tenant">Inquilino</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar como Admin"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="tenant">
              <form onSubmit={handleTenantLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-cpf">CPF</Label>
                  <Input
                    id="tenant-cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={tenantLoginData.cpf}
                    onChange={(e) => setTenantLoginData({ ...tenantLoginData, cpf: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar como Inquilino"}
                </Button>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Digite apenas o CPF cadastrado para acessar sua área.
                  </p>
                </div>
              </form>
            </TabsContent>

          </Tabs>
          
          {/* Link discreto para login do sistema */}
          <div className="mt-6 text-center">
            <Link 
              to="/system-login" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Acesso do Sistema
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;