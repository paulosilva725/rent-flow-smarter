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
import { TenantForm } from "@/components/TenantForm";
import { TenantAssignment } from "@/components/TenantAssignment";
import { PaymentProof } from "@/components/PaymentProof";
import { RepairRequest } from "@/components/RepairRequest";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf?: string;
  phone?: string;
  status?: string;
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
  contract_start_date?: string;
  contract_end_date?: string;
  contract_file_url?: string;
}

interface RepairRequestData {
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
  const [tenants, setTenants] = useState<User[]>([]);
  const [userProperty, setUserProperty] = useState<Property | null>(null);
  const [repairRequests, setRepairRequests] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
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

    // Buscar inquilinos
    const { data: tenantsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "tenant");

    if (tenantsData) setTenants(tenantsData);

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

    // Buscar comprovantes de pagamento
    const { data: paymentProofsData } = await supabase
      .from("payment_proofs")
      .select("*")
      .order("created_at", { ascending: false });

    if (paymentProofsData) setPaymentProofs(paymentProofsData);
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

    // Buscar comprovantes de pagamento do inquilino
    const { data: paymentProofsData } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (paymentProofsData) setPaymentProofs(paymentProofsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
        contract_start_date: data.contractStartDate || null,
        contract_end_date: data.contractEndDate || null,
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

  const handleCreateTenant = async (data: any) => {
    // Primeiro criar o perfil do inquilino
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: "tempPassword123!", // Senha temporária
      options: {
        data: {
          name: data.name,
          role: 'tenant',
        }
      }
    });

    if (authError) {
      toast({
        title: "Erro ao criar inquilino",
        description: authError.message,
        variant: "destructive",
      });
      return;
    }

    // Atualizar o perfil com informações adicionais
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone: data.phone,
          cpf: data.document,
        })
        .eq("user_id", authData.user.id);

      // Atribuir ao imóvel
      const { error: propertyError } = await supabase
        .from("properties")
        .update({
          is_occupied: true,
          tenant_id: authData.user.id,
          contract_start_date: data.startDate,
          contract_end_date: data.endDate,
        })
        .eq("id", data.propertyId);

      if (profileError || propertyError) {
        toast({
          title: "Erro ao finalizar cadastro",
          description: "Dados criados mas houve erro na configuração.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inquilino cadastrado",
          description: "O inquilino foi cadastrado e atribuído ao imóvel.",
        });
        fetchAdminData();
        setShowTenantForm(false);
      }
    }
  };

  const handleAssignTenant = async (propertyId: string, tenantId: string, contractStartDate: string, contractEndDate: string) => {
    const { error } = await supabase
      .from("properties")
      .update({
        is_occupied: true,
        tenant_id: tenantId,
        contract_start_date: contractStartDate,
        contract_end_date: contractEndDate,
      })
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Erro ao designar inquilino",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchAdminData();
    }
  };

  const handleUnassignTenant = async (propertyId: string) => {
    const { error } = await supabase
      .from("properties")
      .update({
        is_occupied: false,
        tenant_id: null,
        contract_start_date: null,
        contract_end_date: null,
      })
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Erro ao remover inquilino",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchAdminData();
    }
  };

  const handleUploadPaymentProof = async (file: File, monthReference: string, amount: string) => {
    if (!user?.id) return;

    // Upload do arquivo para o storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Erro no upload",
        description: uploadError.message,
        variant: "destructive",
      });
      return;
    }

    // Criar registro no banco
    const { error: insertError } = await supabase
      .from("payment_proofs")
      .insert({
        tenant_id: user.id,
        property_id: userProperty?.id,
        file_name: file.name,
        file_url: fileName,
        reference_month: monthReference,
        amount: parseFloat(amount),
        status: 'pending',
      });

    if (insertError) {
      toast({
        title: "Erro ao salvar comprovante",
        description: insertError.message,
        variant: "destructive",
      });
    } else {
      fetchTenantData(user.id);
    }
  };

  const handleUpdateProofStatus = async (proofId: string, status: string, reason?: string) => {
    const updateData: any = { status };
    if (reason) updateData.rejection_reason = reason;

    const { error } = await supabase
      .from("payment_proofs")
      .update(updateData)
      .eq("id", proofId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchAdminData();
    }
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
        {user?.role === "admin" && (
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
              <TabsTrigger value="tenants">Inquilinos</TabsTrigger>
              <TabsTrigger value="assignments">Designações</TabsTrigger>
              <TabsTrigger value="repairs">Reparos</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

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
                    {properties.length === 0 ? (
                      <p className="text-muted-foreground">Nenhuma propriedade cadastrada.</p>
                    ) : (
                      properties.map((property) => {
                        const tenant = tenants.find(t => t.id === property.tenant_id);
                        const contractStatus = property.contract_end_date ? 
                          Math.ceil((new Date(property.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                        
                        return (
                          <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h3 className="font-medium">{property.name}</h3>
                              <p className="text-sm text-muted-foreground">{property.address}</p>
                              <p className="text-sm">R$ {property.rent_amount.toFixed(2)}</p>
                              {property.is_occupied && tenant && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm"><strong>Inquilino:</strong> {tenant.name}</p>
                                  {property.contract_start_date && (
                                    <p className="text-xs text-muted-foreground">
                                      Contrato: {new Date(property.contract_start_date).toLocaleDateString('pt-BR')} - {property.contract_end_date ? new Date(property.contract_end_date).toLocaleDateString('pt-BR') : 'N/A'}
                                    </p>
                                  )}
                                  {contractStatus !== null && (
                                    <p className={`text-xs ${contractStatus <= 0 ? 'text-red-600' : contractStatus <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {contractStatus <= 0 ? `Vencido há ${Math.abs(contractStatus)} dias` : 
                                       contractStatus <= 30 ? `Vence em ${contractStatus} dias` : 
                                       'Contrato em dia'}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-sm">
                              {property.is_occupied ? "Ocupada" : "Disponível"}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tenants">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Gerenciar Inquilinos</CardTitle>
                  <Button onClick={() => setShowTenantForm(true)}>
                    Cadastrar Inquilino
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenants.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum inquilino cadastrado.</p>
                    ) : (
                      tenants.map((tenant) => {
                        const property = properties.find(p => p.tenant_id === tenant.id);
                        return (
                          <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{tenant.name}</h3>
                              <p className="text-sm text-muted-foreground">{tenant.email}</p>
                              <p className="text-sm text-muted-foreground">Status: {tenant.status || 'ativo'}</p>
                              {property && (
                                <p className="text-sm text-muted-foreground">Imóvel: {property.name}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments">
              <TenantAssignment
                properties={properties}
                tenants={tenants.map(t => ({ ...t, status: t.status || 'active' }))}
                onAssignTenant={handleAssignTenant}
                onUnassignTenant={handleUnassignTenant}
              />
            </TabsContent>

            <TabsContent value="repairs">
              <div className="space-y-4">
                {repairRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <h3 className="font-medium">{request.title}</h3>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                    <p className="text-sm">Status: {request.status}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-6">
                <PaymentProof
                  userType="admin"
                  proofs={paymentProofs}
                  onUpdateProofStatus={handleUpdateProofStatus}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <MercadoPagoSettings adminId={user.id} />
            </TabsContent>
          </Tabs>
        )}

        {user?.role === "tenant" && (
          <Tabs defaultValue="property" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="property">Meu Imóvel</TabsTrigger>
              <TabsTrigger value="repairs">Reparos</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="property">
              {userProperty ? (
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
                      {userProperty.contract_start_date && userProperty.contract_end_date && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <h4 className="font-medium">Informações do Contrato</h4>
                          <p className="text-sm">Início: {new Date(userProperty.contract_start_date).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm">Fim: {new Date(userProperty.contract_end_date).toLocaleDateString('pt-BR')}</p>
                          {(() => {
                            const daysUntilExpiry = Math.ceil((new Date(userProperty.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            if (daysUntilExpiry <= 0) {
                              return <p className="text-sm text-red-600">⚠️ Contrato vencido há {Math.abs(daysUntilExpiry)} dias</p>;
                            } else if (daysUntilExpiry <= 30) {
                              return <p className="text-sm text-yellow-600">⚠️ Contrato vence em {daysUntilExpiry} dias</p>;
                            }
                            return <p className="text-sm text-green-600">✅ Contrato em dia</p>;
                          })()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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

            <TabsContent value="repairs">
              <RepairRequest
                userType="tenant"
                currentTenantId={user.id}
                currentPropertyId={userProperty?.id}
                requests={repairRequests}
                onCreateRequest={createRepairRequest}
              />
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-6">
                <PaymentProof
                  userType="tenant"
                  proofs={paymentProofs}
                  onUploadProof={handleUploadPaymentProof}
                />
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <RealTimeChat currentUser={user} />
            </TabsContent>
          </Tabs>
        )}

        {/* Modal do formulário de propriedade */}
        {showPropertyForm && (
          <PropertyForm
            onClose={() => setShowPropertyForm(false)}
            onSubmit={handleCreateProperty}
          />
        )}

        {/* Modal do formulário de inquilino */}
        {showTenantForm && (
          <TenantForm
            onClose={() => setShowTenantForm(false)}
            onSubmit={handleCreateTenant}
            properties={properties.filter(p => !p.is_occupied).map(p => ({ 
              id: p.id, 
              name: p.name, 
              rent: p.rent_amount.toString() 
            }))}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;