
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  Trash2, 
  Edit3,
  FileText,
  Upload
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

interface PropertyManagementProps {
  properties: Property[];
  tenants: Tenant[];
  onUpdateProperty: (property: Property) => void;
  onDeleteProperty: (id: string) => void;
  onUpdateTenant: (tenant: Tenant) => void;
  onDeleteTenant: (id: string) => void;
  onUploadContract: (propertyId: string, file: File) => void;
}

export const PropertyManagement = ({ 
  properties, 
  tenants, 
  onUpdateProperty, 
  onDeleteProperty,
  onUpdateTenant,
  onDeleteTenant,
  onUploadContract
}: PropertyManagementProps) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const handleDeleteProperty = (id: string) => {
    const hasActiveTenant = tenants.some(tenant => tenant.propertyId === id);
    if (hasActiveTenant) {
      toast({
        title: "Não é possível excluir",
        description: "Este imóvel possui inquilino ativo.",
        variant: "destructive"
      });
      return;
    }
    onDeleteProperty(id);
    toast({
      title: "Imóvel excluído",
      description: "O imóvel foi removido com sucesso."
    });
  };

  const handleDeleteTenant = (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    if (tenant) {
      // Liberar o imóvel
      const property = properties.find(p => p.id === tenant.propertyId);
      if (property) {
        onUpdateProperty({ ...property, isOccupied: false, tenantId: undefined });
      }
    }
    onDeleteTenant(id);
    toast({
      title: "Inquilino removido",
      description: "O inquilino foi removido com sucesso."
    });
  };

  const handleUpdatePaymentStatus = (tenantId: string, status: 'paid' | 'pending' | 'overdue') => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      onUpdateTenant({ ...tenant, paymentStatus: status });
      toast({
        title: "Status atualizado",
        description: `Status de pagamento alterado para ${status === 'paid' ? 'Pago' : status === 'pending' ? 'Pendente' : 'Atrasado'}.`
      });
    }
  };

  const handleFileUpload = (propertyId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadContract(propertyId, file);
      toast({
        title: "Contrato enviado",
        description: "O arquivo do contrato foi salvo com sucesso."
      });
    }
  };

  const getPropertyTenant = (propertyId: string) => {
    return tenants.find(tenant => tenant.propertyId === propertyId);
  };

  return (
    <div className="space-y-6">
      {/* Gerenciamento de Imóveis */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Gerenciar Imóveis
          </CardTitle>
          <CardDescription>Visualize e gerencie todos os imóveis cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Aluguel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                const tenant = getPropertyTenant(property.id);
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>R$ {property.rent}</TableCell>
                    <TableCell>
                      <Badge variant={property.isOccupied ? "default" : "secondary"}>
                        {property.isOccupied ? "Ocupado" : "Disponível"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tenant ? tenant.name : "Nenhum"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          id={`contract-${property.id}`}
                          onChange={(e) => handleFileUpload(property.id, e)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`contract-${property.id}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {property.contractFile ? "Atualizar" : "Upload"}
                        </Button>
                        {property.contractFile && (
                          <Badge variant="outline">PDF</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProperty(property)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Gerenciamento de Inquilinos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciar Inquilinos
          </CardTitle>
          <CardDescription>Visualize e gerencie todos os inquilinos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Aluguel</TableHead>
                <TableHead>Status Pagamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const property = properties.find(p => p.id === tenant.propertyId);
                return (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{property?.name || "N/A"}</TableCell>
                    <TableCell>R$ {tenant.rentAmount}</TableCell>
                    <TableCell>
                      <Select
                        value={tenant.paymentStatus}
                        onValueChange={(value: 'paid' | 'pending' | 'overdue') => 
                          handleUpdatePaymentStatus(tenant.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="overdue">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTenant(tenant)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
};
