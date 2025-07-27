import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Ban, CheckCircle, FileText } from "lucide-react";

interface UserBlockManagementProps {
  owner: {
    id: string;
    name: string;
    email: string;
    subscription?: {
      id: string;
      is_blocked?: boolean;
      block_reason?: string;
      status: string;
    };
  };
  onUpdate: () => void;
}

export default function UserBlockManagement({ owner, onUpdate }: UserBlockManagementProps) {
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlockUser = async () => {
    if (!owner.subscription?.id || !blockReason.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("system_subscriptions")
        .update({
          is_blocked: true,
          block_reason: blockReason,
          status: "suspended"
        })
        .eq("id", owner.subscription.id);

      if (error) throw error;

      toast({
        title: "Usuário Bloqueado",
        description: `${owner.name} foi bloqueado com sucesso`
      });

      setIsBlockDialogOpen(false);
      setBlockReason("");
      onUpdate();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Erro",
        description: "Erro ao bloquear usuário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!owner.subscription?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("system_subscriptions")
        .update({
          is_blocked: false,
          block_reason: null,
          status: "active"
        })
        .eq("id", owner.subscription.id);

      if (error) throw error;

      toast({
        title: "Usuário Desbloqueado",
        description: `${owner.name} foi desbloqueado com sucesso`
      });

      onUpdate();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Erro",
        description: "Erro ao desbloquear usuário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!owner.subscription?.id || !invoiceAmount || !invoiceDueDate) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("system_invoices")
        .insert({
          subscription_id: owner.subscription.id,
          owner_id: owner.id,
          amount: parseFloat(invoiceAmount),
          due_date: invoiceDueDate,
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Fatura Criada",
        description: `Fatura de R$ ${parseFloat(invoiceAmount).toFixed(2)} criada para ${owner.name}`
      });

      setIsInvoiceDialogOpen(false);
      setInvoiceAmount("");
      setInvoiceDueDate("");
      onUpdate();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar fatura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = owner.subscription?.is_blocked;

  return (
    <div className="flex gap-2">
      {isBlocked ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnblockUser}
          disabled={loading}
          className="text-green-600 border-green-600 hover:bg-green-50"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Desbloquear
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsBlockDialogOpen(true)}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <Ban className="h-4 w-4 mr-1" />
          Bloquear
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsInvoiceDialogOpen(true)}
        className="text-blue-600 border-blue-600 hover:bg-blue-50"
      >
        <FileText className="h-4 w-4 mr-1" />
        Criar Fatura
      </Button>

      {/* Block User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear Usuário: {owner.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="block_reason">Motivo do Bloqueio</Label>
              <Textarea
                id="block_reason"
                placeholder="Digite o motivo do bloqueio..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleBlockUser} 
                disabled={!blockReason.trim() || loading}
                variant="destructive"
                className="flex-1"
              >
                Confirmar Bloqueio
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsBlockDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Fatura para: {owner.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoice_amount">Valor (R$)</Label>
              <Input
                id="invoice_amount"
                type="number"
                step="0.01"
                placeholder="100.00"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="invoice_due_date">Data de Vencimento</Label>
              <Input
                id="invoice_due_date"
                type="datetime-local"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateInvoice} 
                disabled={!invoiceAmount || !invoiceDueDate || loading}
                className="flex-1"
              >
                Criar Fatura
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsInvoiceDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}