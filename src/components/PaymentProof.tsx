import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Check, Clock, X, Eye, Edit, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentProof {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  monthReference: string;
  amount: string;
  rejectionReason?: string;
  observation?: string;
}

interface PaymentProofProps {
  userType: "admin" | "tenant";
  proofs: PaymentProof[];
  onUploadProof?: (file: File, monthReference: string, amount: string) => void;
  onUpdateProofStatus?: (proofId: string, status: PaymentProof['status'], reason?: string, observation?: string) => void;
}

export const PaymentProof = ({ userType, proofs, onUploadProof, onUpdateProofStatus }: PaymentProofProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [monthReference, setMonthReference] = useState("");
  const [amount, setAmount] = useState("");
  const [editingProof, setEditingProof] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<PaymentProof['status']>('pending');
  const [editObservation, setEditObservation] = useState("");
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

  const handleManualStatusUpdate = (proofId: string) => {
    onUpdateProofStatus?.(proofId, editStatus, "", editObservation);
    setEditingProof(null);
    setEditStatus('pending');
    setEditObservation("");
    
    toast({
      title: "Status atualizado",
      description: `Status alterado para ${getStatusText(editStatus)}.`
    });
  };

  const handleViewFile = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment_proofs')
        .createSignedUrl(fileUrl, 3600); // URL válida por 1 hora
      
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Erro ao abrir arquivo",
        description: "Não foi possível abrir o arquivo.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment_proofs')
        .createSignedUrl(fileUrl, 3600);
      
      if (error) throw error;
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      toast({
        title: "Erro ao baixar arquivo",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive"
      });
    }
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
                <div key={proof.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{proof.fileName}</span>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewFile(proof.fileUrl, proof.fileName)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(proof.fileUrl, proof.fileName)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <p><strong>Mês de Vencimento:</strong> {new Date(proof.monthReference).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                        <p><strong>Valor:</strong> R$ {Number(proof.amount).toFixed(2)}</p>
                        <p><strong>Enviado em:</strong> {new Date(proof.uploadDate).toLocaleDateString('pt-BR')}</p>
                      </div>

                      {proof.observation && (
                        <div className="bg-muted p-2 rounded text-sm">
                          <strong>Observação:</strong> {proof.observation}
                        </div>
                      )}

                      {proof.status === 'rejected' && proof.rejectionReason && (
                        <div className="bg-destructive/10 p-2 rounded text-sm text-destructive">
                          <strong>Motivo da rejeição:</strong> {proof.rejectionReason}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(proof.status)} className="flex items-center space-x-1">
                        {getStatusIcon(proof.status)}
                        <span>{getStatusText(proof.status)}</span>
                      </Badge>
                    </div>
                  </div>

                  {userType === "admin" && (
                    <div className="border-t pt-4 space-y-3">
                      {editingProof === proof.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Alterar Status</label>
                              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as PaymentProof['status'])}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Em Análise</SelectItem>
                                  <SelectItem value="approved">Aprovado</SelectItem>
                                  <SelectItem value="rejected">Rejeitado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Observação</label>
                              <Textarea
                                placeholder="Adicione uma observação..."
                                value={editObservation}
                                onChange={(e) => setEditObservation(e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleManualStatusUpdate(proof.id)}>
                              <Check className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingProof(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          {proof.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(proof.id, 'approved')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStatusUpdate(proof.id, 'rejected')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProof(proof.id);
                              setEditStatus(proof.status);
                              setEditObservation(proof.observation || "");
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar Status
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};