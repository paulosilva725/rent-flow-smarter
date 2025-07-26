import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyForm } from "@/components/PropertyForm";
import { TenantForm } from "@/components/TenantForm";
import { PropertyManagement } from "@/components/PropertyManagement";
import { RepairRequest } from "@/components/RepairRequest";
import { AdminActions } from "@/components/AdminActions";
import { PaymentProof } from "@/components/PaymentProof";
import { InternalChat } from "@/components/InternalChat";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
  Wrench,
  Home
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  rent: string;
  address: string;
  description?: string;
  bedrooms?: string;
  bathrooms?: string;
  area?: string;
  isOccupied: boolean;
  tenantId?: string;
  contractFile?: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  propertyId: string;
  rentAmount?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
}

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

interface PaymentProof {
  id: string;
  fileName: string;
  fileUrl?: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  monthReference: string;
  amount: string;
  rejectionReason?: string;
  observation?: string;
  tenantId: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'tenant';
  message: string;
  timestamp: string;
  isRead: boolean;
}

const Dashboard = () => {
  // Detectar tipo de usuário baseado no localStorage
  const [userType, setUserType] = useState<"admin" | "tenant">(() => {
    return (localStorage.getItem('userType') as "admin" | "tenant") || "tenant";
  });
  const [currentUserId] = useState(userType === "admin" ? "admin" : "1"); // ID diferente para admin
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [properties, setProperties] = useState<Property[]>([
    { 
      id: "1", 
      name: "Apartamento 101", 
      rent: "2500.00", 
      address: "Rua A, 123",
      isOccupied: true,
      tenantId: "1",
      contractFile: "contrato_apt101.pdf"
    },
    { 
      id: "2", 
      name: "Casa A", 
      rent: "3200.00", 
      address: "Rua B, 456",
      isOccupied: false
    },
  ]);
  const [tenants, setTenants] = useState<Tenant[]>([
    { 
      id: "1", 
      name: "João Silva", 
      propertyId: "1", 
      email: "joao@email.com",
      rentAmount: "2500.00",
      paymentStatus: "paid"
    },
  ]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([
    {
      id: "1",
      title: "Torneira da cozinha gotejando",
      description: "A torneira da cozinha está com vazamento constante",
      category: "plumbing",
      priority: "medium",
      status: "pending",
      requestDate: "15/01/2024",
      tenantId: "1",
      propertyId: "1"
    }
  ]);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([
    {
      id: "1",
      fileName: "comprovante_janeiro_2024.pdf",
      uploadDate: "15/01/2024",
      status: "approved",
      monthReference: "2024-01",
      amount: "2500.00",
      tenantId: "1"
    }
  ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderId: "admin",
      senderName: "Administrador",
      senderType: "admin",
      message: "Olá João! Bem-vindo ao portal. Se precisar de alguma coisa, estarei aqui para ajudar.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true
    },
    {
      id: "2",
      senderId: "1",
      senderName: "João Silva",
      senderType: "tenant",
      message: "Obrigado! Tenho uma dúvida sobre o vencimento do próximo aluguel.",
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      isRead: true
    }
  ]);
  const { toast } = useToast();

  const stats = [
    {
      title: "Total de Imóveis",
      value: properties.length.toString(),
      icon: Building2,
      description: `${properties.filter(p => p.isOccupied).length} ocupados`,
      trend: "up"
    },
    {
      title: "Inquilinos Ativos",
      value: tenants.length.toString(),
      icon: Users,
      description: `${Math.round((properties.filter(p => p.isOccupied).length / properties.length) * 100)}% de ocupação`,
      trend: "up"
    },
    {
      title: "Receita Mensal",
      value: "R$ 45.000",
      icon: DollarSign,
      description: "+12% vs mês anterior",
      trend: "up"
    },
    {
      title: "Pendências",
      value: tenants.filter(t => t.paymentStatus === 'overdue').length.toString(),
      icon: AlertTriangle,
      description: `${tenants.filter(t => t.paymentStatus === 'pending').length} pagamentos pendentes`,
      trend: "down"
    }
  ];

  const recentPayments = [
    { id: 1, tenant: "João Silva", property: "Apt 101", amount: "R$ 2.500", status: "paid", date: "15/01/2024" },
    { id: 2, tenant: "Maria Santos", property: "Casa A", amount: "R$ 3.200", status: "pending", date: "10/01/2024" },
    { id: 3, tenant: "Pedro Costa", property: "Apt 205", amount: "R$ 1.800", status: "overdue", date: "05/01/2024" },
  ];

  const upcomingTasks = [
    { id: 1, task: "Vistoria - Apt 101", date: "20/01/2024", priority: "high" },
    { id: 2, task: "Renovação contrato - Maria Santos", date: "22/01/2024", priority: "medium" },
    { id: 3, task: "Manutenção - Casa B", date: "25/01/2024", priority: "low" },
  ];

  const handlePropertySubmit = async (data: any) => {
    const newProperty: Property = {
      id: Date.now().toString(),
      name: data.name,
      rent: data.rent,
      address: data.address,
      description: data.description,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      area: data.area,
      isOccupied: false,
    };
    
    setProperties(prev => [...prev, newProperty]);
    toast({
      title: "Imóvel cadastrado!",
      description: `${data.name} foi cadastrado com sucesso.`,
    });
  };

  const handleTenantSubmit = async (data: any) => {
    const newTenant: Tenant = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      propertyId: data.propertyId,
      rentAmount: data.rentAmount,
      startDate: data.startDate,
      endDate: data.endDate,
      paymentStatus: 'pending',
    };
    
    // Marcar imóvel como ocupado
    setProperties(prev => prev.map(prop => 
      prop.id === data.propertyId 
        ? { ...prop, isOccupied: true, tenantId: newTenant.id }
        : prop
    ));
    
    setTenants(prev => [...prev, newTenant]);
    toast({
      title: "Inquilino cadastrado!",
      description: `${data.name} foi cadastrado com sucesso.`,
    });
  };

  const handleUpdateProperty = (updatedProperty: Property) => {
    setProperties(prev => prev.map(prop => 
      prop.id === updatedProperty.id ? updatedProperty : prop
    ));
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(prop => prop.id !== id));
  };

  const handleUpdateTenant = (updatedTenant: Tenant) => {
    setTenants(prev => prev.map(tenant => 
      tenant.id === updatedTenant.id ? updatedTenant : tenant
    ));
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(tenant => tenant.id !== id));
  };

  const handleUploadContract = (propertyId: string, file: File) => {
    // Simular upload do arquivo com validação
    try {
      const fileName = file.name;
      const fileSize = (file.size / 1024 / 1024).toFixed(2); // Converter para MB
      
      setProperties(prev => prev.map(prop => 
        prop.id === propertyId 
          ? { ...prop, contractFile: fileName }
          : prop
      ));
      
      toast({
        title: "Upload realizado com sucesso!",
        description: `Contrato "${fileName}" (${fileSize}MB) salvo para o imóvel.`
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível salvar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCreateRepairRequest = (request: Omit<RepairRequest, 'id' | 'requestDate'>) => {
    const newRequest: RepairRequest = {
      ...request,
      id: Date.now().toString(),
      requestDate: new Date().toLocaleDateString('pt-BR')
    };
    setRepairRequests(prev => [...prev, newRequest]);
  };

  const handleUpdateRepairStatus = (requestId: string, status: RepairRequest['status']) => {
    setRepairRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status,
            completedDate: status === 'completed' ? new Date().toLocaleDateString('pt-BR') : undefined
          }
        : req
    ));
    
    toast({
      title: "Status atualizado",
      description: `Solicitação marcada como ${status === 'pending' ? 'pendente' : status === 'in-progress' ? 'em andamento' : 'concluída'}.`
    });
  };

  const handlePropertyAction = (action: string, propertyId: string) => {
    toast({
      title: "Ação executada",
      description: `Ação "${action}" executada no imóvel ${propertyId}.`
    });
  };

  const handleTenantAction = (action: string, tenantId: string) => {
    toast({
      title: "Ação executada", 
      description: `Ação "${action}" executada no inquilino ${tenantId}.`
    });
  };

  const handleBulkAction = (action: string, ids: string[]) => {
    toast({
      title: "Ação em massa executada",
      description: `Ação "${action}" executada em ${ids.length} item(s).`
    });
  };

  const handleUploadPaymentProof = (file: File, monthReference: string, amount: string) => {
    const newProof: PaymentProof = {
      id: Date.now().toString(),
      fileName: file.name,
      uploadDate: new Date().toLocaleDateString('pt-BR'),
      status: 'pending',
      monthReference,
      amount,
      tenantId: userType === "tenant" ? currentUserId : "1" // Usar ID correto do tenant
    };
    setPaymentProofs(prev => [...prev, newProof]);
    
    toast({
      title: "Comprovante enviado!",
      description: userType === "tenant" 
        ? "Seu comprovante foi enviado para análise do administrador."
        : "Comprovante adicionado ao sistema."
    });
  };

  const handleUpdateProofStatus = (proofId: string, status: PaymentProof['status'], reason?: string) => {
    setPaymentProofs(prev => prev.map(proof => 
      proof.id === proofId 
        ? { ...proof, status, rejectionReason: reason }
        : proof
    ));
  };

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: userType === 'admin' ? 'Administrador' : currentTenant?.name || 'Inquilino',
      senderType: userType,
      message,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleMarkAsRead = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ));
  };

  const handleMarkAllAsRead = () => {
    setChatMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    toast({
      title: "Mensagens marcadas como lidas",
      description: "Todas as mensagens foram marcadas como lidas."
    });
  };

  if (userType === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
        <header className="bg-gradient-to-r from-primary/5 via-background to-primary/5 border-b border-primary/20 shadow-elegant">
          <div className="flex h-20 items-center px-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg shadow-glow">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  RentManager Pro
                </h1>
                <p className="text-sm text-muted-foreground">Gestão Inteligente de Imóveis</p>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setUserType(userType === "admin" ? "tenant" : "admin")}
                className="shadow-sm hover:shadow-md transition-smooth"
              >
                Alternar para {userType === "admin" ? "Inquilino" : "Admin"}
              </Button>
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-smooth">
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagens
                {chatMessages.filter(m => !m.isRead && m.senderType === 'tenant').length > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructive-foreground">
                    {chatMessages.filter(m => !m.isRead && m.senderType === 'tenant').length}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-smooth">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Dashboard do Administrador
            </h2>
            <p className="text-lg text-muted-foreground">Visão geral completa do seu portfólio de imóveis</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-6 h-12 bg-gradient-to-r from-muted/50 to-muted/30 p-1 rounded-xl shadow-card">
              <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-smooth">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-smooth">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Gerenciar</span>
              </TabsTrigger>
              <TabsTrigger value="repairs" className="flex items-center space-x-2 relative data-[state=active]:bg-background data-[state=active]:shadow-md transition-smooth">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Reparos</span>
                {repairRequests.filter(r => r.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs animate-pulse">
                    {repairRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center space-x-2 relative data-[state=active]:bg-background data-[state=active]:shadow-md transition-smooth">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Comprovantes</span>
                {paymentProofs.filter(p => p.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs animate-pulse">
                    {paymentProofs.filter(p => p.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center space-x-2 relative data-[state=active]:bg-background data-[state=active]:shadow-md transition-smooth">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
                {chatMessages.filter(m => !m.isRead && m.senderType === 'tenant').length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs animate-pulse">
                    {chatMessages.filter(m => !m.isRead && m.senderType === 'tenant').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-smooth">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Ações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <Card key={index} className="shadow-card transition-smooth hover:shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Payments */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Pagamentos Recentes
                    </CardTitle>
                    <CardDescription>Últimos pagamentos recebidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{payment.tenant}</p>
                            <p className="text-sm text-muted-foreground">{payment.property}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{payment.amount}</p>
                            <Badge 
                              variant={
                                payment.status === "paid" ? "default" : 
                                payment.status === "pending" ? "secondary" : "destructive"
                              }
                              className="text-xs"
                            >
                              {payment.status === "paid" ? "Pago" : 
                               payment.status === "pending" ? "Pendente" : "Atrasado"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Próximas Tarefas
                    </CardTitle>
                    <CardDescription>Atividades programadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{task.task}</p>
                            <p className="text-sm text-muted-foreground">{task.date}</p>
                          </div>
                          <Badge 
                            variant={
                              task.priority === "high" ? "destructive" : 
                              task.priority === "medium" ? "default" : "secondary"
                            }
                          >
                            {task.priority === "high" ? "Alta" : 
                             task.priority === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Operações frequentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button 
                      className="h-20 flex-col space-y-2"
                      onClick={() => setShowPropertyForm(true)}
                    >
                      <Building2 className="h-6 w-6" />
                      <span>Novo Imóvel</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => setShowTenantForm(true)}
                    >
                      <Users className="h-6 w-6" />
                      <span>Novo Inquilino</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col space-y-2">
                      <FileText className="h-6 w-6" />
                      <span>Gerar Relatório</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="management">
              <PropertyManagement
                properties={properties}
                tenants={tenants}
                onUpdateProperty={handleUpdateProperty}
                onDeleteProperty={handleDeleteProperty}
                onUpdateTenant={handleUpdateTenant}
                onDeleteTenant={handleDeleteTenant}
                onUploadContract={handleUploadContract}
              />
            </TabsContent>

            <TabsContent value="repairs">
              <RepairRequest
                userType="admin"
                requests={repairRequests}
                onCreateRequest={handleCreateRepairRequest}
                onUpdateStatus={handleUpdateRepairStatus}
              />
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-4">
                {paymentProofs.filter(p => p.status === 'pending').length > 0 && (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-5 w-5 text-orange-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-orange-700">
                          Você tem {paymentProofs.filter(p => p.status === 'pending').length} comprovante(s) de pagamento pendente(s) para análise
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <PaymentProof
                  userType="admin"
                  proofs={paymentProofs.map(proof => ({
                    id: proof.id,
                    fileName: proof.fileName,
                    fileUrl: proof.fileUrl || '',
                    uploadDate: proof.uploadDate,
                    status: proof.status,
                    monthReference: proof.monthReference,
                    amount: proof.amount,
                    rejectionReason: proof.rejectionReason,
                    observation: proof.observation
                  }))}
                  onUploadProof={handleUploadPaymentProof}
                  onUpdateProofStatus={handleUpdateProofStatus}
                />
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <div className="space-y-4">
                {chatMessages.filter(m => !m.isRead && m.senderType === 'tenant').length > 0 && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <MessageSquare className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            Você tem {chatMessages.filter(m => !m.isRead && m.senderType === 'tenant').length} mensagem(ns) não lida(s) de inquilinos
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleMarkAllAsRead}
                      >
                        Marcar todas como lidas
                      </Button>
                    </div>
                  </div>
                )}
                
                <InternalChat
                  userType="admin"
                  currentUserId="admin"
                  currentUserName="Administrador"
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onMarkAsRead={handleMarkAsRead}
                />
              </div>
            </TabsContent>

            <TabsContent value="actions">
              <AdminActions
                properties={properties}
                tenants={tenants}
                onPropertyAction={handlePropertyAction}
                onTenantAction={handleTenantAction}
                onBulkAction={handleBulkAction}
              />
            </TabsContent>
          </Tabs>
        </main>

        {showPropertyForm && (
          <PropertyForm 
            onClose={() => setShowPropertyForm(false)}
            onSubmit={handlePropertySubmit}
          />
        )}

        {showTenantForm && (
          <TenantForm 
            onClose={() => setShowTenantForm(false)}
            onSubmit={handleTenantSubmit}
            properties={properties.filter(p => !p.isOccupied)}
          />
        )}
      </div>
    );
  }

  // Área do Inquilino - apenas informações do imóvel que está alugando
  const currentTenant = tenants.find(t => t.id === currentUserId);
  const currentProperty = properties.find(p => p.id === currentTenant?.propertyId);
  const tenantRepairRequests = repairRequests.filter(r => r.tenantId === currentUserId);

  const handleRequestBoleto = () => {
    toast({
      title: "Boleto solicitado!",
      description: "Seu boleto será enviado por email em até 24 horas.",
    });
  };
  
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background shadow-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-2">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Portal do Inquilino</h1>
          </div>
          <div className="ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setUserType("admin")}
            >
              Ir para Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo, {currentTenant?.name}!</h2>
          <p className="text-muted-foreground">{currentProperty?.name} - {currentProperty?.address}</p>
        </div>

        {/* Status do Aluguel */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Status do Aluguel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge 
                  className="text-lg px-4 py-2 mb-2"
                  variant={
                    currentTenant?.paymentStatus === "paid" ? "default" : 
                    currentTenant?.paymentStatus === "pending" ? "secondary" : "destructive"
                  }
                >
                  {currentTenant?.paymentStatus === "paid" ? "EM DIA" : 
                   currentTenant?.paymentStatus === "pending" ? "PENDENTE" : "VENCIDO"}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {currentTenant?.paymentStatus === "paid" ? "Pagamento em dia" : 
                   currentTenant?.paymentStatus === "pending" ? "Aguardando pagamento" : "Pagamento em atraso"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Próximo Vencimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">05/02/2024</p>
                <p className="text-sm text-muted-foreground">Valor: R$ {currentTenant?.rentAmount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Imóvel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="font-semibold">{currentProperty?.name}</p>
                <p className="text-sm text-muted-foreground">{currentProperty?.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Imóvel */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Detalhes do Imóvel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">{currentProperty?.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aluguel Mensal</p>
                <p className="font-medium">R$ {currentProperty?.rent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quartos</p>
                <p className="font-medium">{currentProperty?.bedrooms || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Banheiros</p>
                <p className="font-medium">{currentProperty?.bathrooms || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="payment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="repairs" className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Reparos</span>
            </TabsTrigger>
            <TabsTrigger value="proof" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Comprovantes</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Próximo Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">R$ {currentTenant?.rentAmount}</p>
                    <p className="text-muted-foreground">Vencimento: 05/02/2024</p>
                    <Badge 
                      className="mb-4"
                      variant={
                        currentTenant?.paymentStatus === "paid" ? "default" : 
                        currentTenant?.paymentStatus === "pending" ? "secondary" : "destructive"
                      }
                    >
                      {currentTenant?.paymentStatus === "paid" ? "Pago" : 
                       currentTenant?.paymentStatus === "pending" ? "Pendente" : "Atrasado"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button className="flex-1">Pagar Agora</Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleRequestBoleto}
                      >
                        Solicitar Boleto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded border">
                      <span>Janeiro 2024</span>
                      <Badge>Pago</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded border">
                      <span>Dezembro 2023</span>
                      <Badge>Pago</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded border">
                      <span>Novembro 2023</span>
                      <Badge>Pago</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="repairs">
            <RepairRequest
              userType="tenant"
              currentTenantId={currentTenant?.id}
              currentPropertyId={currentTenant?.propertyId}
              requests={tenantRepairRequests}
              onCreateRequest={handleCreateRepairRequest}
              onUpdateStatus={handleUpdateRepairStatus}
            />
          </TabsContent>

          <TabsContent value="proof">
            <PaymentProof
              userType="tenant"
              proofs={paymentProofs.filter(proof => proof.tenantId === currentUserId).map(proof => ({
                id: proof.id,
                fileName: proof.fileName,
                fileUrl: proof.fileUrl || '',
                uploadDate: proof.uploadDate,
                status: proof.status,
                monthReference: proof.monthReference,
                amount: proof.amount,
                rejectionReason: proof.rejectionReason,
                observation: proof.observation
              }))}
              onUploadProof={handleUploadPaymentProof}
              onUpdateProofStatus={handleUpdateProofStatus}
            />
          </TabsContent>

          <TabsContent value="chat">
            <InternalChat
              userType="tenant"
              currentUserId={currentUserId}
              currentUserName={currentTenant?.name || 'Inquilino'}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
