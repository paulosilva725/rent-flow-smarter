import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Wrench, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Trash2
} from "lucide-react";

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  category: 'electrical' | 'plumbing' | 'structural' | 'appliance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  requestDate: string;
  completedDate?: string;
  tenantId: string;
  propertyId: string;
}

interface RepairRequestProps {
  userType: 'admin' | 'tenant';
  currentTenantId?: string;
  currentPropertyId?: string;
  requests: RepairRequest[];
  onCreateRequest: (request: Omit<RepairRequest, 'id' | 'requestDate'>) => void;
  onUpdateStatus: (requestId: string, status: RepairRequest['status']) => void;
  onDeleteRequest?: (requestId: string) => void;
}

export const RepairRequest = ({ 
  userType, 
  currentTenantId, 
  currentPropertyId,
  requests,
  onCreateRequest,
  onUpdateStatus,
  onDeleteRequest
}: RepairRequestProps) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as RepairRequest['category'],
    priority: 'medium' as RepairRequest['priority']
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTenantId || !currentPropertyId) {
      toast({
        title: "Erro",
        description: "Informações do inquilino não encontradas",
        variant: "destructive"
      });
      return;
    }

    onCreateRequest({
      ...formData,
      status: 'pending',
      tenantId: currentTenantId,
      propertyId: currentPropertyId
    });

    toast({
      title: "Solicitação enviada!",
      description: "Sua solicitação de reparo foi registrada com sucesso."
    });

    setFormData({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium'
    });
    setShowRequestForm(false);
  };

  const getStatusIcon = (status: RepairRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: RepairRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'in-progress':
        return <Badge variant="default">Em Andamento</Badge>;
      case 'completed':
        return <Badge variant="outline">Concluído</Badge>;
    }
  };

  const getPriorityBadge = (priority: RepairRequest['priority']) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline">Baixa</Badge>;
      case 'medium':
        return <Badge variant="secondary">Média</Badge>;
      case 'high':
        return <Badge variant="default">Alta</Badge>;
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
    }
  };

  const getCategoryName = (category: RepairRequest['category']) => {
    const categories = {
      electrical: 'Elétrica',
      plumbing: 'Hidráulica',
      structural: 'Estrutural',
      appliance: 'Eletrodomésticos',
      other: 'Outros'
    };
    return categories[category];
  };

  const handleDeleteRequest = (requestId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação de reparo?')) {
      onDeleteRequest?.(requestId);
      toast({
        title: "Solicitação excluída",
        description: "A solicitação de reparo foi excluída com sucesso."
      });
    }
  };

  // Filtrar solicitações baseado no tipo de usuário
  const filteredRequests = userType === 'tenant' 
    ? requests.filter(req => req.tenantId === currentTenantId)
    : requests;

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                {userType === 'tenant' ? 'Minhas Solicitações de Reparo' : 'Solicitações de Reparo'}
              </CardTitle>
              <CardDescription>
                {userType === 'tenant' 
                  ? 'Solicite reparos necessários em seu imóvel'
                  : 'Gerencie todas as solicitações de reparo dos inquilinos'
                }
              </CardDescription>
            </div>
            {userType === 'tenant' && (
              <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Solicitação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Nova Solicitação de Reparo</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título do Problema</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Torneira da cozinha gotejando"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={formData.category} onValueChange={(value: RepairRequest['category']) => 
                        setFormData(prev => ({ ...prev, category: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electrical">Elétrica</SelectItem>
                          <SelectItem value="plumbing">Hidráulica</SelectItem>
                          <SelectItem value="structural">Estrutural</SelectItem>
                          <SelectItem value="appliance">Eletrodomésticos</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={formData.priority} onValueChange={(value: RepairRequest['priority']) => 
                        setFormData(prev => ({ ...prev, priority: value }))
                      }>
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
                      <Label htmlFor="description">Descrição Detalhada</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o problema em detalhes..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowRequestForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">Enviar Solicitação</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                {userType === 'admin' && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userType === 'admin' ? 6 : 5} className="text-center text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(request.category)}</TableCell>
                    <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {request.requestDate}
                      </div>
                    </TableCell>
                    {userType === 'admin' && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={request.status}
                            onValueChange={(value: RepairRequest['status']) => 
                              onUpdateStatus(request.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="in-progress">Em Andamento</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                            </SelectContent>
                          </Select>
                          {onDeleteRequest && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRequest(request.id)}
                              title="Excluir solicitação de reparo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};