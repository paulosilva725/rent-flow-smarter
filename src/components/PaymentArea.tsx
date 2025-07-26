import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: string;
  reference_month: string;
  payment_method?: string;
  created_at: string;
}

interface PaymentProof {
  id: string;
  file_name: string;
  amount: number;
  reference_month: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
}

interface PaymentAreaProps {
  tenantId: string;
  propertyId: string;
  rentAmount: number;
}

const PaymentArea = ({ tenantId, propertyId, rentAmount }: PaymentAreaProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
    fetchPaymentProofs();
  }, [tenantId, propertyId]);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      return;
    }

    setPayments(data || []);
  };

  const fetchPaymentProofs = async () => {
    const { data, error } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment proofs:", error);
      return;
    }

    setPaymentProofs(data || []);
  };

  const generateMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthYear = date.toLocaleDateString("pt-BR", {
        month: "2-digit",
        year: "numeric",
      });
      months.push(monthYear);
    }
    return months;
  };

  const processPaymentWithMercadoPago = async () => {
    if (!selectedMonth) {
      toast({
        title: "Selecione um mês",
        description: "Por favor, selecione o mês de referência para o pagamento.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se já existe pagamento para este mês
      const existingPayment = payments.find(p => p.reference_month === selectedMonth);
      if (existingPayment) {
        toast({
          title: "Pagamento já existe",
          description: "Já existe um pagamento para este mês.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Criar preferência de pagamento via Edge Function
      const { data, error } = await supabase.functions.invoke("create-payment-preference", {
        body: {
          tenant_id: tenantId,
          property_id: propertyId,
          amount: rentAmount,
          reference_month: selectedMonth,
        },
      });

      if (error) throw error;

      if (data.init_point) {
        // Redirecionar para o Mercado Pago
        window.open(data.init_point, "_blank");
        
        toast({
          title: "Redirecionando...",
          description: "Você será redirecionado para o Mercado Pago para concluir o pagamento.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Erro interno do sistema",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPaymentProof = async () => {
    if (!selectedFile || !selectedMonth) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo e o mês de referência.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload do arquivo para o storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${tenantId}_${selectedMonth}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Salvar registro no banco
      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          file_name: selectedFile.name,
          file_url: uploadData.path,
          amount: rentAmount,
          reference_month: selectedMonth,
        });

      if (insertError) throw insertError;

      toast({
        title: "Comprovante enviado",
        description: "Seu comprovante foi enviado e está aguardando aprovação.",
      });

      setSelectedFile(null);
      setSelectedMonth("");
      fetchPaymentProofs();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar comprovante",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Área de Pagamento via Mercado Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagamento Online
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor do Aluguel</Label>
              <Input 
                value={`R$ ${rentAmount.toFixed(2)}`} 
                disabled 
                className="font-medium"
              />
            </div>
            <div>
              <Label>Mês de Referência</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {generateMonths().map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={processPaymentWithMercadoPago} 
            disabled={isLoading || !selectedMonth}
            className="w-full"
          >
            {isLoading ? "Processando..." : "Pagar com Mercado Pago"}
          </Button>
        </CardContent>
      </Card>

      {/* Área de Upload de Comprovante */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Comprovante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mês de Referência</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {generateMonths().map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Arquivo do Comprovante</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Formatos aceitos: PDF, JPG, PNG
            </p>
          </div>

          <Button 
            onClick={uploadPaymentProof} 
            disabled={isLoading || !selectedFile || !selectedMonth}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? "Enviando..." : "Enviar Comprovante"}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length === 0 && paymentProofs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum pagamento registrado ainda.
              </p>
            ) : (
              <>
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pagamento - {payment.reference_month}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {payment.amount.toFixed(2)} • {payment.payment_method || "Mercado Pago"}
                      </p>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                ))}
                
                {paymentProofs.map((proof) => (
                  <div key={proof.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Comprovante - {proof.reference_month}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {proof.amount.toFixed(2)} • {proof.file_name}
                      </p>
                      {proof.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Motivo da rejeição: {proof.rejection_reason}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(proof.status)}
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentArea;