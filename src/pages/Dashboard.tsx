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

const Dashboard = () => {
  // Simular usuário logado - em produção seria baseado na autenticação real
  const [userType] = useState<"admin" | "tenant">("tenant"); // Mudando para tenant para demonstrar
  const [currentUserId] = useState("1"); // ID do usuário atual
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
    // Simular upload do arquivo
    const fileName = file.name;
    setProperties(prev => prev.map(prop => 
      prop.id === propertyId 
        ? { ...prop, contractFile: fileName }
        : prop
    ));
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

  if (userType === "admin") {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-background shadow-card">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">RentManager Pro</h1>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagens
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Dashboard do Administrador</h2>
            <p className="text-muted-foreground">Visão geral do seu portfólio de imóveis</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Gerenciar</span>
              </TabsTrigger>
              <TabsTrigger value="repairs" className="flex items-center space-x-2">
                <Wrench className="h-4 w-4" />
                <span>Reparos</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Ações Avançadas</span>
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
        </div>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo, {currentTenant?.name}!</h2>
          <p className="text-muted-foreground">{currentProperty?.name} - {currentProperty?.address}</p>
        </div>

        {/* Informações do Imóvel */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Informações do Imóvel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">{currentProperty?.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aluguel</p>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="repairs" className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Reparos</span>
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
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
