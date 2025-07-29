import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Wrench, Plus, Trash2, Eye } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  rent_amount: number;
}

interface PaymentProof {
  id: string;
  file_name: string;
  file_url: string;
  amount: number;
  reference_month: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
  observation?: string;
  tenant_id: string;
  property_id: string;
}

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  tenant_id: string;
  property_id: string;
}

interface UnifiedRequestSystemProps {
  user: User;
  userProperty?: Property;
  isAdmin?: boolean;
}

const UnifiedRequestSystem = ({ user, userProperty, isAdmin = false }: UnifiedRequestSystemProps) => {
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [uploadAmount, setUploadAmount] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRepairDialog, setShowRepairDialog] = useState(false);
  
  // Repair form data
  const [repairForm, setRepairForm] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium" as const
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Admin: buscar todos os dados
        const [paymentRes, repairRes] = await Promise.all([
          supabase.from("payment_proofs").select("*").order("created_at", { ascending: false }),
          supabase.from("repair_requests").select("*").order("created_at", { ascending: false })
        ]);
        
        if (paymentRes.data) setPaymentProofs(paymentRes.data);
        if (repairRes.data) setRepairRequests(repairRes.data);
      } else {
        // Tenant: buscar apenas seus dados
        const [paymentRes, repairRes] = await Promise.all([
          supabase.from("payment_proofs").select("*").eq("tenant_id", user.id).order("created_at", { ascending: false }),
          supabase.from("repair_requests").select("*").eq("tenant_id", user.id).order("created_at", { ascending: false })
        ]);
        
        if (paymentRes.data) setPaymentProofs(paymentRes.data);
        if (repairRes.data) setRepairRequests(repairRes.data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedMonth || !uploadAmount || !userProperty) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload do arquivo
      const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Salvar dados no banco
      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          tenant_id: user.id,
          property_id: userProperty.id,
          file_name: selectedFile.name,
          file_url: fileName,
          amount: parseFloat(uploadAmount),
          reference_month: selectedMonth,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Comprovante enviado",
        description: "Seu comprovante foi enviado e está aguardando aprovação.",
      });

      setSelectedFile(null);
      setSelectedMonth("");
      setUploadAmount("");
      setShowPaymentDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar comprovante",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRepairRequest = async () => {
    if (!repairForm.title || !repairForm.description || !userProperty) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("repair_requests")
        .insert({
          tenant_id: user.id,
          property_id: userProperty.id,
          title: repairForm.title,
          description: repairForm.description,
          category: repairForm.category,
          priority: repairForm.priority,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de reparo foi enviada com sucesso.",
      });

      setRepairForm({
        title: "",
        description: "",
        category: "other",
        priority: "medium"
      });
      setShowRepairDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (proofId: string, newStatus: string, rejectionReason?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("payment_proofs")
        .update(updateData)
        .eq("id", proofId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Comprovante ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateRepairStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("repair_requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "Status da solicitação atualizado com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePaymentProof = async (proofId: string) => {
    try {
      const { error } = await supabase
        .from("payment_proofs")
        .delete()
        .eq("id", proofId);

      if (error) throw error;

      toast({
        title: "Comprovante excluído",
        description: "O comprovante foi excluído com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      months.push(monthYear);
    }
    return months;
  };

  const getStatusBadge = (status: string, type: 'payment' | 'repair') => {
    const variants: Record<string, any> = {
      payment: {
        pending: { variant: "secondary", text: "Pendente" },
        approved: { variant: "default", text: "Aprovado" },
        rejected: { variant: "destructive", text: "Rejeitado" }
      },
      repair: {
        pending: { variant: "secondary", text: "Pendente" },
        in_progress: { variant: "outline", text: "Em Andamento" },
        completed: { variant: "default", text: "Concluído" },
        cancelled: { variant: "destructive", text: "Cancelado" }
      }
    };

    const config = variants[type][status] || { variant: "secondary", text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { variant: "outline", text: "Baixa" },
      medium: { variant: "secondary", text: "Média" },
      high: { variant: "default", text: "Alta" },
      urgent: { variant: "destructive", text: "Urgente" }
    };

    const config = variants[priority] || { variant: "outline", text: priority };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {isAdmin ? "Gerenciar Solicitações" : "Minhas Solicitações"}
        </h2>
        {!isAdmin && userProperty && (
          <div className="flex gap-2">
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Comprovante
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Comprovante de Pagamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="month">Mês de Referência</Label>
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
                    <Label htmlFor="amount">Valor Pago (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">Arquivo do Comprovante</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button onClick={handleFileUpload} disabled={!selectedFile || !selectedMonth || !uploadAmount}>
                    Enviar Comprovante
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showRepairDialog} onOpenChange={setShowRepairDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Wrench className="w-4 h-4 mr-2" />
                  Solicitar Reparo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Reparo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título da Solicitação</Label>
                    <Input
                      id="title"
                      value={repairForm.title}
                      onChange={(e) => setRepairForm({ ...repairForm, title: e.target.value })}
                      placeholder="Ex: Vazamento na torneira"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={repairForm.category} onValueChange={(value) => setRepairForm({ ...repairForm, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Encanamento</SelectItem>
                        <SelectItem value="electrical">Elétrica</SelectItem>
                        <SelectItem value="painting">Pintura</SelectItem>
                        <SelectItem value="heating">Aquecimento</SelectItem>
                        <SelectItem value="cleaning">Limpeza</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={repairForm.priority} onValueChange={(value: any) => setRepairForm({ ...repairForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={repairForm.description}
                      onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })}
                      placeholder="Descreva o problema em detalhes..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleRepairRequest} disabled={!repairForm.title || !repairForm.description}>
                    Enviar Solicitação
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList>
          <TabsTrigger value="payments">
            <FileText className="w-4 h-4 mr-2" />
            Comprovantes de Pagamento
          </TabsTrigger>
          <TabsTrigger value="repairs">
            <Wrench className="w-4 h-4 mr-2" />
            Solicitações de Reparo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Comprovantes de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentProofs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum comprovante encontrado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Mês</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentProofs.map((proof) => (
                      <TableRow key={proof.id}>
                        <TableCell>{proof.file_name}</TableCell>
                        <TableCell>{proof.reference_month}</TableCell>
                        <TableCell>R$ {proof.amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(proof.status, 'payment')}</TableCell>
                        <TableCell>{new Date(proof.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`${supabase.storage.from('payment_proofs').getPublicUrl(proof.file_url).data.publicUrl}`, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <>
                                {proof.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => updatePaymentStatus(proof.id, 'approved')}
                                    >
                                      Aprovar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const reason = prompt("Motivo da rejeição:");
                                        if (reason) updatePaymentStatus(proof.id, 'rejected', reason);
                                      }}
                                    >
                                      Rejeitar
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                            {(!isAdmin && proof.status === 'approved') && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deletePaymentProof(proof.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repairs">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Reparo</CardTitle>
            </CardHeader>
            <CardContent>
              {repairRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma solicitação encontrada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      {isAdmin && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.title}</div>
                            <div className="text-sm text-muted-foreground">{request.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{request.category}</TableCell>
                        <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                        <TableCell>{getStatusBadge(request.status, 'repair')}</TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Select
                              value={request.status}
                              onValueChange={(value) => updateRepairStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="in_progress">Em Andamento</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedRequestSystem;