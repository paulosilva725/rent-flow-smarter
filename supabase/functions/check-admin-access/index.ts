import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ADMIN-ACCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        hasAccess: false, 
        reason: "No authorization header" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("User authentication failed", { error: userError });
      return new Response(JSON.stringify({ 
        hasAccess: false, 
        reason: "Authentication failed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      logStep("Profile not found", { error: profileError });
      return new Response(JSON.stringify({ 
        hasAccess: false, 
        reason: "Profile not found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // If not admin, allow access (this is for admin-specific access check)
    if (profile.role !== "admin") {
      return new Response(JSON.stringify({ 
        hasAccess: true, 
        reason: "Not an admin user" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get subscription for admin
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from("system_subscriptions")
      .select("*")
      .eq("owner_id", profile.id)
      .single();

    if (subscriptionError || !subscription) {
      logStep("Subscription not found", { error: subscriptionError });
      return new Response(JSON.stringify({ 
        hasAccess: false, 
        reason: "No subscription found",
        subscription: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Subscription found", { 
      subscriptionId: subscription.id,
      status: subscription.status,
      credits: subscription.credits,
      isBlocked: subscription.is_blocked
    });

    // Check if admin has access
    const hasCredits = subscription.credits > 0;
    const isNotBlocked = !subscription.is_blocked;
    const isActiveOrTrial = ["active", "trial"].includes(subscription.status);
    const hasAccess = hasCredits && isNotBlocked && isActiveOrTrial;

    let reason = "";
    if (!hasCredits) reason = "Sem créditos disponíveis";
    else if (subscription.is_blocked) reason = subscription.block_reason || "Conta bloqueada";
    else if (!isActiveOrTrial) reason = "Assinatura inativa";

    logStep("Access check result", { 
      hasAccess, 
      reason,
      hasCredits,
      isNotBlocked,
      isActiveOrTrial
    });

    return new Response(JSON.stringify({ 
      hasAccess,
      reason,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        credits: subscription.credits,
        is_blocked: subscription.is_blocked,
        block_reason: subscription.block_reason,
        credits_updated_at: subscription.credits_updated_at
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-admin-access", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      hasAccess: false,
      reason: "Internal server error",
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});