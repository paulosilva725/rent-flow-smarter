import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, FileText, Calendar, Coins } from "lucide-react";

interface Invoice {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  invoice_url?: string;
  payment_method?: string;
  paid_at?: string;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  monthly_amount: number;
  is_blocked: boolean;
  trial_end_date?: string;
  next_payment_date?: string;
  credits: number;
  credits_updated_at?: string;
}

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("AdminBilling - Auth user:", user);
      if (!user) return;

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      console.log("AdminBilling - Profile:", profile, "Error:", profileError);
      if (!profile) return;

      // Buscar assinatura
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("system_subscriptions")
        .select("*")
        .eq("owner_id", profile.id)
        .single();

      console.log("AdminBilling - Subscription:", subscriptionData, "Error:", subscriptionError);
      setSubscription(subscriptionData);

      // Buscar faturas
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("system_invoices")
        .select("*")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });

      console.log("AdminBilling - Invoices:", invoicesData, "Error:", invoicesError);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Error fetching billing data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de cobrança",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from("system_invoices")
        .update({
          status: "paid",
          payment_method: "manual",
          paid_at: new Date().toISOString()
        })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Pagamento Confirmado",
        description: "Fatura marcada como paga"
      });

      fetchBillingData();
    } catch (error) {
      console.error("Error paying invoice:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      paid: { label: "Pago", variant: "default" as const },
      overdue: { label: "Vencido", variant: "destructive" as const },
      cancelled: { label: "Cancelado", variant: "outline" as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPlanLabel = (plan: string) => {
    const planMap = {
      basic: "Básico",
      premium: "Premium",
      enterprise: "Enterprise"
    };
    return planMap[plan as keyof typeof planMap] || plan;
  };

  const getCreditExpirationDays = (creditsUpdatedAt?: string) => {
    if (!creditsUpdatedAt) return null;
    
    const updatedDate = new Date(creditsUpdatedAt);
    const expirationDate = addDays(updatedDate, 30); // Créditos válidos por 30 dias
    const today = new Date();
    const daysRemaining = differenceInDays(expirationDate, today);
    
    return daysRemaining;
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status da Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano Atual</p>
                <p className="font-semibold">{getPlanLabel(subscription.plan_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="font-semibold">R$ {subscription.monthly_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créditos Disponíveis</p>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-lg">{subscription.credits}</span>
                </div>
                {subscription.credits_updated_at && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <p>
                      Atualizado: {formatDistanceToNow(new Date(subscription.credits_updated_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                    {(() => {
                      const daysRemaining = getCreditExpirationDays(subscription.credits_updated_at);
                      if (daysRemaining !== null) {
                        return (
                          <p className={`font-medium ${daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Créditos expirados'}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(subscription.status)}
                  {subscription.is_blocked && (
                    <Badge variant="destructive">Bloqueado</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {subscription.next_payment_date && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Próximo pagamento: {formatDistanceToNow(new Date(subscription.next_payment_date), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma fatura encontrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {invoice.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayInvoice(invoice.id)}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                      {invoice.invoice_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.invoice_url, '_blank')}
                        >
                          Ver Fatura
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}