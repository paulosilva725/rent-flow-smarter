import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Check, Clock, X } from "lucide-react";

interface PaymentProof {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  monthReference: string;
  amount: string;
  rejectionReason?: string;
}

interface PaymentProofProps {
  userType: "admin" | "tenant";
  proofs: PaymentProof[];
  onUploadProof?: (file: File, monthReference: string, amount: string) => void;
  onUpdateProofStatus?: (proofId: string, status: PaymentProof['status'], reason?: string) => void;
}

export const PaymentProof = ({ userType, proofs, onUploadProof, onUpdateProofStatus }: PaymentProofProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [monthReference, setMonthReference] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !monthReference || !amount) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo, informe o mês de referência e o valor.",
        variant: "destructive"
      });
      return;
    }

    onUploadProof?.(selectedFile, monthReference, amount);
    setSelectedFile(null);
    setMonthReference("");
    setAmount("");
    
    toast({
      title: "Comprovante enviado!",
      description: "Seu comprovante foi enviado para análise do administrador."
    });
  };

  const handleStatusUpdate = (proofId: string, status: PaymentProof['status']) => {
    let reason = "";
    if (status === 'rejected') {
      reason = prompt("Motivo da rejeição:") || "";
    }
    
    onUpdateProofStatus?.(proofId, status, reason);
    
    toast({
      title: "Status atualizado",
      description: `Comprovante ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'em análise'}.`
    });
  };

  const getStatusColor = (status: PaymentProof['status']) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: PaymentProof['status']) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Em Análise';
    }
  };

  const getStatusIcon = (status: PaymentProof['status']) => {
    switch (status) {
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {userType === "tenant" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Enviar Comprovante de Pagamento
            </CardTitle>
            <CardDescription>
              Envie o comprovante após efetuar o pagamento do aluguel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mês de Referência
                </label>
                <input
                  type="month"
                  value={monthReference}
                  onChange={(e) => setMonthReference(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Valor Pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comprovante (PDF, JPG, PNG)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="w-full p-2 border rounded-md"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !monthReference || !amount}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar Comprovante
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {userType === "admin" ? "Comprovantes Recebidos" : "Meus Comprovantes"}
          </CardTitle>
          <CardDescription>
            {userType === "admin" 
              ? "Gerencie os comprovantes de pagamento enviados pelos inquilinos"
              : "Acompanhe o status dos seus comprovantes enviados"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proofs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum comprovante encontrado
              </p>
            ) : (
              proofs.map((proof) => (
                <div key={proof.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{proof.fileName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Referência: {new Date(proof.monthReference).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                      <p>Valor: R$ {proof.amount}</p>
                      <p>Enviado em: {proof.uploadDate}</p>
                      {proof.status === 'rejected' && proof.rejectionReason && (
                        <p className="text-destructive">Motivo: {proof.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusColor(proof.status)} className="flex items-center space-x-1">
                      {getStatusIcon(proof.status)}
                      <span>{getStatusText(proof.status)}</span>
                    </Badge>
                    
                    {userType === "admin" && proof.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(proof.id, 'approved')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(proof.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};