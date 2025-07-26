import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ReportsSystem } from "./ReportsSystem";
import LateFeeSettings from "./LateFeeSettings";
import { 
  Building2, 
  Users, 
  MessageSquare,
  FileText,
  TrendingUp,
  Calendar,
  Settings,
  Search,
  Filter,
  Download
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  rent: string;
  address: string;
  isOccupied: boolean;
  tenantId?: string;
  contractFile?: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  propertyId: string;
  rentAmount?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
}

interface AdminActionsProps {
  properties: Property[];
  tenants: Tenant[];
  payments?: any[];
  repairRequests?: any[];
  onPropertyAction: (action: string, propertyId: string) => void;
  onTenantAction: (action: string, tenantId: string) => void;
  onBulkAction: (action: string, ids: string[]) => void;
}

export const AdminActions = ({ 
  properties, 
  tenants,
  payments = [],
  repairRequests = [],
  onPropertyAction,
  onTenantAction,
  onBulkAction 
}: AdminActionsProps) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const { toast } = useToast();

  const quickStats = {
    totalProperties: properties.length,
    occupiedProperties: properties.filter(p => p.isOccupied).length,
    totalTenants: tenants.length,
    overduePayments: tenants.filter(t => t.paymentStatus === 'overdue').length,
    monthlyRevenue: tenants.reduce((sum, t) => sum + parseFloat(t.rentAmount || '0'), 0)
  };

  const handleBulkPropertyAction = (action: string) => {
    if (selectedProperties.length === 0) {
      toast({
        title: "Nenhum imóvel selecionado",
        description: "Selecione ao menos um imóvel para executar esta ação.",
        variant: "destructive"
      });
      return;
    }

    onBulkAction(action, selectedProperties);
    setSelectedProperties([]);
    
    toast({
      title: "Ação executada",
      description: `Ação "${action}" executada em ${selectedProperties.length} imóvel(is).`
    });
  };

  const handleBulkTenantAction = (action: string) => {
    if (selectedTenants.length === 0) {
      toast({
        title: "Nenhum inquilino selecionado",
        description: "Selecione ao menos um inquilino para executar esta ação.",
        variant: "destructive"
      });
      return;
    }

    onBulkAction(action, selectedTenants);
    setSelectedTenants([]);
    
    toast({
      title: "Ação executada",
      description: `Ação "${action}" executada em ${selectedTenants.length} inquilino(s).`
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Imóveis</p>
                <p className="text-2xl font-bold">{quickStats.totalProperties}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupados</p>
                <p className="text-2xl font-bold">{quickStats.occupiedProperties}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inquilinos</p>
                <p className="text-2xl font-bold">{quickStats.totalTenants}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-destructive">{quickStats.overduePayments}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita/Mês</p>
                <p className="text-xl font-bold">R$ {quickStats.monthlyRevenue.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">Gerenciar Imóveis</TabsTrigger>
          <TabsTrigger value="tenants">Gerenciar Inquilinos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ações em Massa - Imóveis</CardTitle>
                  <CardDescription>Selecione imóveis e execute ações em lote</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkPropertyAction('export')}
                    disabled={selectedProperties.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleBulkPropertyAction('notify')}
                    disabled={selectedProperties.length === 0}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Notificar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedProperties.length === properties.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProperties(properties.map(p => p.id));
                          } else {
                            setSelectedProperties([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(property.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProperties(prev => [...prev, property.id]);
                            } else {
                              setSelectedProperties(prev => prev.filter(id => id !== property.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{property.name}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>
                        <Badge variant={property.isOccupied ? "default" : "secondary"}>
                          {property.isOccupied ? "Ocupado" : "Disponível"}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {property.rent}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPropertyAction('edit', property.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPropertyAction('inspect', property.id)}
                          >
                            Vistoriar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ações em Massa - Inquilinos</CardTitle>
                  <CardDescription>Selecione inquilinos e execute ações em lote</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleBulkTenantAction('reminder')}
                    disabled={selectedTenants.length === 0}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Lembrete Pagamento
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleBulkTenantAction('export')}
                    disabled={selectedTenants.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedTenants.length === tenants.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTenants(tenants.map(t => t.id));
                          } else {
                            setSelectedTenants([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Status Pagamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => {
                    const property = properties.find(p => p.id === tenant.propertyId);
                    return (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTenants.includes(tenant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTenants(prev => [...prev, tenant.id]);
                              } else {
                                setSelectedTenants(prev => prev.filter(id => id !== tenant.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{tenant.email}</TableCell>
                        <TableCell>{property?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              tenant.paymentStatus === 'paid' ? 'default' :
                              tenant.paymentStatus === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {tenant.paymentStatus === 'paid' ? 'Pago' :
                             tenant.paymentStatus === 'pending' ? 'Pendente' : 'Atrasado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onTenantAction('contact', tenant.id)}
                            >
                              Contatar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onTenantAction('history', tenant.id)}
                            >
                              Histórico
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <ReportsSystem 
            properties={properties.map(p => ({
              id: p.id,
              name: p.name,
              address: p.address,
              rent_amount: parseFloat(p.rent || '0'),
              is_occupied: p.isOccupied,
              tenant_id: p.tenantId
            }))}
            tenants={tenants.map(t => ({
              id: t.id,
              name: t.name,
              email: t.email,
              property_id: t.propertyId
            }))}
            payments={payments}
            repairRequests={repairRequests}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};