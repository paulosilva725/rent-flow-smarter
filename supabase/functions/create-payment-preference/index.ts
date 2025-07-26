import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    
    if (!userData.user) {
      throw new Error("Usuário não autenticado");
    }

    const { tenant_id, property_id, amount, reference_month } = await req.json();

    // Buscar configurações do admin para esta propriedade
    const { data: property } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (!property) {
      throw new Error("Propriedade não encontrada");
    }

    // Buscar configurações do admin
    const { data: adminSettings } = await supabaseAdmin
      .from("admin_settings")
      .select("*")
      .limit(1)
      .single();

    if (!adminSettings?.mercadopago_access_token) {
      throw new Error("Configurações do Mercado Pago não encontradas");
    }

    // Buscar dados do inquilino
    const { data: tenant } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", tenant_id)
      .single();

    if (!tenant) {
      throw new Error("Inquilino não encontrado");
    }

    // Criar preferência no Mercado Pago
    const preferenceData = {
      items: [
        {
          title: `Aluguel ${property.name} - ${reference_month}`,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        name: tenant.name,
        email: tenant.email,
      },
      external_reference: `${tenant_id}_${property_id}_${reference_month}`,
      notification_url: adminSettings.webhook_url || undefined,
      back_urls: {
        success: `${req.headers.get("origin")}/dashboard?payment=success`,
        failure: `${req.headers.get("origin")}/dashboard?payment=failure`,
        pending: `${req.headers.get("origin")}/dashboard?payment=pending`,
      },
      auto_return: "approved",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${adminSettings.mercadopago_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("MercadoPago error:", errorData);
      throw new Error("Erro ao criar preferência de pagamento");
    }

    const preference = await response.json();

    // Salvar pagamento pendente no banco
    await supabaseAdmin.from("payments").insert({
      tenant_id,
      property_id,
      preference_id: preference.id,
      amount,
      reference_month,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment preference:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});