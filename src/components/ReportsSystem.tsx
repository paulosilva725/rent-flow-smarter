import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Calendar,
  DollarSign,
  Home,
  Users,
  Wrench
} from "lucide-react";
import jsPDF from 'jspdf';

interface Property {
  id: string;
  name: string;
  address: string;
  rent_amount: number;
  is_occupied: boolean;
  tenant_id?: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  property_id?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  reference_month: string;
  tenant_id: string;
  property_id: string;
}

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  requestDate: string;
  tenantId: string;
  propertyId: string;
}

interface ReportsSystemProps {
  properties: Property[];
  tenants: Tenant[];
  payments: Payment[];
  repairRequests: RepairRequest[];
}

export const ReportsSystem = ({ properties, tenants, payments, repairRequests }: ReportsSystemProps) => {
  const [reportType, setReportType] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const { toast } = useToast();

  const generateFinancialReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 20);
    doc.setFontSize(12);
    doc.text(`Gerado em: ${currentDate}`, 20, 30);
    
    if (dateRange.start && dateRange.end) {
      doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 20, 40);
    }
    
    // Summary
    doc.setFontSize(16);
    doc.text('Resumo Financeiro', 20, 60);
    
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.is_occupied).length;
    const totalRent = properties.reduce((sum, p) => sum + p.rent_amount, 0);
    const totalPaid = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    
    doc.setFontSize(12);
    doc.text(`Total de Imóveis: ${totalProperties}`, 20, 80);
    doc.text(`Imóveis Ocupados: ${occupiedProperties}`, 20, 90);
    doc.text(`Receita Potencial: R$ ${totalRent.toFixed(2)}`, 20, 100);
    doc.text(`Pagamentos Recebidos: R$ ${totalPaid.toFixed(2)}`, 20, 110);
    doc.text(`Pagamentos Pendentes: R$ ${totalPending.toFixed(2)}`, 20, 120);
    
    // Properties details
    doc.setFontSize(16);
    doc.text('Detalhes dos Imóveis', 20, 150);
    
    let yPosition = 170;
    properties.forEach((property, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${property.name}`, 20, yPosition);
      doc.text(`   Endereço: ${property.address}`, 20, yPosition + 10);
      doc.text(`   Aluguel: R$ ${property.rent_amount.toFixed(2)}`, 20, yPosition + 20);
      doc.text(`   Status: ${property.is_occupied ? 'Ocupado' : 'Disponível'}`, 20, yPosition + 30);
      yPosition += 50;
    });
    
    doc.save('relatorio-financeiro.pdf');
  };

  const generateOccupancyReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Ocupação', 20, 20);
    doc.setFontSize(12);
    doc.text(`Gerado em: ${currentDate}`, 20, 30);
    
    // Statistics
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.is_occupied).length;
    const vacantProperties = totalProperties - occupiedProperties;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties * 100).toFixed(1) : 0;
    
    doc.setFontSize(16);
    doc.text('Estatísticas de Ocupação', 20, 60);
    doc.setFontSize(12);
    doc.text(`Total de Imóveis: ${totalProperties}`, 20, 80);
    doc.text(`Imóveis Ocupados: ${occupiedProperties}`, 20, 90);
    doc.text(`Imóveis Disponíveis: ${vacantProperties}`, 20, 100);
    doc.text(`Taxa de Ocupação: ${occupancyRate}%`, 20, 110);
    
    // Properties list
    doc.setFontSize(16);
    doc.text('Lista de Imóveis', 20, 140);
    
    let yPosition = 160;
    properties.forEach((property, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const tenant = tenants.find(t => t.id === property.tenant_id);
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${property.name}`, 20, yPosition);
      doc.text(`   Status: ${property.is_occupied ? 'Ocupado' : 'Disponível'}`, 20, yPosition + 10);
      if (tenant) {
        doc.text(`   Inquilino: ${tenant.name}`, 20, yPosition + 20);
      }
      yPosition += 40;
    });
    
    doc.save('relatorio-ocupacao.pdf');
  };

  const generateTenantReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Inquilinos', 20, 20);
    doc.setFontSize(12);
    doc.text(`Gerado em: ${currentDate}`, 20, 30);
    
    // Summary
    doc.setFontSize(16);
    doc.text('Resumo de Inquilinos', 20, 60);
    doc.setFontSize(12);
    doc.text(`Total de Inquilinos: ${tenants.length}`, 20, 80);
    
    // Tenants list
    doc.setFontSize(16);
    doc.text('Lista de Inquilinos', 20, 110);
    
    let yPosition = 130;
    tenants.forEach((tenant, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const property = properties.find(p => p.tenant_id === tenant.id);
      const tenantPayments = payments.filter(p => p.tenant_id === tenant.id);
      const paidCount = tenantPayments.filter(p => p.status === 'approved').length;
      const pendingCount = tenantPayments.filter(p => p.status === 'pending').length;
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${tenant.name}`, 20, yPosition);
      doc.text(`   Email: ${tenant.email}`, 20, yPosition + 10);
      if (property) {
        doc.text(`   Imóvel: ${property.name}`, 20, yPosition + 20);
      }
      doc.text(`   Pagamentos: ${paidCount} pagos, ${pendingCount} pendentes`, 20, yPosition + 30);
      yPosition += 50;
    });
    
    doc.save('relatorio-inquilinos.pdf');
  };

  const generateRepairsReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Reparos', 20, 20);
    doc.setFontSize(12);
    doc.text(`Gerado em: ${currentDate}`, 20, 30);
    
    // Summary
    const totalRequests = repairRequests.length;
    const pendingRequests = repairRequests.filter(r => r.status === 'pending').length;
    const inProgressRequests = repairRequests.filter(r => r.status === 'in-progress').length;
    const completedRequests = repairRequests.filter(r => r.status === 'completed').length;
    
    doc.setFontSize(16);
    doc.text('Resumo de Reparos', 20, 60);
    doc.setFontSize(12);
    doc.text(`Total de Solicitações: ${totalRequests}`, 20, 80);
    doc.text(`Pendentes: ${pendingRequests}`, 20, 90);
    doc.text(`Em Andamento: ${inProgressRequests}`, 20, 100);
    doc.text(`Concluídos: ${completedRequests}`, 20, 110);
    
    // Requests list
    doc.setFontSize(16);
    doc.text('Lista de Solicitações', 20, 140);
    
    let yPosition = 160;
    repairRequests.forEach((request, index) => {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }
      
      const property = properties.find(p => p.id === request.propertyId);
      const tenant = tenants.find(t => t.id === request.tenantId);
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${request.title}`, 20, yPosition);
      doc.text(`   Categoria: ${request.category}`, 20, yPosition + 10);
      doc.text(`   Prioridade: ${request.priority}`, 20, yPosition + 20);
      doc.text(`   Status: ${request.status}`, 20, yPosition + 30);
      if (property) doc.text(`   Imóvel: ${property.name}`, 20, yPosition + 40);
      if (tenant) doc.text(`   Inquilino: ${tenant.name}`, 20, yPosition + 50);
      yPosition += 70;
    });
    
    doc.save('relatorio-reparos.pdf');
  };

  const generateReport = () => {
    if (!reportType) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de relatório.",
        variant: "destructive"
      });
      return;
    }

    switch (reportType) {
      case 'financial':
        generateFinancialReport();
        break;
      case 'occupancy':
        generateOccupancyReport();
        break;
      case 'tenants':
        generateTenantReport();
        break;
      case 'repairs':
        generateRepairsReport();
        break;
      default:
        toast({
          title: "Erro",
          description: "Tipo de relatório não reconhecido.",
          variant: "destructive"
        });
        return;
    }

    toast({
      title: "Relatório gerado!",
      description: "O relatório foi gerado e baixado com sucesso."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Sistema de Relatórios
        </CardTitle>
        <CardDescription>
          Gere relatórios detalhados em PDF para análise e impressão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reportType">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Relatório Financeiro
                  </div>
                </SelectItem>
                <SelectItem value="occupancy">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Relatório de Ocupação
                  </div>
                </SelectItem>
                <SelectItem value="tenants">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Relatório de Inquilinos
                  </div>
                </SelectItem>
                <SelectItem value="repairs">
                  <div className="flex items-center">
                    <Wrench className="h-4 w-4 mr-2" />
                    Relatório de Reparos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Data Inicial (Opcional)</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Data Final (Opcional)</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <Button onClick={generateReport} className="w-full" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Gerar e Baixar Relatório PDF
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => { setReportType('financial'); generateFinancialReport(); }}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <DollarSign className="h-6 w-6" />
            <span>Relatório Financeiro</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => { setReportType('occupancy'); generateOccupancyReport(); }}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Home className="h-6 w-6" />
            <span>Relatório de Ocupação</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => { setReportType('tenants'); generateTenantReport(); }}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Users className="h-6 w-6" />
            <span>Relatório de Inquilinos</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => { setReportType('repairs'); generateRepairsReport(); }}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Wrench className="h-6 w-6" />
            <span>Relatório de Reparos</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};