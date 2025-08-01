
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PropertyForm } from "./PropertyForm";
import { TenantForm } from "./TenantForm";
import { 
  Building2, 
  Users, 
  Trash2, 
  Edit3,
  FileText,
  Upload,
  Eye
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
  security_deposit?: string;
  isOccupied: boolean;
  tenantId?: string;
  contractFile?: string;
  contractStartDate?: string;
  contractEndDate?: string;
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
  onCreateProperty?: () => void;
}

export const PropertyManagement = ({ 
  properties, 
  tenants, 
  onUpdateProperty, 
  onDeleteProperty,
  onUpdateTenant,
  onDeleteTenant,
  onUploadContract,
  onCreateProperty
}: PropertyManagementProps) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());
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
      // Verificar se é um arquivo PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive"
        });
        return;
      }

      // Salvar o arquivo na memória para permitir visualização
      setUploadedFiles(prev => new Map(prev.set(propertyId, file)));
      
      onUploadContract(propertyId, file);
      toast({
        title: "Contrato salvo com sucesso!",
        description: `Arquivo "${file.name}" foi anexado ao imóvel.`
      });
      
      // Limpar o input para permitir upload do mesmo arquivo novamente se necessário
      event.target.value = '';
    }
  };

  const handleOpenPDF = (propertyId: string, fileName: string) => {
    const file = uploadedFiles.get(propertyId);
    if (file) {
      // Criar URL temporária para o arquivo
      const fileURL = URL.createObjectURL(file);
      // Abrir o PDF em uma nova aba
      window.open(fileURL, '_blank');
      
      // Liberar a URL após um tempo para evitar vazamento de memória
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    } else {
      toast({
        title: "Arquivo não disponível",
        description: "O arquivo PDF não está mais disponível na memória. Faça upload novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditProperty = (data: any) => {
    if (selectedProperty) {
      const updatedProperty = { ...selectedProperty, ...data };
      onUpdateProperty(updatedProperty);
      setSelectedProperty(null);
      toast({
        title: "Imóvel atualizado",
        description: "As informações do imóvel foram atualizadas com sucesso."
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Gerenciar Imóveis
              </CardTitle>
              <CardDescription>Visualize e gerencie todos os imóveis cadastrados</CardDescription>
            </div>
            {onCreateProperty && (
              <Button onClick={onCreateProperty}>
                Cadastrar Propriedade
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Aluguel</TableHead>
                <TableHead>Caução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Status Pagamento</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Datas do Contrato</TableHead>
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
                      {property.security_deposit ? `R$ ${property.security_deposit}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            property.isOccupied ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          title={property.isOccupied ? 'Imóvel ocupado' : 'Imóvel disponível'}
                        />
                        <Badge variant={property.isOccupied ? "destructive" : "default"}>
                          {property.isOccupied ? "Ocupado" : "Disponível"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant ? tenant.name : "Nenhum"}
                    </TableCell>
                    <TableCell>
                      {tenant ? (
                        <Badge 
                          variant={
                            tenant.paymentStatus === 'paid' ? 'default' : 
                            tenant.paymentStatus === 'pending' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {tenant.paymentStatus === 'paid' ? 'Pago' : 
                           tenant.paymentStatus === 'pending' ? 'Pendente' : 
                           'Vencido'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPDF(property.id, property.contractFile!)}
                            className="text-primary hover:text-primary-foreground"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Baixar PDF
                          </Button>
                        )}
                      </div>
                    </TableCell>
                     <TableCell>
                      {tenant && tenant.startDate && tenant.endDate ? (
                        <div className="text-sm">
                          <div>Início: {new Date(tenant.startDate).toLocaleDateString('pt-BR')}</div>
                          <div>Fim: {new Date(tenant.endDate).toLocaleDateString('pt-BR')}</div>
                          {(() => {
                            const daysUntilExpiry = Math.ceil((new Date(tenant.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            if (daysUntilExpiry <= 0) {
                              return <div className="text-red-600 text-xs">⚠️ Vencido há {Math.abs(daysUntilExpiry)} dias</div>;
                            } else if (daysUntilExpiry <= 30) {
                              return <div className="text-yellow-600 text-xs">⚠️ Vence em {daysUntilExpiry} dias</div>;
                            }
                            return <div className="text-green-600 text-xs">✅ Em dia</div>;
                          })()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem contrato</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProperty(property)}
                          title="Editar propriedade"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
                          title="Excluir propriedade"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {tenant && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTenant(tenant.id)}
                            title="Remover inquilino"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        )}
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

      {/* Dialog para editar propriedade */}
      {selectedProperty && (
        <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Imóvel</DialogTitle>
            </DialogHeader>
            <PropertyForm
              onClose={() => setSelectedProperty(null)}
              onSubmit={handleEditProperty}
              initialData={{
                name: selectedProperty.name,
                address: selectedProperty.address,
                rent: selectedProperty.rent,
                description: selectedProperty.description || "",
                bedrooms: selectedProperty.bedrooms || "",
                bathrooms: selectedProperty.bathrooms || "",
                area: selectedProperty.area || "",
                securityDeposit: selectedProperty.security_deposit || ""
              }}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para editar inquilino */}
      {selectedTenant && (
        <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Inquilino</DialogTitle>
            </DialogHeader>
            <TenantForm
              onClose={() => setSelectedTenant(null)}
              onSubmit={(data) => {
                if (selectedTenant) {
                  const updatedTenant = {
                    ...selectedTenant,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    document: data.document,
                    propertyId: data.propertyId,
                    rentAmount: data.rentAmount,
                    startDate: data.startDate,
                    endDate: data.endDate
                  };
                  onUpdateTenant(updatedTenant);
                  setSelectedTenant(null);
                }
              }}
              properties={properties}
              initialData={{
                name: selectedTenant.name,
                email: selectedTenant.email,
                phone: selectedTenant.phone || "",
                document: selectedTenant.document || "",
                propertyId: selectedTenant.propertyId,
                rentAmount: selectedTenant.rentAmount || "",
                startDate: selectedTenant.startDate || "",
                endDate: selectedTenant.endDate || ""
              }}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
