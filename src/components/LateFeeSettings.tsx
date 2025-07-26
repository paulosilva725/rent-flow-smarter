import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Percent, Calendar } from "lucide-react";

interface LateFeeSettingsProps {
  adminId: string;
}

const LateFeeSettings = ({ adminId }: LateFeeSettingsProps) => {
  const [settings, setSettings] = useState({
    late_fee_percentage: 2.0,
    late_fee_grace_days: 5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [adminId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("late_fee_percentage, late_fee_grace_days")
      .eq("admin_id", adminId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error);
      return;
    }

    if (data) {
      setSettings({
        late_fee_percentage: data.late_fee_percentage || 2.0,
        late_fee_grace_days: data.late_fee_grace_days || 5,
      });
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);

    const { data: existingSettings } = await supabase
      .from("admin_settings")
      .select("id")
      .eq("admin_id", adminId)
      .single();

    let result;
    if (existingSettings) {
      result = await supabase
        .from("admin_settings")
        .update({
          late_fee_percentage: settings.late_fee_percentage,
          late_fee_grace_days: settings.late_fee_grace_days,
        })
        .eq("admin_id", adminId);
    } else {
      result = await supabase
        .from("admin_settings")
        .insert({
          admin_id: adminId,
          late_fee_percentage: settings.late_fee_percentage,
          late_fee_grace_days: settings.late_fee_grace_days,
        });
    }

    if (result.error) {
      toast({
        title: "Erro ao salvar configurações",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configurações salvas",
        description: "As configurações de taxa de atraso foram salvas com sucesso.",
      });
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Configurações de Taxa de Atraso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="late_fee_percentage" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Percentual da Taxa de Atraso (%)
          </Label>
          <Input
            id="late_fee_percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={settings.late_fee_percentage}
            onChange={(e) => setSettings({ 
              ...settings, 
              late_fee_percentage: parseFloat(e.target.value) || 0 
            })}
            placeholder="2.0"
          />
          <p className="text-sm text-muted-foreground">
            Percentual aplicado sobre o valor do aluguel para cada dia de atraso
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="late_fee_grace_days" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dias de Carência
          </Label>
          <Input
            id="late_fee_grace_days"
            type="number"
            min="0"
            max="30"
            value={settings.late_fee_grace_days}
            onChange={(e) => setSettings({ 
              ...settings, 
              late_fee_grace_days: parseInt(e.target.value) || 0 
            })}
            placeholder="5"
          />
          <p className="text-sm text-muted-foreground">
            Número de dias após o vencimento antes de aplicar a taxa de atraso
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Como funciona:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Após {settings.late_fee_grace_days} dias de atraso, será aplicada a taxa</li>
            <li>• Taxa de {settings.late_fee_percentage}% por dia de atraso sobre o valor do aluguel</li>
            <li>• Exemplo: Aluguel R$ 1.000, 10 dias de atraso = R$ {(1000 * (settings.late_fee_percentage/100) * Math.max(0, 10 - settings.late_fee_grace_days)).toFixed(2)} de taxa</li>
          </ul>
        </div>

        <Button onClick={saveSettings} disabled={isLoading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LateFeeSettings;