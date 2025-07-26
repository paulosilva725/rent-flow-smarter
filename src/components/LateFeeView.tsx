import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Clock, AlertTriangle, DollarSign, Calendar } from "lucide-react";

interface LateFee {
  id: string;
  payment_month: string;
  original_amount: number;
  late_fee_amount: number;
  days_late: number;
  fee_percentage: number;
  status: string;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  rent_amount: number;
  security_deposit: number;
}

interface LateFeeViewProps {
  tenantId: string;
  propertyId: string;
}

const LateFeeView = ({ tenantId, propertyId }: LateFeeViewProps) => {
  const [lateFees, setLateFees] = useState<LateFee[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [settings, setSettings] = useState({
    late_fee_percentage: 2.0,
    late_fee_grace_days: 5,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId, propertyId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar taxas de atraso
      const { data: feesData, error: feesError } = await supabase
        .from("late_fees")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (feesError) throw feesError;
      setLateFees(feesData || []);

      // Buscar dados da propriedade
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("id, name, rent_amount, security_deposit")
        .eq("id", propertyId)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Buscar configurações de taxa
      const { data: settingsData, error: settingsError } = await supabase
        .from("admin_settings")
        .select("late_fee_percentage, late_fee_grace_days")
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching settings:", settingsError);
      } else if (settingsData) {
        setSettings({
          late_fee_percentage: settingsData.late_fee_percentage || 2.0,
          late_fee_grace_days: settingsData.late_fee_grace_days || 5,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePotentialLateFee = (daysLate: number, rentAmount: number) => {
    if (daysLate <= settings.late_fee_grace_days) return 0;
    const effectiveDaysLate = daysLate - settings.late_fee_grace_days;
    return (rentAmount * (settings.late_fee_percentage / 100) * effectiveDaysLate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do Imóvel e Configurações */}
      {property && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Informações Financeiras - {property.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground">Valor do Aluguel</h4>
                <p className="text-2xl font-bold">{formatCurrency(property.rent_amount)}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground">Caução/Depósito</h4>
                <p className="text-2xl font-bold">{formatCurrency(property.security_deposit)}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground">Taxa de Atraso</h4>
                <p className="text-lg font-bold">{settings.late_fee_percentage}% por dia</p>
                <p className="text-sm text-muted-foreground">Após {settings.late_fee_grace_days} dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre Taxa de Atraso */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona a taxa de atraso:</strong>
          <br />
          • Você tem {settings.late_fee_grace_days} dias de carência após o vencimento
          • Após esse período, será cobrada taxa de {settings.late_fee_percentage}% por dia de atraso
          • A taxa é calculada sobre o valor total do aluguel
          {property && (
            <>
              <br />
              • Exemplo: 10 dias de atraso = {formatCurrency(calculatePotentialLateFee(10, property.rent_amount))} de taxa
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Histórico de Taxas de Atraso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Taxas de Atraso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lateFees.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma taxa de atraso registrada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Mantenha seus pagamentos em dia para evitar taxas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lateFees.map((fee) => (
                <div key={fee.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">Referência: {fee.payment_month}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Gerada em {formatDate(fee.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(fee.status)}>
                      {fee.status === "pending" && "Pendente"}
                      {fee.status === "paid" && "Paga"}
                      {fee.status === "cancelled" && "Cancelada"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor Original:</span>
                      <p className="font-medium">{formatCurrency(fee.original_amount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dias de Atraso:</span>
                      <p className="font-medium">{fee.days_late} dias</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Percentual:</span>
                      <p className="font-medium">{fee.fee_percentage}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taxa Aplicada:</span>
                      <p className="font-medium text-red-600">{formatCurrency(fee.late_fee_amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LateFeeView;