import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  name: string;
  address: string;
  rent_amount: number;
  is_occupied: boolean;
  tenant_id?: string;
  contract_start_date?: string;
  contract_end_date?: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  status: string;
  role: string;
}

interface TenantAssignmentProps {
  properties: Property[];
  tenants: Tenant[];
  onAssignTenant: (propertyId: string, tenantId: string, contractStartDate: string, contractEndDate: string) => void;
  onUnassignTenant: (propertyId: string) => void;
}

export const TenantAssignment = ({ 
  properties, 
  tenants, 
  onAssignTenant, 
  onUnassignTenant 
}: TenantAssignmentProps) => {
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const { toast } = useToast();

  // Filtrar apenas inquilinos sem propriedade atribuída
  const availableTenants = tenants.filter(tenant => 
    tenant.role === 'tenant' && 
    !properties.some(property => property.tenant_id === tenant.id)
  );

  // Verificar contratos vencendo ou vencidos
  const getContractStatus = (endDate?: string) => {
    if (!endDate) return null;
    
    const today = new Date();
    const contractEnd = new Date(endDate);
    const daysUntilExpiry = Math.ceil((contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { type: 'expired', days: Math.abs(daysUntilExpiry), color: 'destructive' };
    } else if (daysUntilExpiry <= 30) {
      return { type: 'expiring', days: daysUntilExpiry, color: 'secondary' };
    }
    
    return null;
  };

  const handleAssignment = () => {
    if (!selectedProperty || !selectedTenant || !contractStartDate || !contractEndDate) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se a data de fim é posterior à data de início
    if (new Date(contractEndDate) <= new Date(contractStartDate)) {
      toast({
        title: "Datas inválidas",
        description: "A data de fim deve ser posterior à data de início.",
        variant: "destructive"
      });
      return;
    }

    onAssignTenant(selectedProperty, selectedTenant, contractStartDate, contractEndDate);
    
    // Limpar formulário
    setSelectedProperty("");
    setSelectedTenant("");
    setContractStartDate("");
    setContractEndDate("");
    
    toast({
      title: "Inquilino designado",
      description: "O inquilino foi designado ao imóvel com sucesso."
    });
  };

  const handleUnassignment = (propertyId: string) => {
    onUnassignTenant(propertyId);
    toast({
      title: "Inquilino removido",
      description: "O inquilino foi removido do imóvel."
    });
  };

  return (
    <div className="space-y-6">
      {/* Designar Inquilino */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Designar Inquilino para Imóvel
          </CardTitle>
          <CardDescription>
            Atribua um inquilino a um imóvel disponível e defina as datas do contrato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Imóvel Disponível
              </label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {properties
                    .filter(property => !property.is_occupied)
                    .map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} - R$ {property.rent_amount}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Inquilino Disponível
              </label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um inquilino" />
                </SelectTrigger>
                <SelectContent>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Data Início do Contrato
              </label>
              <input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Data Fim do Contrato
              </label>
              <input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <Button 
            onClick={handleAssignment}
            disabled={!selectedProperty || !selectedTenant || !contractStartDate || !contractEndDate}
            className="w-full"
          >
            Designar Inquilino
          </Button>
        </CardContent>
      </Card>

      {/* Status dos Contratos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Status dos Contratos
          </CardTitle>
          <CardDescription>
            Visualize todos os imóveis ocupados e o status dos contratos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imóvel</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Início do Contrato</TableHead>
                <TableHead>Fim do Contrato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties
                .filter(property => property.is_occupied && property.tenant_id)
                .map((property) => {
                  const tenant = tenants.find(t => t.id === property.tenant_id);
                  const contractStatus = getContractStatus(property.contract_end_date);
                  
                  return (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.name}</TableCell>
                      <TableCell>{tenant?.name || "N/A"}</TableCell>
                      <TableCell>
                        {property.contract_start_date ? 
                          new Date(property.contract_start_date).toLocaleDateString('pt-BR') : 
                          "N/A"
                        }
                      </TableCell>
                      <TableCell>
                        {property.contract_end_date ? 
                          new Date(property.contract_end_date).toLocaleDateString('pt-BR') : 
                          "N/A"
                        }
                      </TableCell>
                      <TableCell>
                        {contractStatus ? (
                          <Badge variant={contractStatus.color as any} className="flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>
                              {contractStatus.type === 'expired' 
                                ? `Vencido há ${contractStatus.days} dias`
                                : `Vence em ${contractStatus.days} dias`
                              }
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="default">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnassignment(property.id)}
                        >
                          Remover Inquilino
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};