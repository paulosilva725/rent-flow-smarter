import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Minus, CreditCard, History } from "lucide-react";

interface CreditTransaction {
  id: string;
  credit_amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  created_by: string | null;
  owner_id: string;
}

interface AdminWithCredits {
  id: string;
  name: string;
  email: string;
  subscription?: {
    id: string;
    plan_type: string;
    status: string;
    trial_end_date: string;
    next_payment_date: string;
    monthly_amount: number;
    is_blocked?: boolean;
    block_reason?: string;
    current_users_count?: number;
    credits?: number;
    credits_updated_at?: string;
  };
}

interface AdminCreditsManagementProps {
  owner: AdminWithCredits;
  onUpdate: () => void;
}

export default function AdminCreditsManagement({ owner, onUpdate }: AdminCreditsManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionType, setTransactionType] = useState<"add" | "remove">("add");
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchTransactions = async () => {
    if (!owner.subscription?.id) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("owner_id", owner.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, owner.id]);

  const handleCreditTransaction = async () => {
    console.log("handleCreditTransaction called", { creditAmount, owner });
    console.log("Owner subscription:", owner.subscription);
    
    if (!creditAmount || !owner.subscription?.id) {
      console.log("Missing creditAmount or subscription ID", { creditAmount, subscriptionId: owner.subscription?.id });
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      console.log("Invalid amount:", amount);
      toast({
        title: "Erro",
        description: "Quantidade de créditos deve ser um número positivo",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const currentCredits = owner.subscription.credits || 0;
      const newCredits = transactionType === "add" 
        ? currentCredits + amount 
        : Math.max(0, currentCredits - amount);

      console.log("Updating subscription credits", { subscriptionId: owner.subscription.id, newCredits });

      // Update subscription credits
      const { error: updateError } = await supabase
        .from("system_subscriptions")
        .update({ credits: newCredits })
        .eq("id", owner.subscription.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      console.log("Credits updated successfully, now recording transaction");

      // Record transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          owner_id: owner.id,
          subscription_id: owner.subscription.id,
          credit_amount: transactionType === "add" ? amount : -amount,
          transaction_type: transactionType === "add" ? "purchase" : "deduction",
          description: description || `${transactionType === "add" ? "Adição" : "Remoção"} de ${amount} crédito(s)`,
          created_by: null // System owner
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        throw transactionError;
      }

      toast({
        title: "Sucesso",
        description: `${amount} crédito(s) ${transactionType === "add" ? "adicionado(s)" : "removido(s)"} com sucesso`
      });

      setCreditAmount("");
      setDescription("");
      onUpdate();
      fetchTransactions();
    } catch (error) {
      console.error("Error managing credits:", error);
      toast({
        title: "Erro", 
        description: "Erro ao gerenciar créditos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentCredits = owner.subscription?.credits || 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CreditCard className="h-4 w-4 mr-1" />
          Gerenciar Créditos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gerenciar Créditos - {owner.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Credits & Management */}
          <Card>
            <CardHeader>
              <CardTitle>Créditos Atuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{currentCredits}</div>
                <div className="text-sm text-muted-foreground">
                  {currentCredits === 1 ? "crédito disponível" : "créditos disponíveis"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Cada crédito = 1 mês de uso
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant={transactionType === "add" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionType("add")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                  <Button
                    variant={transactionType === "remove" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionType("remove")}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>

                <div>
                  <Label htmlFor="creditAmount">Quantidade de Créditos</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Ex: 3"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`${transactionType === "add" ? "Pagamento recebido" : "Dedução de créditos"}`}
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleCreditTransaction}
                  disabled={loading || !creditAmount}
                  className="w-full"
                >
                  {loading ? "Processando..." : 
                    `${transactionType === "add" ? "Adicionar" : "Remover"} ${creditAmount || "0"} Crédito(s)`
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="text-center py-4">Carregando...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma transação encontrada
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={transaction.credit_amount > 0 ? "default" : "destructive"}>
                            {transaction.credit_amount > 0 ? "+" : ""}{transaction.credit_amount}
                          </Badge>
                          <span className="text-sm font-medium">
                            {transaction.transaction_type === "purchase" ? "Compra" : "Dedução"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}