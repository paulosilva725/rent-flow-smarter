import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminAccessData {
  hasAccess: boolean;
  reason: string;
  subscription?: {
    id: string;
    status: string;
    credits: number;
    is_blocked: boolean;
    block_reason?: string;
    credits_updated_at: string;
  };
}

export function useAdminAccess() {
  const [accessData, setAccessData] = useState<AdminAccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('check-admin-access');

      if (functionError) {
        throw functionError;
      }

      setAccessData(data);

      // Show toast if access is blocked
      if (!data.hasAccess && data.reason) {
        toast({
          title: "Acesso Bloqueado",
          description: data.reason,
          variant: "destructive"
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao verificar acesso";
      setError(errorMessage);
      console.error("Error checking admin access:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  return {
    accessData,
    loading,
    error,
    refetch: checkAccess
  };
}