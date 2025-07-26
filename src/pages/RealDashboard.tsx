import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, Settings, Home, Users, MessageSquare, CreditCard, FileText, Wrench } from "lucide-react";
import RealTimeChat from "@/components/RealTimeChat";
import PaymentArea from "@/components/PaymentArea";
import MercadoPagoSettings from "@/components/MercadoPagoSettings";
import { PropertyForm } from "@/components/PropertyForm";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf?: string;
  phone?: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  rent_amount: number;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  is_occupied: boolean;
  tenant_id?: string;
}

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  property: {
    name: string;
  };
  tenant: {
    name: string;
  };
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [userProperty, setUserProperty] = useState<Property | null>(null);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Buscar perfil do usuário
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      navigate("/auth");
      return;
    }

    setUser(profile);
    
    if (profile.role === "admin") {
      await fetchAdminData();
    } else {
      await fetchTenantData(profile.id);
    }
    
    setLoading(false);
  };

  const fetchAdminData = async () => {
    // Buscar propriedades
    const { data: propertiesData } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (propertiesData) setProperties(propertiesData);

    // Buscar solicitações de reparo
    const { data: repairsData } = await supabase
      .from("repair_requests")
      .select(`
        *,
        property:properties(name),
        tenant:profiles(name)
      `)
      .order("created_at", { ascending: false });

    if (repairsData) setRepairRequests(repairsData as any);
  };

  const fetchTenantData = async (tenantId: string) => {
    // Buscar propriedade do inquilino
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (propertyData) setUserProperty(propertyData);

    // Buscar solicitações de reparo do inquilino
    const { data: repairsData } = await supabase
      .from("repair_requests")
      .select(`
        *,
        property:properties(name),
        tenant:profiles(name)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (repairsData) setRepairRequests(repairsData as any);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createRepairRequest = async (title: string, description: string, priority: string) => {
    if (!user || !userProperty) return;

    const { error } = await supabase
      .from("repair_requests")
      .insert({
        tenant_id: user.id,
        property_id: userProperty.id,
        title,
        description,
        priority,
      });

    if (error) {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Solicitação criada",
        description: "Sua solicitação de reparo foi enviada com sucesso.",
      });
      fetchTenantData(user.id);
    }
  };

  const updateRepairStatus = async (requestId: string, status: string) => {
    const { error } = await supabase
      .from("repair_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado",
        description: "O status da solicitação foi atualizado.",
      });
      fetchAdminData();
    }
  };

  const handleCreateProperty = async (data: any) => {
    const { error } = await supabase
      .from("properties")
      .insert({
        name: data.name,
        address: data.address,
        rent_amount: parseFloat(data.rent),
        description: data.description,
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseInt(data.bathrooms),
        area: parseFloat(data.area),
      });

    if (error) {
      toast({
        title: "Erro ao criar propriedade",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Propriedade criada",
        description: "A propriedade foi cadastrada com sucesso.",
      });
      fetchAdminData();
      setShowPropertyForm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Home className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Sistema de Gerenciamento</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {user.name} ({user.role === "admin" ? "Administrador" : "Inquilino"})
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {user.role === "admin" ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
              <TabsTrigger value="repairs">Reparos</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Propriedades</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{properties.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Propriedades Ocupadas</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {properties.filter(p => p.is_occupied).length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {repairRequests.filter(r => r.status === "pending").length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Solicitações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {repairRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.property.name} • {request.tenant.name}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => updateRepairStatus(request.id, "in_progress")}>
                                Aceitar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateRepairStatus(request.id, "completed")}>
                                Concluir
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Gerenciar Propriedades</CardTitle>
                  <Button onClick={() => setShowPropertyForm(true)}>
                    Cadastrar Propriedade
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{property.name}</h3>
                          <p className="text-sm text-muted-foreground">{property.address}</p>
                          <p className="text-sm">R$ {property.rent_amount.toFixed(2)}</p>
                        </div>
                        <div className="text-sm">
                          {property.is_occupied ? "Ocupada" : "Disponível"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="repairs">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Reparo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {repairRequests.map((request) => (
                      <div key={request.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{request.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                            <p className="text-sm">
                              <span className="font-medium">Propriedade:</span> {request.property.name}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Inquilino:</span> {request.tenant.name}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Prioridade:</span> {request.priority}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => updateRepairStatus(request.id, "in_progress")}>
                                  Em Andamento
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => updateRepairStatus(request.id, "completed")}>
                                  Concluir
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <RealTimeChat currentUser={user} />
            </TabsContent>

            <TabsContent value="settings">
              <MercadoPagoSettings adminId={user.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="repairs">Reparos</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {userProperty ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Minha Propriedade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">{userProperty.name}</h3>
                        <p className="text-muted-foreground">{userProperty.address}</p>
                        <p className="text-lg font-semibold text-primary">
                          Aluguel: R$ {userProperty.rent_amount.toFixed(2)}
                        </p>
                        {userProperty.description && (
                          <p className="text-sm">{userProperty.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {userProperty.bedrooms && <span>{userProperty.bedrooms} quartos</span>}
                          {userProperty.bathrooms && <span>{userProperty.bathrooms} banheiros</span>}
                          {userProperty.area && <span>{userProperty.area}m²</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Solicitações de Reparo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{repairRequests.length}</div>
                        <p className="text-sm text-muted-foreground">
                          {repairRequests.filter(r => r.status === "pending").length} pendentes
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Status dos Pagamentos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">Em dia</div>
                        <p className="text-sm text-muted-foreground">Próximo vencimento em breve</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">
                      Você ainda não foi associado a nenhuma propriedade. 
                      Entre em contato com o administrador.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="payments">
              {userProperty ? (
                <PaymentArea 
                  tenantId={user.id}
                  propertyId={userProperty.id}
                  rentAmount={userProperty.rent_amount}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">
                      Você precisa estar associado a uma propriedade para fazer pagamentos.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="repairs">
              <div className="space-y-6">
                {userProperty && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Nova Solicitação de Reparo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        createRepairRequest(
                          formData.get("title") as string,
                          formData.get("description") as string,
                          formData.get("priority") as string
                        );
                        e.currentTarget.reset();
                      }} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Título</label>
                          <input 
                            name="title" 
                            className="w-full p-2 border rounded-md" 
                            required 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Descrição</label>
                          <textarea 
                            name="description" 
                            className="w-full p-2 border rounded-md" 
                            rows={3}
                            required 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Prioridade</label>
                          <select name="priority" className="w-full p-2 border rounded-md" required>
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </div>
                        <Button type="submit">Enviar Solicitação</Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Minhas Solicitações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {repairRequests.map((request) => (
                        <div key={request.id} className="p-4 border rounded-lg">
                          <h3 className="font-medium">{request.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span>Prioridade: {request.priority}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              request.status === "completed" ? "bg-green-100 text-green-800" :
                              request.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {request.status === "completed" ? "Concluído" :
                               request.status === "in_progress" ? "Em andamento" :
                               "Pendente"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <RealTimeChat currentUser={user} />
            </TabsContent>
          </Tabs>
        )}

        {/* Modal do formulário de propriedade */}
        {showPropertyForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Cadastrar Nova Propriedade</h2>
              <PropertyForm
                onClose={() => setShowPropertyForm(false)}
                onSubmit={handleCreateProperty}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;