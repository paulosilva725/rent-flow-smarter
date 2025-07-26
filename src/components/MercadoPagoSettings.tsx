import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Save } from "lucide-react";

interface MercadoPagoSettingsProps {
  adminId: string;
}

const MercadoPagoSettings = ({ adminId }: MercadoPagoSettingsProps) => {
  const [settings, setSettings] = useState({
    access_token: "",
    public_key: "",
    webhook_url: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTokens, setShowTokens] = useState({
    access_token: false,
    public_key: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [adminId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("admin_id", adminId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching settings:", error);
      return;
    }

    if (data) {
      setSettings({
        access_token: data.mercadopago_access_token || "",
        public_key: data.mercadopago_public_key || "",
        webhook_url: data.webhook_url || "",
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
          mercadopago_access_token: settings.access_token,
          mercadopago_public_key: settings.public_key,
          webhook_url: settings.webhook_url,
        })
        .eq("admin_id", adminId);
    } else {
      result = await supabase
        .from("admin_settings")
        .insert({
          admin_id: adminId,
          mercadopago_access_token: settings.access_token,
          mercadopago_public_key: settings.public_key,
          webhook_url: settings.webhook_url,
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
        description: "As configurações do Mercado Pago foram salvas com sucesso.",
      });
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Mercado Pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="access_token">Access Token</Label>
          <div className="relative">
            <Input
              id="access_token"
              type={showTokens.access_token ? "text" : "password"}
              value={settings.access_token}
              onChange={(e) => setSettings({ ...settings, access_token: e.target.value })}
              placeholder="APP_USR-..."
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowTokens({ ...showTokens, access_token: !showTokens.access_token })}
            >
              {showTokens.access_token ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Token de acesso do Mercado Pago para processar pagamentos
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="public_key">Public Key</Label>
          <div className="relative">
            <Input
              id="public_key"
              type={showTokens.public_key ? "text" : "password"}
              value={settings.public_key}
              onChange={(e) => setSettings({ ...settings, public_key: e.target.value })}
              placeholder="APP_USR-..."
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowTokens({ ...showTokens, public_key: !showTokens.public_key })}
            >
              {showTokens.public_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Chave pública do Mercado Pago para identificar a aplicação
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook_url">Webhook URL</Label>
          <Input
            id="webhook_url"
            value={settings.webhook_url}
            onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
            placeholder="https://yourapp.com/webhook"
          />
          <p className="text-sm text-muted-foreground">
            URL para receber notificações de pagamento (opcional)
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Como obter suas credenciais:</h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Acesse sua conta no Mercado Pago</li>
            <li>2. Vá em "Configurações" → "Credenciais"</li>
            <li>3. Copie o Access Token e Public Key</li>
            <li>4. Cole aqui e salve as configurações</li>
          </ol>
        </div>

        <Button onClick={saveSettings} disabled={isLoading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoSettings;