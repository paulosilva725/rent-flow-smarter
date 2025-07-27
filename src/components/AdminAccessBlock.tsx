import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, Clock, Lock } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface AdminAccessBlockProps {
  children: React.ReactNode;
}

export default function AdminAccessBlock({ children }: AdminAccessBlockProps) {
  const { accessData, loading, refetch } = useAdminAccess();
  const navigate = useNavigate();

  useEffect(() => {
    // Check access every 5 minutes
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!accessData?.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Sistema Bloqueado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              {accessData?.reason || "Acesso negado"}
            </div>

            {accessData?.subscription && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant={accessData.subscription.status === "active" ? "default" : "destructive"}>
                    {accessData.subscription.status === "active" ? "Ativo" : 
                     accessData.subscription.status === "trial" ? "Trial" :
                     accessData.subscription.status === "expired" ? "Expirado" : 
                     "Cancelado"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Créditos:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{accessData.subscription.credits}</span>
                    <span className="text-xs text-muted-foreground">
                      {accessData.subscription.credits === 1 ? "mês" : "meses"}
                    </span>
                  </div>
                </div>

                {accessData.subscription.credits === 0 && (
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Créditos esgotados</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Entre em contato com o administrador do sistema para adquirir mais créditos.
                    </div>
                  </div>
                )}

                {accessData.subscription.credits > 0 && (
                  <div className="bg-amber-500/10 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Sistema em uso</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Cada crédito representa 30 dias de uso do sistema.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={refetch} 
                variant="outline" 
                className="w-full"
              >
                Verificar novamente
              </Button>
              
              <Button 
                onClick={() => navigate("/auth")} 
                variant="default" 
                className="w-full"
              >
                Fazer logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}