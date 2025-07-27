import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserSwitcher from "@/components/UserSwitcher";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import PlanManagement from "@/components/PlanManagement";
import UserBlockManagement from "@/components/UserBlockManagement";
import EditAdminProfile from "@/components/EditAdminProfile";

interface PropertyOwner {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  created_at: string;
  subscription?: {
    id: string;
    plan_type: string;
    status: string;
    trial_end_date: string;
    next_payment_date: string;
    monthly_amount: number;
    is_blocked?: boolean;
    block_reason?: string;
    current_users_count?: number;
  };
}

export default function SystemDashboard() {
  const navigate = useNavigate();
  const [propertyOwners, setPropertyOwners] = useState<PropertyOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    // Check if user is authenticated as system owner
    const systemSession = localStorage.getItem('system_owner_session');
    if (!systemSession) {
      navigate('/auth');
      return;
    }
    
    fetchPropertyOwners();
  }, [navigate]);

  const fetchPropertyOwners = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          cpf,
          phone,
          created_at,
          system_subscriptions (
            id,
            plan_type,
            status,
            trial_end_date,
            next_payment_date,
            monthly_amount,
            is_blocked,
            block_reason,
            current_users_count
          )
        `)
        .eq("role", "admin");

      if (profilesError) throw profilesError;

      const formattedData = profiles?.map(profile => ({
        ...profile,
        subscription: profile.system_subscriptions?.[0] || null
      })) || [];

      setPropertyOwners(formattedData);
    } catch (error) {
      console.error("Error fetching property owners:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar proprietários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (ownerId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from("system_subscriptions")
        .update(updates)
        .eq("owner_id", ownerId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura atualizada com sucesso"
      });

      fetchPropertyOwners();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar assinatura",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      trial: { label: "Trial", variant: "secondary" as const },
      active: { label: "Ativo", variant: "default" as const },
      expired: { label: "Expirado", variant: "destructive" as const },
      cancelled: { label: "Cancelado", variant: "outline" as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPlanLabel = (plan: string) => {
    const planMap = {
      basic: "Básico",
      premium: "Premium", 
      enterprise: "Enterprise"
    };
    return planMap[plan as keyof typeof planMap] || plan;
  };

  const getTrialDaysLeft = (trialEndDate: string) => {
    const daysLeft = Math.ceil((new Date(trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const stats = {
    totalOwners: propertyOwners.length,
    activeSubscriptions: propertyOwners.filter(o => o.subscription?.status === 'active').length,
    trialUsers: propertyOwners.filter(o => o.subscription?.status === 'trial').length,
    revenue: propertyOwners
      .filter(o => o.subscription?.status === 'active')
      .reduce((sum, o) => sum + (o.subscription?.monthly_amount || 0), 0)
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard do Sistema</h1>
        <div className="flex gap-2">
          <UserSwitcher />
          <Button onClick={fetchPropertyOwners}>Atualizar</Button>
          <Button 
            variant="outline" 
            onClick={() => {
              localStorage.removeItem('system_owner_session');
              navigate('/auth');
            }}
          >
            Sair
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Proprietários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOwners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários em Trial</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Property Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Proprietários</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Trial/Próximo Pagamento</TableHead>
                <TableHead>Ações</TableHead>
                <TableHead>Controle</TableHead>
                <TableHead>Editar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertyOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium">{owner.name}</TableCell>
                  <TableCell>{owner.email}</TableCell>
                  <TableCell>
                    {owner.subscription ? getPlanLabel(owner.subscription.plan_type) : "Sem plano"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {owner.subscription ? getStatusBadge(owner.subscription.status) : "Sem assinatura"}
                      {owner.subscription?.is_blocked && (
                        <Badge variant="destructive">Bloqueado</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {owner.subscription?.current_users_count || 0} usuários
                    </span>
                  </TableCell>
                  <TableCell>
                    {owner.subscription?.status === 'trial' ? (
                      <span className="text-orange-600">
                        {getTrialDaysLeft(owner.subscription.trial_end_date)} dias restantes
                      </span>
                    ) : owner.subscription?.next_payment_date ? (
                      formatDistanceToNow(new Date(owner.subscription.next_payment_date), {
                        addSuffix: true,
                        locale: ptBR
                      })
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Select 
                        onValueChange={(value) => updateSubscription(owner.id, { status: value })}
                        defaultValue={owner.subscription?.status}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="expired">Expirado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select 
                        onValueChange={(value) => {
                          const amounts = { basic: 29.90, premium: 79.90, enterprise: 199.90 };
                          updateSubscription(owner.id, { 
                            plan_type: value,
                            monthly_amount: amounts[value as keyof typeof amounts]
                          });
                        }}
                        defaultValue={owner.subscription?.plan_type}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <UserBlockManagement owner={owner} onUpdate={fetchPropertyOwners} />
                  </TableCell>
                  <TableCell>
                    <EditAdminProfile owner={owner} onUpdate={fetchPropertyOwners} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Plan Management */}
      <PlanManagement />
    </div>
  );
}