import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, Settings, Home, Users, MessageSquare, CreditCard, FileText, Wrench, Edit3, Trash2 } from "lucide-react";
import RealTimeChat from "@/components/RealTimeChat";
import PaymentArea from "@/components/PaymentArea";
import MercadoPagoSettings from "@/components/MercadoPagoSettings";
import { PropertyForm } from "@/components/PropertyForm";
import { PropertyManagement } from "@/components/PropertyManagement";
import { TenantForm } from "@/components/TenantForm";
import { TenantAssignment } from "@/components/TenantAssignment";
import { PaymentProof } from "@/components/PaymentProof";
import { RepairRequest } from "@/components/RepairRequest";
import LateFeeSettings from "@/components/LateFeeSettings";
import LateFeeView from "@/components/LateFeeView";
import { ReportsSystem } from "@/components/ReportsSystem";
import AdminBilling from "@/components/AdminBilling";
import UserSwitcher from "@/components/UserSwitcher";

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
  category?: string;
  priority: string;
  status: string;
  created_at: string;
  tenant_id?: string;
  property_id?: string;
  property?: { name: string };
  tenant?: { name: string };
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
    
    // Verificar se é login de inquilino por CPF (sem sessão auth)
    const tenantCpf = localStorage.getItem('tenant_cpf');
    const tenantProfile = localStorage.getItem('tenant_profile');
    
    if (!session && tenantCpf && tenantProfile) {
      const profile = JSON.parse(tenantProfile);
      setUser(profile);
      await fetchTenantData(profile.id);
      setLoading(false);
      return;
    }
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Buscar perfil do usuário autenticado
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
    console.log("Buscando dados para inquilino ID:", tenantId);

    // Buscar propriedade do inquilino
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*, payment_status")
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

    console.log("Dados de reparo encontrados:", repairsData);
    if (repairsData) setRepairRequests(repairsData as any);

    // Buscar comprovantes de pagamento do inquilino
    console.log("Buscando comprovantes para tenant_id:", tenantId);
    const { data: paymentProofsData, error: proofsError } = await supabase
      .from("payment_proofs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    console.log("Comprovantes de pagamento encontrados:", paymentProofsData);
    console.log("Erro na consulta de comprovantes:", proofsError);
    if (paymentProofsData) setPaymentProofs(paymentProofsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Limpar dados do inquilino logado por CPF
    localStorage.removeItem('tenant_cpf');
    localStorage.removeItem('tenant_profile');
    localStorage.removeItem('userType');
    navigate("/auth");
  };

  const handleCreateProperty = async (data: any) => {
    const { error } = await supabase
      .from("properties")
      .insert({
        name: data.name,
        address: data.address,
        rent_amount: parseFloat(data.rent),
        security_deposit: parseFloat(data.securityDeposit || '0'),
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
    console.log("=== INÍCIO CRIAÇÃO INQUILINO ===");
    console.log("Dados recebidos para criar inquilino:", data);
    console.log("Usuário atual:", user);
    console.log("Função está sendo chamada corretamente");
    
    try {
      console.log("1. Verificando se email já existe...");
      // Verificar se já existe um perfil com este email
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", data.email)
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao verificar email existente:", checkError);
      }

      if (existingProfile) {
        console.log("Email já existe:", existingProfile);
        toast({
          title: "Email já cadastrado",
          description: "Já existe um usuário com este email no sistema.",
          variant: "destructive",
        });
        return;
      }

      console.log("2. Email disponível, criando usuário...");
      // Criar usuário autenticado para o inquilino
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'tenant',
            cpf: data.document,
            phone: data.phone,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      console.log("3. Resultado da criação de usuário:", { authData, authError });

      if (authError) {
        console.error("Erro ao criar usuário:", authError);
        toast({
          title: "Erro ao criar usuário",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        console.error("authData.user é null/undefined");
        toast({
          title: "Erro",
          description: "Erro ao criar usuário no sistema de autenticação.",
          variant: "destructive",
        });
        return;
      }

      console.log("4. Usuário criado com sucesso, ID:", authData.user.id);

      // Aguardar um pouco para o trigger funcionar (se existir)
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("5. Verificando se perfil foi criado automaticamente...");
      const { data: autoProfile } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      console.log("Perfil automático encontrado:", autoProfile);

      let profileData;
      if (autoProfile) {
        console.log("6a. Atualizando perfil existente...");
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            name: data.name,
            email: data.email,
            role: 'tenant',
            phone: data.phone,
            cpf: data.document,
            status: 'active'
          })
          .eq("user_id", authData.user.id)
          .select("id")
          .single();

        console.log("Resultado da atualização:", { updatedProfile, updateError });
        
        if (updateError) {
          console.error("Erro ao atualizar perfil:", updateError);
          toast({
            title: "Erro ao atualizar perfil",
            description: updateError.message,
            variant: "destructive",
          });
          return;
        }
        profileData = updatedProfile;
      } else {
        console.log("6b. Criando novo perfil...");
        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: authData.user.id,
            name: data.name,
            email: data.email,
            role: 'tenant',
            phone: data.phone,
            cpf: data.document,
            status: 'active'
          })
          .select("id")
          .single();

        console.log("Resultado da criação do perfil:", { newProfile, profileError });

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          toast({
            title: "Erro ao criar perfil",
            description: profileError.message,
            variant: "destructive",
          });
          return;
        }
        profileData = newProfile;
      }

      console.log("7. Perfil criado/atualizado com ID:", profileData.id);

      console.log("8. Atualizando propriedade...", {
        propertyId: data.propertyId,
        tenantId: profileData.id,
        rentAmount: parseFloat(data.rentAmount)
      });

      // Atribuir o inquilino ao imóvel
      const { error: propertyError } = await supabase
        .from("properties")
        .update({
          is_occupied: true,
          tenant_id: profileData.id,
          contract_start_date: data.startDate,
          contract_end_date: data.endDate,
          rent_amount: parseFloat(data.rentAmount)
        })
        .eq("id", data.propertyId);

      console.log("9. Resultado da atualização da propriedade:", propertyError);

      if (propertyError) {
        console.error("Erro ao atualizar propriedade:", propertyError);
        toast({
          title: "Erro ao designar imóvel",
          description: propertyError.message,
          variant: "destructive",
        });
        return;
      }

      console.log("10. Sucesso! Finalizando...");
      toast({
        title: "Inquilino cadastrado com sucesso!",
        description: "O inquilino foi cadastrado, atribuído ao imóvel e pode fazer login com email/senha ou CPF.",
      });
      
      fetchAdminData();
      setShowTenantForm(false);

    } catch (error) {
      console.error("=== ERRO GERAL NO CADASTRO ===", error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado durante o cadastro.",
        variant: "destructive",
      });
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

  const createRepairRequest = async (request: { title: string, description: string, priority: string, category: string, tenantId: string, propertyId: string }) => {
    try {
      const { error } = await supabase
        .from('repair_requests')
        .insert([
          {
            title: request.title,
            description: request.description,
            priority: request.priority,
            category: request.category,
            tenant_id: request.tenantId,
            property_id: request.propertyId
          }
        ]);

      if (error) throw error;
      
      toast({
        title: "Solicitação criada!",
        description: "Sua solicitação de reparo foi enviada."
      });

      // Recarregar dados
      if (user?.role === 'admin') {
        fetchAdminData();
      } else {
        fetchTenantData(user?.id || '');
      }
    } catch (error) {
      console.error('Error creating repair request:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar solicitação de reparo.",
        variant: "destructive"
      });
    }
  };

  const updatePaymentProofStatus = async (proofId: string, status: string, rejectionReason?: string, observation?: string) => {
    try {
      const { error } = await supabase
        .from('payment_proofs')
        .update({ 
          status,
          rejection_reason: rejectionReason || null,
          observation: observation || null
        })
        .eq('id', proofId);

      if (error) throw error;
      
      toast({
        title: "Status atualizado!",
        description: `Comprovante ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso.`
      });

      if (user?.role === 'admin') {
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error updating payment proof:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do comprovante.",
        variant: "destructive"
      });
    }
  };

  const updateRepairRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('repair_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: "Status atualizado!",
        description: "Status da solicitação foi atualizado."
      });

      if (user?.role === 'admin') {
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error updating repair request:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProperty = async (property: any) => {
    const { error } = await supabase
      .from("properties")
      .update({
        name: property.name,
        address: property.address,
        rent_amount: parseFloat(property.rent),
        description: property.description,
        bedrooms: property.bedrooms ? parseInt(property.bedrooms) : null,
        bathrooms: property.bathrooms ? parseInt(property.bathrooms) : null,
        area: property.area ? parseFloat(property.area) : null,
      })
      .eq("id", property.id);

    if (error) {
      toast({
        title: "Erro ao atualizar propriedade",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Propriedade atualizada",
        description: "A propriedade foi atualizada com sucesso.",
      });
      fetchAdminData();
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      toast({
        title: "Erro ao excluir propriedade",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Propriedade excluída",
        description: "A propriedade foi excluída com sucesso.",
      });
      fetchAdminData();
    }
  };

  const handleUpdateTenant = async (tenant: any) => {
    console.log("=== ATUALIZANDO INQUILINO ===");
    console.log("Dados do inquilino:", tenant);
    
    // Se está atualizando apenas o status de pagamento
    if (tenant.paymentStatus) {
      console.log("Atualizando status de pagamento para:", tenant.paymentStatus);
      
      // Encontrar a propriedade do inquilino
      const property = properties.find(p => p.tenant_id === tenant.id);
      if (!property) {
        toast({
          title: "Erro",
          description: "Propriedade do inquilino não encontrada.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar o status de pagamento na propriedade
      const { error } = await supabase
        .from("properties")
        .update({
          payment_status: tenant.paymentStatus
        })
        .eq("id", property.id);

      if (error) {
        console.error("Erro ao atualizar status de pagamento:", error);
        toast({
          title: "Erro ao atualizar status de pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Status atualizado",
          description: `Status de pagamento alterado para ${tenant.paymentStatus === 'paid' ? 'Pago' : tenant.paymentStatus === 'pending' ? 'Pendente' : 'Atrasado'}.`,
        });
        fetchAdminData();
      }
    } else {
      // Atualização completa do perfil do inquilino
      const { error } = await supabase
        .from("profiles")
        .update({
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          cpf: tenant.document,
        })
        .eq("id", tenant.id);

      if (error) {
        toast({
          title: "Erro ao atualizar inquilino",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inquilino atualizado",
          description: "Os dados do inquilino foram atualizados.",
        });
        fetchAdminData();
      }
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    // Primeiro liberar propriedade
    await supabase
      .from("properties")
      .update({
        is_occupied: false,
        tenant_id: null,
        contract_start_date: null,
        contract_end_date: null,
      })
      .eq("tenant_id", tenantId);

    // Depois excluir inquilino
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", tenantId);

    if (error) {
      toast({
        title: "Erro ao excluir inquilino",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inquilino removido",
        description: "O inquilino foi removido do sistema.",
      });
      fetchAdminData();
    }
  };

  const handleUploadContract = async (propertyId: string, file: File) => {
    // Upload do arquivo para o storage
    const fileName = `contracts/${propertyId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Erro no upload",
        description: uploadError.message,
        variant: "destructive",
      });
      return;
    }

    // Atualizar URL no banco
    const { error: updateError } = await supabase
      .from("properties")
      .update({ contract_file_url: fileName })
      .eq("id", propertyId);

    if (updateError) {
      toast({
        title: "Erro ao salvar contrato",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contrato salvo",
        description: "O contrato foi anexado à propriedade.",
      });
      fetchAdminData();
    }
  };

  console.log("RealDashboard - user:", user);
  console.log("RealDashboard - user.role:", user?.role);
  console.log("RealDashboard - rendering tenant section:", user?.role === "tenant");
  console.log("RealDashboard - paymentProofs for tenant:", paymentProofs);

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
          <div className="flex items-center gap-2">
            <UserSwitcher />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {user?.role === "admin" && (
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
              <TabsTrigger value="tenants">Inquilinos</TabsTrigger>
              <TabsTrigger value="assignments">Designações</TabsTrigger>
              <TabsTrigger value="repairs">Reparos</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="billing">Meu Plano</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <PropertyManagement
                properties={properties.map(p => ({
                  id: p.id,
                  name: p.name,
                  rent: p.rent_amount.toString(),
                  address: p.address,
                  description: p.description,
                  bedrooms: p.bedrooms?.toString(),
                  bathrooms: p.bathrooms?.toString(),
                  area: p.area?.toString(),
                  isOccupied: p.is_occupied,
                  tenantId: p.tenant_id,
                  contractFile: p.contract_file_url,
                  contractStartDate: p.contract_start_date,
                  contractEndDate: p.contract_end_date
                }))}
                tenants={tenants.map(t => ({
                  id: t.id,
                  name: t.name,
                  email: t.email,
                  phone: t.phone,
                  document: t.cpf,
                  propertyId: properties.find(p => p.tenant_id === t.id)?.id || '',
                  rentAmount: properties.find(p => p.tenant_id === t.id)?.rent_amount.toString(),
                  startDate: properties.find(p => p.tenant_id === t.id)?.contract_start_date,
                  endDate: properties.find(p => p.tenant_id === t.id)?.contract_end_date,
                  paymentStatus: (properties.find(p => p.tenant_id === t.id) as any)?.payment_status || 'pending' as const
                }))}
                onUpdateProperty={handleUpdateProperty}
                onDeleteProperty={handleDeleteProperty}
                onUpdateTenant={handleUpdateTenant}
                onDeleteTenant={handleDeleteTenant}
                onUploadContract={handleUploadContract}
                onCreateProperty={() => setShowPropertyForm(true)}
              />
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
                             <div className="flex gap-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleUpdateTenant(tenant)}
                                 title="Editar inquilino"
                               >
                                 <Edit3 className="h-4 w-4" />
                               </Button>
                               <Button
                                 variant="destructive"
                                 size="sm"
                                 onClick={() => handleDeleteTenant(tenant.id)}
                                 title="Excluir inquilino"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
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
              <RepairRequest
                userType="admin"
                requests={repairRequests.map(req => ({
                  id: req.id,
                  title: req.title,
                  description: req.description,
                  category: 'other' as const,
                  priority: req.priority as any,
                  status: req.status as any,
                  requestDate: new Date(req.created_at).toLocaleDateString(),
                  tenantId: req.tenant_id || '',
                  propertyId: req.property_id || ''
                }))}
                onCreateRequest={(request) => createRepairRequest({
                  title: request.title,
                  description: request.description,
                  priority: request.priority,
                  category: request.category,
                  tenantId: request.tenantId,
                  propertyId: request.propertyId
                })}
                onUpdateStatus={updateRepairRequestStatus}
              />
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-6">
                <PaymentProof
                  userType="admin"
                  proofs={paymentProofs.map(proof => ({
                    id: proof.id,
                    fileName: proof.file_name,
                    fileUrl: proof.file_url,
                    uploadDate: proof.created_at,
                    status: proof.status,
                    monthReference: proof.reference_month,
                    amount: proof.amount.toString(),
                    rejectionReason: proof.rejection_reason,
                    observation: proof.observation
                  }))}
                  onUploadProof={handleUploadPaymentProof}
                  onUpdateProofStatus={updatePaymentProofStatus}
                />
              </div>
            </TabsContent>

            <TabsContent value="billing">
              <AdminBilling />
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <MercadoPagoSettings adminId={user.id} />
                <LateFeeSettings adminId={user.id} />
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <ReportsSystem 
                properties={properties.map(p => ({
                  id: p.id,
                  name: p.name,
                  address: p.address,
                  rent_amount: p.rent_amount,
                  is_occupied: p.is_occupied,
                  tenant_id: p.tenant_id || undefined
                }))}
                tenants={tenants.map(t => ({
                  id: t.id,
                  name: t.name,
                  email: t.email,
                  property_id: properties.find(p => p.tenant_id === t.id)?.id
                }))}
                payments={paymentProofs.map(proof => ({
                  id: proof.id,
                  amount: proof.amount,
                  status: proof.status,
                  reference_month: proof.reference_month,
                  tenant_id: proof.tenant_id,
                  property_id: proof.property_id
                }))}
                repairRequests={repairRequests.map(req => ({
                  id: req.id,
                  title: req.title,
                  description: req.description,
                  category: 'other' as const,
                  priority: req.priority,
                  status: req.status,
                  requestDate: new Date(req.created_at).toLocaleDateString(),
                  tenantId: req.tenant_id || '',
                  propertyId: req.property_id || ''
                }))}
              />
            </TabsContent>

            <TabsContent value="chat">
              <RealTimeChat currentUser={user} />
            </TabsContent>
          </Tabs>
        )}

        {user?.role === "tenant" && (
          <Tabs defaultValue="property" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="property">Meu Imóvel</TabsTrigger>
              <TabsTrigger value="repairs">Reparos</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="fees">Taxas</TabsTrigger>
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
                      
                      {/* Status de Pagamento */}
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <h4 className="font-medium">Status de Pagamento</h4>
                        <div className="flex items-center gap-2 mt-2">
                          {(userProperty as any).payment_status === 'paid' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Pago
                            </span>
                          )}
                          {(userProperty as any).payment_status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⏳ Pendente
                            </span>
                          )}
                          {(userProperty as any).payment_status === 'overdue' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ Atrasado
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground ml-2">
                            Status do pagamento do mês atual
                          </span>
                        </div>
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
                requests={repairRequests.map(req => ({
                  id: req.id,
                  title: req.title,
                  description: req.description,
                  category: (req.category || 'other') as "other" | "electrical" | "plumbing" | "structural" | "appliance",
                  priority: req.priority as any,
                  status: req.status as any,
                  requestDate: new Date(req.created_at).toLocaleDateString(),
                  tenantId: req.tenant_id || '',
                  propertyId: req.property_id || ''
                }))}
                onCreateRequest={(request) => createRepairRequest({
                  title: request.title,
                  description: request.description,
                  priority: request.priority,
                  category: request.category,
                  tenantId: request.tenantId,
                  propertyId: request.propertyId
                })}
                onUpdateStatus={updateRepairRequestStatus}
              />
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-6">
                <PaymentProof
                  userType="tenant"
                  proofs={paymentProofs.map(proof => ({
                    id: proof.id,
                    fileName: proof.file_name,
                    fileUrl: proof.file_url,
                    uploadDate: proof.created_at,
                    status: proof.status,
                    monthReference: proof.reference_month,
                    amount: proof.amount.toString(),
                    rejectionReason: proof.rejection_reason,
                    observation: proof.observation
                  }))}
                  onUploadProof={handleUploadPaymentProof}
                  onUpdateProofStatus={updatePaymentProofStatus}
                />
              </div>
            </TabsContent>

            <TabsContent value="fees">
              {userProperty ? (
                <LateFeeView 
                  tenantId={user.id} 
                  propertyId={userProperty.id} 
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">
                      Você precisa estar associado a uma propriedade para visualizar as taxas.
                    </p>
                  </CardContent>
                </Card>
              )}
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