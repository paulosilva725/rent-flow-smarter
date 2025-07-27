import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Edit } from "lucide-react";

interface PlanConfig {
  id: string;
  plan_type: string;
  monthly_amount: number;
  max_users: number;
  max_properties: number;
  features: string[];
  is_active: boolean;
}

export default function PlanManagement() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plan_configurations")
        .select("*")
        .order("monthly_amount");

      if (error) throw error;
      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features.filter((f): f is string => typeof f === 'string') : []
      })));
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId: string, updates: Partial<PlanConfig>) => {
    try {
      const { error } = await supabase
        .from("plan_configurations")
        .update(updates)
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso"
      });

      fetchPlans();
      setIsDialogOpen(false);
      setEditingPlan(null);
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano",
        variant: "destructive"
      });
    }
  };

  const handleEditPlan = (plan: PlanConfig) => {
    setEditingPlan({ ...plan });
    setIsDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!editingPlan) return;

    updatePlan(editingPlan.id, {
      monthly_amount: editingPlan.monthly_amount,
      max_users: editingPlan.max_users,
      max_properties: editingPlan.max_properties,
      is_active: editingPlan.is_active
    });
  };

  const getPlanLabel = (planType: string) => {
    const labels = {
      basic: "Básico",
      premium: "Premium",
      enterprise: "Enterprise"
    };
    return labels[planType as keyof typeof labels] || planType;
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de Planos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Valor Mensal</TableHead>
              <TableHead>Máx. Usuários</TableHead>
              <TableHead>Máx. Propriedades</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  {getPlanLabel(plan.plan_type)}
                </TableCell>
                <TableCell>R$ {plan.monthly_amount.toFixed(2)}</TableCell>
                <TableCell>{plan.max_users}</TableCell>
                <TableCell>{plan.max_properties}</TableCell>
                <TableCell>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Editar Plano {editingPlan && getPlanLabel(editingPlan.plan_type)}
              </DialogTitle>
            </DialogHeader>
            {editingPlan && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthly_amount">Valor Mensal (R$)</Label>
                  <Input
                    id="monthly_amount"
                    type="number"
                    step="0.01"
                    value={editingPlan.monthly_amount}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      monthly_amount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_users">Máximo de Usuários</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={editingPlan.max_users}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      max_users: parseInt(e.target.value) || 1
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="max_properties">Máximo de Propriedades</Label>
                  <Input
                    id="max_properties"
                    type="number"
                    value={editingPlan.max_properties}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      max_properties: parseInt(e.target.value) || 1
                    })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPlan.is_active}
                    onCheckedChange={(checked) => setEditingPlan({
                      ...editingPlan,
                      is_active: checked
                    })}
                  />
                  <Label>Plano Ativo</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSavePlan} className="flex-1">
                    Salvar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}